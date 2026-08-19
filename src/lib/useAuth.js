import { useCallback, useEffect, useState } from 'react';
import { fetchCurrentAdmin, login as loginRequest, logout as logoutRequest } from './api';

export function useAuth() {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authed' | 'anon'
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const current = await fetchCurrentAdmin();
      setAdmin(current);
      setStatus('authed');
    } catch (err) {
      setAdmin(null);
      setStatus('anon');
      if (err?.status && err.status !== 401) setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
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
