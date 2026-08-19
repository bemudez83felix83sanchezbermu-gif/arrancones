import { useCallback, useEffect, useState } from 'react';
import {
  createParticipant,
  deleteParticipant,
  listParticipants,
  updateParticipant,
} from './api.js';

export function useParticipants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncedAt, setSyncedAt] = useState(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const rows = await listParticipants();
      setParticipants(rows);
      setSyncedAt(new Date());
      setError('');
    } catch (err) {
      setError(err.detail ? `${err.message} — ${err.detail}` : err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (body) => {
    const participant = await createParticipant(body);
    setParticipants((prev) => [participant, ...prev]);
    return participant;
  }, []);

  const update = useCallback(async (id, body) => {
    const participant = await updateParticipant(id, body);
    setParticipants((prev) => prev.map((row) => (row.id === id ? participant : row)));
    return participant;
  }, []);

  const remove = useCallback(async (ids) => {
    const list = Array.isArray(ids) ? ids : [ids];
    await Promise.all(list.map((id) => deleteParticipant(id)));
    setParticipants((prev) => prev.filter((row) => !list.includes(row.id)));
  }, []);

  return { participants, loading, error, syncedAt, refresh, create, update, remove };
}
