import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
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
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--danger-text)', background: 'var(--bg-deep)', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2>Access Denied</h2>
          <p style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Your role ({user?.role}) does not have permission to view this section.
          </p>
          <a href="/" style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-surface-2)', color: 'var(--text-primary)', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem' }}>
            Return to Dashboard
          </a>
        </div>
      );
    }
  }

  return children;
}
