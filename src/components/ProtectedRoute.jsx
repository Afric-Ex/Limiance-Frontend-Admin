import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#fff' }}>
        Loading Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0) {
    const isAuthorized = requiredRoles.some(role => hasRole(role));
    if (!isAuthorized) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ff4444', background: '#0a0a0a', height: '100vh' }}>
          <h2>Access Denied</h2>
          <p>You do not have the required role to view this page.</p>
        </div>
      );
    }
  }

  return children;
}
