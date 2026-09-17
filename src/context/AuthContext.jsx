import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const role = localStorage.getItem('admin_role');
    const email = localStorage.getItem('admin_email');

    if (token && role && email) {
      setUser({ email, role, token });
      setRoles([role]);
    } else {
      setUser(null);
      setRoles([]);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res && res.token) {
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('admin_role', res.role);
      localStorage.setItem('admin_email', res.email);
      setUser({ email: res.email, role: res.role, token: res.token });
      setRoles([res.role]);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api('/api/admin/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_email');
      setUser(null);
      setRoles([]);
    }
  };

  const hasRole = (requiredRoles) => {
    if (!user || !user.role) return false;
    if (user.role === 'superadmin' || user.role === 'admin') return true;
    if (!requiredRoles) return true;
    const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return required.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, roles, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
