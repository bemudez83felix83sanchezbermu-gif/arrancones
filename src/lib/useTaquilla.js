import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createTicketSale,
  createTicketType,
  deleteTicketType,
  fetchTaquilla,
  setTicketSaleVoided,
  updateTicketType,
} from './api.js';
import { validateSale } from '../../shared/taquilla.js';

/**
 * Estado de la taquilla con cola local: cada venta se guarda primero en este
 * dispositivo y después se sube. Si en la pista no hay señal, la venta no se
 * pierde y se reintenta sola; el `client_id` evita que se cuente dos veces.
 */

const PENDING_KEY = 'carfest_taquilla_pendientes_v1';
const CACHE_KEY = 'carfest_taquilla_cache_v1';
const CASHIER_KEY = 'carfest_taquilla_caja';
const POLL_MS = 30_000;
const RETRY_MS = 15_000;

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento disponible: el estado sigue en memoria.
  }
};

/** UUID v4. `randomUUID` no existe fuera de https (p. ej. probando por IP en la red local). */
function newClientId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const bySoldDesc = (a, b) => new Date(b.sold_at) - new Date(a.sold_at) || (b.id ?? 0) - (a.id ?? 0);
const sortTypes = (list) => [...list].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

/** Un error sin status es de red: la venta se queda en la cola. */
const isNetworkError = (err) => !err?.status;

