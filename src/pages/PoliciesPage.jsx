import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import AuditReasonModal from '../components/AuditReasonModal';
import './PoliciesPage.css';

export default function PoliciesPage() {
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [conversionsEnabled, setConversionsEnabled] = useState(true);
  const [conversionPairsForm, setConversionPairsForm] = useState({ pair: '', action: 'enable' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [auditAction, setAuditAction] = useState(null); // { type, value }
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchControls();
  }, []);

  const fetchControls = async () => {
    try {
      const wRes = await api('/v1/admin/operational-controls/withdrawals').catch(() => ({ withdrawals_enabled: true }));
      const cRes = await api('/v1/admin/operational-controls/conversions').catch(() => ({ conversions_enabled: true }));
      setWithdrawalsEnabled(wRes.withdrawals_enabled !== undefined ? wRes.withdrawals_enabled : wRes.enabled);
      setConversionsEnabled(cRes.conversions_enabled !== undefined ? cRes.conversions_enabled : cRes.enabled);
    } catch (err) {
      setError('Failed to load operational controls');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = (type, currentValue) => {
    setAuditAction({ type, value: !currentValue });
    setIsModalOpen(true);
  };

  const handleConfirmAudit = async (reason) => {
    setIsModalOpen(false);
    if (!auditAction) return;

    const { type, value, pairAction, pair } = auditAction;
    
    try {
      if (type === 'withdrawals' || type === 'conversions') {
        const endpoint = `/v1/admin/operational-controls/${type}`;
        await api(endpoint, {
          method: 'PUT',
          body: JSON.stringify({ enabled: value, reason })
        });
        if (type === 'withdrawals') setWithdrawalsEnabled(value);
        if (type === 'conversions') setConversionsEnabled(value);
      } else if (type === 'conversion-pair') {
        await api('/v1/admin/conversion-pairs', {
          method: 'PUT',
          body: JSON.stringify({ pair, action: pairAction, reason })
        });
        alert(`Successfully set ${pair} to ${pairAction}.`);
        setConversionPairsForm({ pair: '', action: 'enable' });
      }
    } catch (err) {
      setError(`Failed to update ${type} control: ${err.message}`);
    }
    setAuditAction(null);
  };

  const handlePairSubmit = (e) => {
    e.preventDefault();
    if (!conversionPairsForm.pair.trim()) return;
    setAuditAction({ 
      type: 'conversion-pair', 
      pair: conversionPairsForm.pair.trim(),
      pairAction: conversionPairsForm.action,
      value: conversionPairsForm.action // for the modal title
    });
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading policies...</div>;

  return (
    <div className="policies-page">
      <h2 className="page-title">Policies & Controls</h2>
      {error && <div className="error-banner">{error}</div>}
      
      <div className="card">
        <h3 className="card-title">Operational Kill-Switches</h3>
        <p className="card-desc">Temporarily disable core platform flows. Changes require an audited reason.</p>
        
        <div className="control-list">
          <div className="control-item">
            <div className="control-info">
              <h4>Withdrawals</h4>
              <p>When disabled, all new withdrawal requests and approvals are blocked (returns 503).</p>
            </div>
            <button 
              className={`toggle-btn ${withdrawalsEnabled ? 'on' : 'off'}`}
              onClick={() => handleToggleClick('withdrawals', withdrawalsEnabled)}
            >
              {withdrawalsEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="control-item">
            <div className="control-info">
              <h4>Conversions</h4>
              <p>When disabled, quote requests and confirmations are blocked (returns 503).</p>
            </div>
            <button 
              className={`toggle-btn ${conversionsEnabled ? 'on' : 'off'}`}
              onClick={() => handleToggleClick('conversions', conversionsEnabled)}
            >
              {conversionsEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Conversion Pairs</h3>
        <p className="card-desc">Enable or disable specific trading pairs for quotes.</p>
        <form onSubmit={handlePairSubmit} className="pair-form">
          <input 
            type="text" 
            placeholder="e.g. BTC/USDT" 
            value={conversionPairsForm.pair}
            onChange={e => setConversionPairsForm({...conversionPairsForm, pair: e.target.value})}
            required
          />
          <select 
            value={conversionPairsForm.action}
            onChange={e => setConversionPairsForm({...conversionPairsForm, action: e.target.value})}
          >
            <option value="enable">Enable</option>
            <option value="disable">Disable</option>
          </select>
          <button type="submit">Update Pair</button>
        </form>
      </div>

      <AuditReasonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAudit}
        title={auditAction?.type === 'conversion-pair' ? `Change pair ${auditAction?.pair} to ${auditAction?.value}` : `Change ${auditAction?.type} status to ${auditAction?.value ? 'Enabled' : 'Disabled'}`}
        actionLabel="Update Policy"
      />
    </div>
  );
}
