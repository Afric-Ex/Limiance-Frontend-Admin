import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ShieldAlert,
  Clock,
  DollarSign,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Search,
} from 'lucide-react';

export default function WithdrawalRulesPage() {
  const [loading, setLoading] = useState(true);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [savingWhitelist, setSavingWhitelist] = useState(false);
  const [toast, setToast] = useState(null);

  // Global threshold (USD)
  const [threshold, setThreshold] = useState('10000');

  // Whitelist settings
  const [whitelistDelay, setWhitelistDelay] = useState(24);

  // Asset Limits Table / Form
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [assetLimits, setAssetLimits] = useState({
    asset: 'BTC',
    max_single: '',
    daily_limit: '',
  });
  const [savingAssetLimits, setSavingAssetLimits] = useState(false);

  // Common assets quick selector
  const commonAssets = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'XRP', 'DOGE', 'BNB'];

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchGlobalSettings = async () => {
    setLoading(true);
    try {
      const [threshRes, whiteRes] = await Promise.allSettled([
        api('/api/withdrawal-limits/approval-threshold'),
        api('/api/withdrawal-whitelist-settings'),
      ]);

      if (threshRes.status === 'fulfilled' && threshRes.value?.threshold) {
        setThreshold(threshRes.value.threshold);
      }
      if (whiteRes.status === 'fulfilled' && whiteRes.value?.delay_hours !== undefined) {
        setWhitelistDelay(whiteRes.value.delay_hours);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load withdrawal policies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetLimit = async (asset) => {
    try {
      const res = await api(`/api/withdrawal-limits/${asset}`);
      setAssetLimits({
        asset: res.asset || asset,
        max_single: res.max_single || '',
        daily_limit: res.daily_limit || '',
      });
    } catch (err) {
      // 404 or empty limits means no custom cap set
      setAssetLimits({
        asset,
        max_single: '',
        daily_limit: '',
      });
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
    fetchAssetLimit('BTC');
  }, []);

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    fetchAssetLimit(asset);
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    setSavingThreshold(true);
    try {
      await api('/api/withdrawal-limits/approval-threshold', {
        method: 'PUT',
        body: { threshold },
      });
      showToast('Global approval threshold updated');
    } catch (err) {
      showToast(err.message || 'Failed to update threshold', 'error');
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleSaveWhitelist = async (e) => {
    e.preventDefault();
    setSavingWhitelist(true);
    try {
      await api('/api/withdrawal-whitelist-settings', {
        method: 'PUT',
        body: { delay_hours: Number(whitelistDelay) },
      });
      showToast('Address whitelisting lock duration updated');
    } catch (err) {
      showToast(err.message || 'Failed to update whitelist delay', 'error');
    } finally {
      setSavingWhitelist(false);
    }
  };

  const handleSaveAssetLimits = async (e) => {
    e.preventDefault();
    setSavingAssetLimits(true);
    try {
      await api('/api/withdrawal-limits', {
        method: 'PUT',
        body: {
          asset: assetLimits.asset.toUpperCase(),
          max_single: assetLimits.max_single,
          daily_limit: assetLimits.daily_limit,
        },
      });
      showToast(`Withdrawal caps saved for ${assetLimits.asset.toUpperCase()}`);
    } catch (err) {
      showToast(err.message || 'Failed to update asset limits', 'error');
    } finally {
      setSavingAssetLimits(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>
            Withdrawal Risk & Limits Console
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
            Safeguard cold storage and liquidity via manual review thresholds, whitelisting lock periods, and per-token velocity caps.
          </p>
        </div>

        <button
          onClick={() => {
            fetchGlobalSettings();
            fetchAssetLimit(selectedAsset);
          }}
          style={{
            padding: '8px 14px',
            background: '#1c1e28',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Refresh Rules
        </button>
      </div>

      {/* Risk Alert Banner */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>
          <strong style={{ color: '#fbbf24' }}>Real-time Risk Guard:</strong> Withdrawals that exceed the USD approval threshold will bypass automated hot wallet signing and pause in the operator <strong>Withdrawals Queue</strong> pending cryptographic review.
        </div>
      </div>

      {/* Global Rules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: USD Approval Threshold */}
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '8px', color: '#818cf8' }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                Manual Approval Threshold
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Single withdrawal amount (USD) requiring human operator sign-off
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveThreshold}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                Threshold Amount (USD)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                  $
                </span>
                <input
                  type="number"
                  required
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 28px',
                    background: '#181a22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '15px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingThreshold}
              style={{
                padding: '10px 20px',
                background: '#4d77f0',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Save size={14} /> {savingThreshold ? 'Updating...' : 'Save Approval Threshold'}
            </button>
          </form>
        </div>

        {/* Card 2: Whitelisting Lock Period */}
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '8px', color: '#34d399' }}>
              <Clock size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                Address Whitelist Delay
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Security cooling period before newly whitelisted destination is eligible
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveWhitelist}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                Cooling Period (Hours)
              </label>
              <input
                type="number"
                required
                min="0"
                max="168"
                value={whitelistDelay}
                onChange={(e) => setWhitelistDelay(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#181a22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={savingWhitelist}
              style={{
                padding: '10px 20px',
                background: '#4d77f0',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Save size={14} /> {savingWhitelist ? 'Updating...' : 'Save Whitelist Delay'}
            </button>
          </form>
        </div>
      </div>

      {/* Per-Asset Withdrawal Velocity Limits */}
      <div
        style={{
          background: '#13151c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '8px', color: '#fbbf24' }}>
            <Sliders size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
              Per-Asset Max-Single & Daily Limits
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Configure native token maximum single transaction and 24-hour rolling velocity caps
            </p>
          </div>
        </div>

        {/* Common Asset Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {commonAssets.map((ast) => (
            <button
              key={ast}
              type="button"
              onClick={() => handleAssetSelect(ast)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: selectedAsset === ast ? '#4d77f0' : '#181a22',
                border: `1px solid ${selectedAsset === ast ? '#4d77f0' : 'rgba(255,255,255,0.1)'}`,
                color: selectedAsset === ast ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {ast}
            </button>
          ))}
        </div>

        <form onSubmit={handleSaveAssetLimits}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                Asset Symbol
              </label>
              <input
                type="text"
                required
                value={assetLimits.asset}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setAssetLimits({ ...assetLimits, asset: val });
                  setSelectedAsset(val);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#181a22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                Max Single Withdrawal ({assetLimits.asset})
              </label>
              <input
                type="text"
                placeholder="e.g. 5.0 (leave blank for unlimited)"
                value={assetLimits.max_single}
                onChange={(e) => setAssetLimits({ ...assetLimits, max_single: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#181a22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                Daily Rolling Limit ({assetLimits.asset})
              </label>
              <input
                type="text"
                placeholder="e.g. 20.0 (leave blank for unlimited)"
                value={assetLimits.daily_limit}
                onChange={(e) => setAssetLimits({ ...assetLimits, daily_limit: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#181a22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={savingAssetLimits}
              style={{
                padding: '10px 24px',
                background: '#4d77f0',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Save size={14} /> {savingAssetLimits ? 'Saving...' : `Save Limits for ${assetLimits.asset}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
