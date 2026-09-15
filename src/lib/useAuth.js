import { useCallback, useEffect, useState } from 'react';
import { fetchCurrentAdmin, login as loginRequest, logout as logoutRequest } from './api';

export function useAuth() {
  const [admin, setAdmin] = useState(null);
  // 'loading' | 'authed' | 'anon' | 'offline' (no se pudo preguntar al servidor)
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const current = await fetchCurrentAdmin();
      setAdmin(current);
      setStatus('authed');
    } catch (err) {
      // Sin señal no significa sesión cerrada: la taquilla debe seguir vendiendo.
      if (!err?.status) {
        setStatus((prev) => (prev === 'authed' ? prev : 'offline'));
        return;
      }
      setAdmin(null);
      setStatus('anon');
      if (err.status !== 401) setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => refresh();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const next = await loginRequest(credentials);
      setAdmin(next);
      setStatus('authed');
      return next;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAdmin(null);
      setStatus('anon');
    }
  }, []);

  return { admin, status, error, login, logout, refresh };
}
