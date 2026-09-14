import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const session = await api('/v1/auth/session');
      if (!session || !session.user_id) {
        setUser(null);
        setRoles([]);
        return;
      }
      setUser(session);
      // Fetch roles — API may return [{role: 'name', granted_at: '...'}, ...] or ['name', ...]
      const rolesData = await api(`/v1/admin/users/${session.user_id}/roles`).catch(() => ({ roles: [] }));
      const rawRoles = rolesData.roles || [];
      // Normalise: handle both string[] and {role, granted_at}[] formats
      const roleStrings = rawRoles.map(r => (typeof r === 'string' ? r : r.role)).filter(Boolean);
      setRoles(roleStrings);
    } catch (err) {
      setUser(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email, password) => {
    const res = await api('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    // In case TOTP is required, we return it to the caller to handle
    if (res.status === 'mfa_required') {
      return res; 
    }
    await fetchSession();
    return res;
  };

  const logout = async () => {
    await api('/v1/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setRoles([]);
  };

  const hasRole = (role) => roles.includes(role) || roles.includes('platform_administrator');

  return (
    <AuthContext.Provider value={{ user, roles, loading, login, logout, hasRole, fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