export function useTaquilla() {
  const cache = useMemo(() => readJson(CACHE_KEY, null), []);
  const [types, setTypes] = useState(cache?.types ?? []);
  const [serverSales, setServerSales] = useState(cache?.sales ?? []);
  const [pending, setPending] = useState(() => readJson(PENDING_KEY, []));
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' && navigator.onLine === false,
  );
  const [syncing, setSyncing] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [syncedAt, setSyncedAt] = useState(null);
  const [cashier, setCashierState] = useState(() => {
    try {
      return localStorage.getItem(CASHIER_KEY) ?? '';
    } catch {
      return '';
    }
  });

  // Ventas recién subidas que un GET lanzado antes todavía no traería.
  const justSynced = useRef(new Map());
  const flushing = useRef(null);

  const handleFailure = useCallback((err) => {
    if (isNetworkError(err)) setOffline(true);
    else if (err.status === 401) setSessionExpired(true);
    else setError(err.detail ? `${err.message} — ${err.detail}` : err.message);
  }, []);

  const savePending = useCallback((next) => {
    writeJson(PENDING_KEY, next);
    setPending(next);
  }, []);

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const data = await fetchTaquilla();
        const ids = new Set(data.sales.map((sale) => sale.client_id));
        for (const id of justSynced.current.keys()) {
          if (ids.has(id)) justSynced.current.delete(id);
        }
        setTypes(sortTypes(data.types));
        setServerSales([...data.sales, ...justSynced.current.values()].sort(bySoldDesc));
        setSyncedAt(new Date());
        setError('');
        setOffline(false);
        setSessionExpired(false);
      } catch (err) {
        handleFailure(err);
      } finally {
        setLoading(false);
      }
    },
    [handleFailure],
  );

  /** Sube la cola en orden. Si ya se está subiendo, regresa esa misma promesa. */
  const flush = useCallback(() => {
    if (flushing.current) return flushing.current;

    const run = async () => {
      setSyncing(true);
      try {
        for (;;) {
          const entry = readJson(PENDING_KEY, []).find((item) => !item.failed);
          if (!entry) break;
          try {
            const sale = await createTicketSale(entry);
            justSynced.current.set(sale.client_id, sale);
            savePending(readJson(PENDING_KEY, []).filter((item) => item.client_id !== entry.client_id));
            setServerSales((prev) =>
              [sale, ...prev.filter((row) => row.client_id !== sale.client_id)].sort(bySoldDesc),
            );
            setOffline(false);
          } catch (err) {
            // Red, sesión o servidor caído: se reintenta más tarde tal cual.
            if (isNetworkError(err) || err.status === 401 || err.status >= 500) {
              handleFailure(err);
              break;
            }
            // El servidor la rechazó por datos: se marca para que no bloquee la cola.
            savePending(
              readJson(PENDING_KEY, []).map((item) =>
                item.client_id === entry.client_id ? { ...item, failed: err.message } : item,
              ),
            );
          }
        }
      } finally {
        setSyncing(false);
      }
    };

    flushing.current = run().finally(() => {
      flushing.current = null;
    });
    return flushing.current;
  }, [handleFailure, savePending]);

  useEffect(() => {
    refresh();
    flush();
  }, [refresh, flush]);

  useEffect(() => {
    if (!loading) writeJson(CACHE_KEY, { types, sales: serverSales });
  }, [types, serverSales, loading]);

  useEffect(() => {
    const onOnline = () => {
      setOffline(false);
      flush().then(() => refresh({ silent: true }));
    };
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') refresh({ silent: true });
    }, POLL_MS);
    const retry = setInterval(() => {
      if (readJson(PENDING_KEY, []).some((item) => !item.failed)) flush();
    }, RETRY_MS);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(poll);
      clearInterval(retry);
    };
  }, [flush, refresh]);

  /** Registra una venta. `queued` indica que quedó guardada en el dispositivo sin subir. */
  const sell = useCallback(
    async (draft) => {
      const { ok, errors, value } = validateSale({
        ...draft,
        client_id: newClientId(),
        sold_at: new Date().toISOString(),
      });
      if (!ok) return { ok, errors };

      const entry = { ...value, voided_at: null };
      savePending([...readJson(PENDING_KEY, []), entry]);
      await flush();
      const queued = readJson(PENDING_KEY, []).some((item) => item.client_id === entry.client_id);
      return { ok: true, sale: entry, queued };
    },
    [flush, savePending],
  );

  const replaceSale = useCallback((sale) => {
    setServerSales((prev) => prev.map((row) => (row.id === sale.id ? sale : row)));
  }, []);

  const voidSale = useCallback(
    async (id, reason) => {
      const sale = await setTicketSaleVoided(id, true, reason);
      replaceSale(sale);
      return sale;
    },
    [replaceSale],
  );

  const restoreSale = useCallback(
    async (id) => {
      const sale = await setTicketSaleVoided(id, false);
      replaceSale(sale);
      return sale;
    },
    [replaceSale],
  );

  const discardPending = useCallback(
    (clientId) => savePending(readJson(PENDING_KEY, []).filter((item) => item.client_id !== clientId)),
    [savePending],
  );

  const addType = useCallback(async (body) => {
    const type = await createTicketType(body);
    setTypes((prev) => sortTypes([...prev, type]));
    return type;
  }, []);

  const editType = useCallback(async (id, body) => {
    const type = await updateTicketType(id, body);
    setTypes((prev) => sortTypes(prev.map((row) => (row.id === id ? type : row))));
    return type;
  }, []);

  const removeType = useCallback(async (id) => {
    await deleteTicketType(id);
    setTypes((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const setCashier = useCallback((value) => {
    setCashierState(value);
    try {
      localStorage.setItem(CASHIER_KEY, value);
    } catch {
      // Sin almacenamiento: solo dura esta sesión.
    }
  }, []);

  const sales = useMemo(() => {
    const synced = new Set(serverSales.map((sale) => sale.client_id));
    const local = pending
      .filter((item) => !synced.has(item.client_id))
      .map((item) => ({ ...item, id: null, pending: true }));
    return [...local, ...serverSales].sort(bySoldDesc);
  }, [pending, serverSales]);

  return {
    types,
    sales,
    pendingCount: pending.filter((item) => !item.failed).length,
    failedCount: pending.filter((item) => item.failed).length,
    loading,
    error,
    offline,
    syncing,
    sessionExpired,
    syncedAt,
    cashier,
    setCashier,
    refresh,
    flush,
    sell,
    voidSale,
    restoreSale,
    discardPending,
    addType,
    editType,
    removeType,
  };
}
