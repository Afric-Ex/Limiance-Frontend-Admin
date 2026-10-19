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
  ChevronDown,
  Coins,
  ArrowRightLeft,
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

  // Conversion Limits & Spread
  const [conversionLimits, setConversionLimits] = useState({
    min_quantity: '0.001',
    max_quantity: '100000',
    spread_bps: '50',
  });
  const [savingConversionLimits, setSavingConversionLimits] = useState(false);

  // Available tokens fetched from /api/tokens
  const [tokensList, setTokensList] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Asset Limits Table / Form
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [assetLimits, setAssetLimits] = useState({
    asset: 'BTC',
    max_single: '',
    daily_limit: '',
    max_withdrawal: '',
    min_withdrawal: '',
    min_deposit: '',
    fee: '',
  });
  const [savingAssetLimits, setSavingAssetLimits] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchGlobalSettings = async () => {
    setLoading(true);
    try {
      const [threshRes, whiteRes, convRes] = await Promise.allSettled([
        api('/api/withdrawal-limits/approval-threshold'),
        api('/api/withdrawal-whitelist-settings'),
        api('/api/conversion-limits'),
      ]);

      if (threshRes.status === 'fulfilled' && threshRes.value?.threshold) {
        setThreshold(threshRes.value.threshold);
      }
      if (whiteRes.status === 'fulfilled' && whiteRes.value?.delay_hours !== undefined) {
        setWhitelistDelay(whiteRes.value.delay_hours);
      }
      if (convRes.status === 'fulfilled' && convRes.value) {
        setConversionLimits({
          min_quantity: convRes.value.min_quantity || '0.001',
          max_quantity: convRes.value.max_quantity || '100000',
          spread_bps: convRes.value.spread_bps !== undefined ? String(convRes.value.spread_bps) : '50',
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load withdrawal policies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTokens = async () => {
    setLoadingTokens(true);
    try {
      const res = await api('/api/tokens?limit=500');
      const list = res.tokens || res.data || (Array.isArray(res) ? res : []);
      const tokenMap = new Map();
      for (const t of list) {
        const sym = (t.symbol || '').toUpperCase();
        if (!sym) continue;
        if (!tokenMap.has(sym)) {
          tokenMap.set(sym, {
            symbol: sym,
            name: t.name || sym,
            blockchain: t.blockchain || '',
            chains: t.chains && t.chains.length > 0 ? [...t.chains] : (t.blockchain ? [t.blockchain] : []),
            min_withdrawal: t.min_withdrawal || '0',
            min_deposit: t.min_deposit || '0',
          });
        } else {
          const existing = tokenMap.get(sym);
          if (t.blockchain && !existing.chains.includes(t.blockchain)) {
            existing.chains.push(t.blockchain);
          }
          if (t.chains) {
            for (const c of t.chains) {
              if (!existing.chains.includes(c)) existing.chains.push(c);
            }
          }
        }
      }
      const unique = Array.from(tokenMap.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
      setTokensList(unique);
      return unique;
    } catch (err) {
      console.error('Failed to load tokens', err);
      return [];
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchAssetLimit = async (asset, currentTokens) => {
    const tokens = currentTokens || tokensList;
    const tokenData = tokens.find((t) => t.symbol === asset);

    if (tokenData) {
      setAssetLimits((prev) => ({
        ...prev,
        asset,
        min_withdrawal: tokenData.min_withdrawal || '',
        min_deposit: tokenData.min_deposit || '',
      }));
    }

    try {
      const [limitRes, feeRes] = await Promise.allSettled([
        api(`/api/withdrawal-limits/${asset}`),
        api(`/api/fees/${asset}`),
      ]);

      const limitData = limitRes.status === 'fulfilled' ? limitRes.value : {};
      const feeData = feeRes.status === 'fulfilled' ? feeRes.value : null;

      setAssetLimits((prev) => ({
        asset: limitData.asset || asset,
        max_single: limitData.max_single || '',
        daily_limit: limitData.daily_limit || '',
        max_withdrawal: limitData.max_withdrawal || '',
        min_withdrawal: prev.min_withdrawal || tokenData?.min_withdrawal || '',
        min_deposit: prev.min_deposit || tokenData?.min_deposit || '',
        fee: feeData?.fixed_amount || '',
      }));
    } catch (err) {
      setAssetLimits({
        asset,
        max_single: '',
        daily_limit: '',
        max_withdrawal: '',
        min_withdrawal: tokenData?.min_withdrawal || '',
        min_deposit: tokenData?.min_deposit || '',
        fee: '',
      });
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
    fetchAvailableTokens().then((tokens) => {
      const initial = tokens.length > 0 ? tokens[0].symbol : 'BTC';
      setSelectedAsset(initial);
      fetchAssetLimit(initial, tokens);
    });
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

  const handleSaveConversionLimits = async (e) => {
    e.preventDefault();
    setSavingConversionLimits(true);
    try {
      await api('/api/conversion-limits', {
        method: 'PUT',
        body: conversionLimits,
      });
      showToast('Conversion limits and spread updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update conversion limits', 'error');
    } finally {
      setSavingConversionLimits(false);
    }
  };

  const handleSaveAssetLimits = async (e) => {
    e.preventDefault();
    setSavingAssetLimits(true);

    const asset = assetLimits.asset.toUpperCase();

    // Invariant: Max Withdrawal cannot exceed the Manual Approval Threshold (USD)
    // When price is known or direct comparison applies
    const maxWithdrawalNum = parseFloat(assetLimits.max_withdrawal);
    const thresholdNum = parseFloat(threshold);
    if (!isNaN(maxWithdrawalNum) && !isNaN(thresholdNum) && thresholdNum > 0) {
      // If asset is USDT/USDC/USD or direct value >= threshold
      if ((asset === 'USDT' || asset === 'USDC' || asset === 'USD') && maxWithdrawalNum > thresholdNum) {
        showToast(`Max withdrawal (${maxWithdrawalNum} ${asset}) cannot exceed the manual approval threshold ($${thresholdNum})`, 'error');
        setSavingAssetLimits(false);
        return;
      }
    }

    try {
      // 1. Save Redis limits (max_single, daily_limit, max_withdrawal)
      await api('/api/withdrawal-limits', {
        method: 'PUT',
        body: {
          asset,
          max_single: assetLimits.max_single,
          daily_limit: assetLimits.daily_limit,
          max_withdrawal: assetLimits.max_withdrawal,
        },
      });

      // 2. Save token minimums (min_withdrawal, min_deposit) if updated
      if (assetLimits.min_withdrawal !== '' || assetLimits.min_deposit !== '') {
        try {
          const tok = tokensList.find((t) => t.symbol === asset);
          const chains = (tok?.chains && tok.chains.length > 0) ? tok.chains : [tok?.blockchain || ''];
          for (const chain of chains) {
            if (!chain) continue;
            await api(`/api/tokens/${asset}?blockchain=${encodeURIComponent(chain)}`, {
              method: 'PATCH',
              body: {
                min_withdrawal: assetLimits.min_withdrawal || tok?.min_withdrawal || '0',
                min_deposit: assetLimits.min_deposit || tok?.min_deposit || '0',
              },
            });
          }
        } catch (tErr) {
          console.warn('Could not sync token minimums:', tErr);
        }
      }

      // 3. Save asset withdrawal fee if provided
      if (assetLimits.fee !== '') {
        try {
          await api(`/api/fees/${asset}`, {
            method: 'PUT',
            body: {
              fixed_amount: assetLimits.fee,
            },
          });
        } catch (fErr) {
          // If fee doesn't exist yet, create it
          try {
            await api('/api/fees', {
              method: 'POST',
              body: [{
                name: asset,
                fixed_amount: assetLimits.fee,
                percentage: '0',
              }],
            });
          } catch (createErr) {
            console.warn('Could not sync asset fee:', createErr);
          }
        }
      }

      showToast(`Asset rules and limits saved for ${asset}`);
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
            background: toast.type === 'error' ? 'var(--danger-solid)' : 'var(--success-solid)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Withdrawal Risk & Limits Console
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            Safeguard cold storage and liquidity via manual review thresholds, whitelisting lock periods, and per-token velocity caps.
          </p>
        </div>

        <button
          onClick={() => {
            fetchGlobalSettings();
            fetchAvailableTokens();
            fetchAssetLimit(selectedAsset);
          }}
          style={{
            padding: '8px 14px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
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
          border: '1px solid var(--warning-border)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <AlertTriangle size={20}  style={{ color: "var(--warning-text)", flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--warning-text)' }}>Real-time Risk Guard:</strong> Withdrawals that exceed the USD approval threshold will bypass automated hot wallet signing and pause in the operator <strong>Withdrawals Queue</strong> pending cryptographic review.
        </div>
      </div>

      {/* Global Rules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: USD Approval Threshold */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.12)', borderRadius: '8px', color: 'var(--info-text)' }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Manual Approval Threshold
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Single withdrawal amount (USD) requiring human operator sign-off
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveThreshold}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Threshold Amount (USD)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
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
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
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
                background: 'var(--primary-solid)',
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
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '8px', color: 'var(--success-text)' }}>
              <Clock size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Address Whitelist Delay
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Security cooling period before newly whitelisted destination is eligible
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveWhitelist}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
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
                background: 'var(--primary-solid)',
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

        {/* Card 3: Token Conversion Limits & Spread */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '8px', color: 'var(--warning-text)' }}>
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Token Conversion Limits & Spread
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                OTC token swap limits & system spread markup (in basis points)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveConversionLimits}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Min Quantity
                </label>
                <input
                  type="text"
                  required
                  value={conversionLimits.min_quantity}
                  onChange={(e) => setConversionLimits({ ...conversionLimits, min_quantity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Max Quantity
                </label>
                <input
                  type="text"
                  required
                  value={conversionLimits.max_quantity}
                  onChange={(e) => setConversionLimits({ ...conversionLimits, max_quantity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Exchange Spread (BPS, e.g. 50 = 0.50%)
              </label>
              <input
                type="text"
                required
                value={conversionLimits.spread_bps}
                onChange={(e) => setConversionLimits({ ...conversionLimits, spread_bps: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={savingConversionLimits}
              style={{
                padding: '10px 20px',
                background: 'var(--primary-solid)',
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
              <Save size={14} /> {savingConversionLimits ? 'Saving...' : 'Save Conversion Limits'}
            </button>
          </form>
        </div>
      </div>

      {/* Per-Asset Withdrawal Velocity Limits */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '8px', color: 'var(--warning-text)' }}>
            <Sliders size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Per-Asset Rules & Limits
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Configure withdrawal fees, minimum deposit/withdrawal sizes, transaction limits, and 24-hour rolling velocity caps
            </p>
          </div>
        </div>

        {/* Asset Selector Dropdown List */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            background: 'var(--overlay-1)',
            border: '1px solid var(--border-subtle)',
            padding: '16px 20px',
            borderRadius: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 320px', maxWidth: '480px' }}>
            <label
              htmlFor="asset-select-dropdown"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              <Coins size={14} style={{ color: "var(--info-text)" }} /> Select Asset / Token
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="asset-select-dropdown"
                value={selectedAsset}
                onChange={(e) => handleAssetSelect(e.target.value)}
                disabled={loadingTokens}
                style={{
                  width: '100%',
                  padding: '11px 36px 11px 14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--info-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              >
                {tokensList.length === 0 ? (
                  <option value={selectedAsset}>{selectedAsset} {loadingTokens ? '(Loading tokens...)' : ''}</option>
                ) : (
                  tokensList.map((tok) => (
                    <option key={tok.symbol} value={tok.symbol} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                      {tok.symbol} — {tok.name} {tok.blockchain ? `(${tok.blockchain})` : ''}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown
                size={16}
                
                style={{
                  color: "var(--text-tertiary)", position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-end', marginBottom: '2px' }}>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'var(--overlay-2)',
                border: '1px solid var(--border)',
                padding: '9px 14px',
                borderRadius: '8px',
                fontWeight: 500,
              }}
            >
              {loadingTokens ? 'Loading listed tokens...' : `${tokensList.length} tokens loaded from system`}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveAssetLimits}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Asset Symbol
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  required
                  value={assetLimits.asset}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    handleAssetSelect(val);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 32px 10px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                >
                  {tokensList.length === 0 ? (
                    <option value={assetLimits.asset}>{assetLimits.asset}</option>
                  ) : (
                    tokensList.map((tok) => (
                      <option key={tok.symbol} value={tok.symbol} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        {tok.symbol} — {tok.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown
                  size={14}
                  
                  style={{
                    color: "var(--text-muted)", position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Selected token from listed assets
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Withdrawal Fee ({assetLimits.asset})
              </label>
              <input
                type="text"
                placeholder="e.g. 0.0005 (fixed fee)"
                value={assetLimits.fee}
                onChange={(e) => setAssetLimits({ ...assetLimits, fee: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Fixed fee deducted per withdrawal
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Deposit Min ({assetLimits.asset})
              </label>
              <input
                type="text"
                placeholder="e.g. 0.001"
                value={assetLimits.min_deposit}
                onChange={(e) => setAssetLimits({ ...assetLimits, min_deposit: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Deposits below this will be rejected
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Withdrawal Min ({assetLimits.asset})
              </label>
              <input
                type="text"
                placeholder="e.g. 0.002"
                value={assetLimits.min_withdrawal}
                onChange={(e) => setAssetLimits({ ...assetLimits, min_withdrawal: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Minimum single withdrawal allowed
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Cap per individual transaction
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Withdrawal Max ({assetLimits.asset})
              </label>
              <input
                type="text"
                placeholder={`e.g. ${threshold || '10000'}`}
                value={assetLimits.max_withdrawal}
                onChange={(e) => setAssetLimits({ ...assetLimits, max_withdrawal: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--warning-text)', marginTop: '4px', display: 'block' }}>
                Ceiling (≤ Manual Approval Threshold: ${threshold || '0'})
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                24-hour total rolling withdrawal cap
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={savingAssetLimits}
              style={{
                padding: '10px 24px',
                background: 'var(--primary-solid)',
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
