import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await apiFetch('/auth/me');
        setUser(data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  return { user, loading, logout };
}
