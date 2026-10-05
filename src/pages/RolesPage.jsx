import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import './RolesPage.css';
import { ShimmerTableRows } from '../components/Shimmer';

const OPERATOR_ROLES = [
  { id: 'superadmin', name: 'Superadmin', desc: 'Full uncontrolled access to all operations, emergency controls, config, and staff management' },
  { id: 'config_admin', name: 'Config Admin', desc: 'Manage trading fees, RPCs, tokens, trading pairs, and chain parameters' },
  { id: 'support', name: 'Support & Ops', desc: 'Manage KYC queues, withdrawals dual-control, deposits ledger, users, and tickets' },
  { id: 'risk', name: 'Risk & Emergency', desc: 'Operate global circuit breakers, kill-switches, market halts, and symbol halts' },
];

export default function RolesPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // New Operator Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('support');
  const [creating, setCreating] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOperators = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api('/api/operators');
      setOperators(res.operators || []);
    } catch (err) {
      console.error('Failed to fetch operators', err);
      setError(err.message || 'Failed to load operators from Admin API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const handleCreateOperator = async (e) => {
    e.preventDefault();
    if (!email.trim() || password.length < 8) {
      showToast('Email and a password of at least 8 characters are required.', 'error');
      return;
    }

    setCreating(true);
    try {
      await api('/api/operators', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password, role }),
      });
      showToast(`Operator ${email} provisioned with role ${role}.`);
      setEmail('');
      setPassword('');
      setRole('support');
      fetchOperators();
    } catch (err) {
      showToast(err.message || 'Failed to create operator', 'error');
    } finally {
      setCreating(false);
    }
  };

  const toggleOperatorActive = async (operator) => {
    const nextState = !operator.is_active;
    const ok = await confirm({
      title: nextState ? 'Reactivate Operator' : 'Deactivate Operator',
      message: nextState
        ? `Re-activate operator ${operator.email}? They will regain access to their assigned operational permissions.`
        : `Deactivate operator ${operator.email}? They will immediately lose access to all admin tools and active sessions will be terminated.`,
      confirmText: nextState ? 'Reactivate' : 'Deactivate Operator',
      variant: nextState ? 'success' : 'danger',
    });
    if (!ok) return;

    try {
      await api(`/api/operators/${operator.id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ active: nextState }),
      });
      showToast(`Operator ${operator.email} is now ${nextState ? 'Active' : 'Disabled'}.`);
      setOperators((prev) =>
        prev.map((op) => (op.id === operator.id ? { ...op, is_active: nextState } : op))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update operator status', 'error');
    }
  };

  return (
    <div className="roles-page">
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '8px',
            background: toast.type === 'error' ? '#EF4444' : '#10B981',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {toast.msg}
        </div>
      )}

      <h2 className="page-title">Operator Accounts & Roles</h2>
      {error && <div className="error-banner">{error}</div>}

      {/* Provision New Operator (Superadmin only) */}
      <div className="card">
        <h3 className="card-title">Provision New Admin Operator</h3>
        <p className="card-desc">
          Admin accounts are created strictly by internal invitation. Newly created operators receive individual JWT credentials.
        </p>

        <form onSubmit={handleCreateOperator} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>Operator Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@limiance.com"
              required
              style={{ width: '100%', padding: '10px 12px', background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>Initial Password (min 8 chars)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={8}
              style={{ width: '100%', padding: '10px 12px', background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }}
            >
              {OPERATOR_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={creating}
              style={{
                width: '100%',
                padding: '10px 18px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {creating ? 'Provisioning...' : 'Provision Operator'}
            </button>
          </div>
        </form>
      </div>

      {/* Operator List */}
      <div className="card">
        <h3 className="card-title">Existing Admin Operators</h3>
        <p className="card-desc">Active staff members authorized to perform platform operations and access internal tools.</p>

        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                <th style={{ padding: '12px' }}>Operator ID</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Role</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Created At</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ShimmerTableRows rows={5} cols={6} colWidths={['20%', '30%', '15%', '15%', '20%', '15%']} />
              ) : operators.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                    No operators found.
                  </td>
                </tr>
              ) : (
                operators.map((op) => {
                  const isCurrent = op.email === user?.email;
                  return (
                    <tr key={op.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#9ca3af', fontSize: '12px' }}>
                        {op.id}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '500', color: '#fff' }}>
                        {op.email} {isCurrent && <span style={{ color: '#60a5fa', fontSize: '11px' }}>(You)</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            background: op.role === 'superadmin' ? '#7c3aed22' : '#2563eb22',
                            color: op.role === 'superadmin' ? '#c084fc' : '#60a5fa',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: `1px solid ${op.role === 'superadmin' ? '#7c3aed55' : '#2563eb55'}`,
                          }}
                        >
                          {op.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            color: op.is_active ? '#34d399' : '#ef4444',
                            fontWeight: '600',
                            fontSize: '13px',
                          }}
                        >
                          {op.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                        {op.created_at ? new Date(op.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => toggleOperatorActive(op)}
                          disabled={isCurrent}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            border: 'none',
                            cursor: isCurrent ? 'not-allowed' : 'pointer',
                            background: op.is_active ? '#dc2626' : '#10b981',
                            color: '#fff',
                            opacity: isCurrent ? 0.4 : 1,
                          }}
                        >
                          {op.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
