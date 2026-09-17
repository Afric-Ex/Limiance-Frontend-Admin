import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import AuditReasonModal from '../components/AuditReasonModal';
import './PoliciesPage.css';

export default function PoliciesPage() {
  const [emergencyStatus, setEmergencyStatus] = useState(null);
  const [circuitBreaker, setCircuitBreaker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Form for symbol halts
  const [symbolInput, setSymbolInput] = useState('');

  // Modal audit state
  const [auditAction, setAuditAction] = useState(null); // { type, targetId, halt, label }
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const [emRes, cbRes] = await Promise.allSettled([
        api('/api/emergency/status'),
        api('/api/system/trading-status'),
      ]);

      if (emRes.status === 'fulfilled') {
        setEmergencyStatus(emRes.value);
      }
      if (cbRes.status === 'fulfilled') {
        setCircuitBreaker(cbRes.value.data || cbRes.value);
      }
    } catch (err) {
      console.error('Failed to load emergency controls', err);
      setError(err.message || 'Failed to fetch emergency status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const openAuditModal = (action) => {
    setAuditAction(action);
    setIsModalOpen(true);
  };

  const handleConfirmAudit = async (reason) => {
    setIsModalOpen(false);
    if (!auditAction) return;

    const { kind, targetType, targetId, halt, symbol, market } = auditAction;

    try {
      if (kind === 'circuit_breaker') {
        if (halt) {
          await api('/api/system/trading-halt', {
            method: 'POST',
            body: JSON.stringify({ reason }),
          });
          showToast('Global Trading Circuit Breaker ACTIVATED.');
        } else {
          await api('/api/system/trading-resume', {
            method: 'POST',
          });
          showToast('Global Trading Resumed.');
        }
      } else if (kind === 'kill_switch') {
        await api('/api/emergency/kill-switch', {
          method: 'POST',
          body: JSON.stringify({
            target_type: targetType,
            target_id: targetId,
            halt,
            reason,
          }),
        });
        showToast(`Kill-switch for ${targetId} set to ${halt ? 'HALTED' : 'ACTIVE'}.`);
      } else if (kind === 'halt_market') {
        await api('/api/emergency/halt-market', {
          method: 'POST',
          body: JSON.stringify({
            market,
            halt,
            reason,
          }),
        });
        showToast(`${market.toUpperCase()} market set to ${halt ? 'HALTED' : 'RESUMED'}.`);
      } else if (kind === 'halt_symbol') {
        await api('/api/emergency/halt-symbol', {
          method: 'POST',
          body: JSON.stringify({
            symbol,
            halt,
            reason,
          }),
        });
        showToast(`Symbol ${symbol} set to ${halt ? 'HALTED' : 'RESUMED'}.`);
        setSymbolInput('');
      }

      fetchStatus();
    } catch (err) {
      console.error('Action failed', err);
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setAuditAction(null);
    }
  };

  const handleSymbolSubmit = (e, halt) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;
    openAuditModal({
      kind: 'halt_symbol',
      symbol: symbolInput.trim().toUpperCase(),
      halt,
      label: `${halt ? 'Halt' : 'Resume'} Symbol Trading for ${symbolInput.trim().toUpperCase()}`,
    });
  };

  const isMarketHalted = (m) => (emergencyStatus?.halted_markets || []).includes(m);

  if (loading && !emergencyStatus) {
    return <div style={{ padding: '2rem', color: '#fff' }}>Loading emergency controls & policies...</div>;
  }

  return (
    <div className="policies-page">
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

      <h2 className="page-title">Platform Emergency Controls & Circuit Breakers</h2>
      {error && <div className="error-banner">{error}</div>}

      {/* Global Circuit Breaker Panel */}
      <div
        className="card"
        style={{
          borderLeft: `4px solid ${circuitBreaker?.is_halted ? '#ef4444' : '#10b981'}`,
          background: circuitBreaker?.is_halted ? '#2a0a0a' : '#111827',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: circuitBreaker?.is_halted ? '#fca5a5' : '#fff', fontSize: '1.2rem' }}>
              Global Trading Circuit Breaker
            </h3>
            <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: '0.875rem' }}>
              {circuitBreaker?.is_halted
                ? `HALTED by ${circuitBreaker?.halted_by || 'Risk Admin'}: "${circuitBreaker?.reason}" (${circuitBreaker?.halted_at ? new Date(circuitBreaker.halted_at).toLocaleString() : ''})`
                : 'All matching engines, order placements, and execution flows operating normally.'}
            </p>
          </div>
          <button
            onClick={() =>
              openAuditModal({
                kind: 'circuit_breaker',
                halt: !circuitBreaker?.is_halted,
                label: circuitBreaker?.is_halted
                  ? 'Resume Global Trading Platform-wide'
                  : 'EMERGENCY HALT: Halt Global Trading Platform-wide',
              })
            }
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: circuitBreaker?.is_halted ? '#10b981' : '#dc2626',
              color: '#fff',
            }}
          >
            {circuitBreaker?.is_halted ? 'Resume Global Trading' : 'HALT GLOBAL TRADING'}
          </button>
        </div>
      </div>

      {/* Subsystem Kill Switches */}
      <div className="card">
        <h3 className="card-title">Subsystem Kill-Switches</h3>
        <p className="card-desc">
          Individual operational switches to isolate degraded services without taking down the entire exchange.
        </p>

        <div className="control-list">
          <div className="control-item">
            <div className="control-info">
              <h4>Withdrawals Gateway</h4>
              <p>When halted, wallet service suspends outbound blockchain broadcasts and withdrawals queue processing.</p>
            </div>
            <button
              className={`toggle-btn ${emergencyStatus?.withdrawals_halted ? 'off' : 'on'}`}
              onClick={() =>
                openAuditModal({
                  kind: 'kill_switch',
                  targetType: 'SERVICE',
                  targetId: 'withdrawals',
                  halt: !emergencyStatus?.withdrawals_halted,
                  label: emergencyStatus?.withdrawals_halted ? 'Resume Withdrawals' : 'Emergency Halt Outbound Withdrawals',
                })
              }
            >
              {emergencyStatus?.withdrawals_halted ? 'HALTED' : 'Active'}
            </button>
          </div>

          <div className="control-item">
            <div className="control-info">
              <h4>Deposits Ingestion</h4>
              <p>When halted, deposit indexing and automatic crediting to customer accounts are held in pending queue.</p>
            </div>
            <button
              className={`toggle-btn ${emergencyStatus?.deposits_halted ? 'off' : 'on'}`}
              onClick={() =>
                openAuditModal({
                  kind: 'kill_switch',
                  targetType: 'SERVICE',
                  targetId: 'deposits',
                  halt: !emergencyStatus?.deposits_halted,
                  label: emergencyStatus?.deposits_halted ? 'Resume Deposits' : 'Emergency Halt Inbound Deposits',
                })
              }
            >
              {emergencyStatus?.deposits_halted ? 'HALTED' : 'Active'}
            </button>
          </div>

          <div className="control-item">
            <div className="control-info">
              <h4>Cancel-Only Order Mode</h4>
              <p>Allows users to cancel open orders while rejecting all new taker and maker order submissions.</p>
            </div>
            <button
              className={`toggle-btn ${emergencyStatus?.cancel_only ? 'off' : 'on'}`}
              onClick={() =>
                openAuditModal({
                  kind: 'kill_switch',
                  targetType: 'SERVICE',
                  targetId: 'cancel_only',
                  halt: !emergencyStatus?.cancel_only,
                  label: emergencyStatus?.cancel_only ? 'Disable Cancel-Only Mode' : 'Enable Cancel-Only Order Mode',
                })
              }
            >
              {emergencyStatus?.cancel_only ? 'CANCEL-ONLY' : 'Standard'}
            </button>
          </div>
        </div>
      </div>

      {/* Market Halts */}
      <div className="card">
        <h3 className="card-title">Market Halts (Segmented)</h3>
        <p className="card-desc">Halt or resume trading in specific market compartments.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {['spot', 'margin', 'futures'].map((market) => {
            const halted = isMarketHalted(market);
            return (
              <div
                key={market}
                style={{
                  background: '#1f2937',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: `1px solid ${halted ? '#ef4444' : '#374151'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#fff' }}>{market} Market</h4>
                  <span style={{ fontSize: '12px', color: halted ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {halted ? 'HALTED' : 'ONLINE'}
                  </span>
                </div>
                <button
                  onClick={() =>
                    openAuditModal({
                      kind: 'halt_market',
                      market,
                      halt: !halted,
                      label: `${halted ? 'Resume' : 'Halt'} Trading on ${market.toUpperCase()} Market`,
                    })
                  }
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    background: halted ? '#10b981' : '#ef4444',
                    color: '#fff',
                  }}
                >
                  {halted ? 'Resume' : 'Halt'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Symbol Halts */}
      <div className="card">
        <h3 className="card-title">Trading Pair / Symbol Halts</h3>
        <p className="card-desc">Targeted circuit breaker for individual pairs during extreme volatility or oracle outages.</p>

        <form onSubmit={(e) => handleSymbolSubmit(e, true)} style={{ display: 'flex', gap: '10px', marginTop: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="e.g. SOL/USDT"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#fff',
              minWidth: '200px',
            }}
          />
          <button
            type="submit"
            style={{ padding: '10px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            Halt Pair
          </button>
          <button
            type="button"
            onClick={(e) => handleSymbolSubmit(e, false)}
            style={{ padding: '10px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            Resume Pair
          </button>
        </form>

        {emergencyStatus?.halted_symbols && emergencyStatus.halted_symbols.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#9ca3af' }}>Currently Halted Pairs:</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {emergencyStatus.halted_symbols.map((sym) => (
                <span
                  key={sym}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <strong>{sym}</strong>
                  <button
                    onClick={() =>
                      openAuditModal({
                        kind: 'halt_symbol',
                        symbol: sym,
                        halt: false,
                        label: `Resume Trading for ${sym}`,
                      })
                    }
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <AuditReasonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAudit}
        title={auditAction?.label || 'Confirm Emergency Action'}
        actionLabel="Authorize & Log Decision"
      />
    </div>
  );
}
