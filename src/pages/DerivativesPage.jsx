import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import {
  TrendingUp,
  Percent,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Search,
  CheckCircle,
  AlertOctagon,
  Sliders,
  Zap,
} from 'lucide-react';

export default function DerivativesPage() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('futures'); // 'futures' | 'margin'
  const [futuresConfigs, setFuturesConfigs] = useState([]);
  const [marginConfigs, setMarginConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Modals
  const [futuresModalOpen, setFuturesModalOpen] = useState(false);
  const [marginModalOpen, setMarginModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Futures Form
  const [futuresForm, setFuturesForm] = useState({
    symbol: '',
    max_leverage: '100',
    initial_margin_rate: '0.01',
    maintenance_margin_rate: '0.005',
    max_position_size: '1000000',
    min_position_size: '10',
    funding_rate_hourly: '0.0001',
    liquidation_fee_rate: '0.015',
    liquidation_threshold: '1',
    warning_threshold: '0.8',
  });

  // Margin Interest Form
  const [marginForm, setMarginForm] = useState({
    asset: '',
    daily_interest_rate: '0.0005',
    max_leverage: '10',
    max_borrow_limit: '500000',
    min_borrow_amount: '50',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [futRes, marRes] = await Promise.allSettled([
        api('/api/futures-configs'),
        api('/api/margin-interest-configs'),
      ]);

      if (futRes.status === 'fulfilled') {
        const d = futRes.value;
        setFuturesConfigs(Array.isArray(d) ? d : d?.futures_configs || d?.data || []);
      }
      if (marRes.status === 'fulfilled') {
        const d = marRes.value;
        setMarginConfigs(Array.isArray(d) ? d : d?.margin_interest_configs || d?.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load derivatives risk configs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- Futures Actions ---
  const handleSaveFutures = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api(`/api/futures-configs/${editingItem.symbol}`, {
          method: 'PATCH',
          body: {
            max_leverage: futuresForm.max_leverage,
            initial_margin_rate: futuresForm.initial_margin_rate,
            maintenance_margin_rate: futuresForm.maintenance_margin_rate,
            max_position_size: futuresForm.max_position_size,
            min_position_size: futuresForm.min_position_size,
            funding_rate_hourly: futuresForm.funding_rate_hourly,
            liquidation_fee_rate: futuresForm.liquidation_fee_rate,
            liquidation_threshold: futuresForm.liquidation_threshold,
            warning_threshold: futuresForm.warning_threshold,
          },
        });
        showToast(`Updated perpetual specs for ${editingItem.symbol}`);
      } else {
        await api('/api/futures-configs', {
          method: 'POST',
          body: {
            ...futuresForm,
            symbol: futuresForm.symbol.toUpperCase(),
          },
        });
        showToast(`Created perpetual contract spec for ${futuresForm.symbol}`);
      }
      setFuturesModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save futures config', 'error');
    }
  };

  const handleDeleteFutures = async (symbol) => {
    const ok = await confirm({
      title: 'Delete Futures Market Spec',
      message: `Are you sure you want to delete the futures specification for ${symbol}? Position opens and leverage tiers will be disabled.`,
      confirmText: 'Delete Spec',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/futures-configs/${symbol}`, { method: 'DELETE' });
      showToast(`Deleted futures spec for ${symbol}`);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete futures spec', 'error');
    }
  };

  // --- Margin Actions ---
  const handleSaveMargin = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api(`/api/margin-interest-configs/${editingItem.asset}`, {
          method: 'PATCH',
          body: {
            daily_interest_rate: marginForm.daily_interest_rate,
            max_leverage: marginForm.max_leverage,
            max_borrow_limit: marginForm.max_borrow_limit,
            min_borrow_amount: marginForm.min_borrow_amount,
          },
        });
        showToast(`Updated margin borrow specs for ${editingItem.asset}`);
      } else {
        await api('/api/margin-interest-configs', {
          method: 'POST',
          body: {
            ...marginForm,
            asset: marginForm.asset.toUpperCase(),
          },
        });
        showToast(`Configured margin borrow for ${marginForm.asset}`);
      }
      setMarginModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save margin config', 'error');
    }
  };

  const handleDeleteMargin = async (asset) => {
    const ok = await confirm({
      title: 'Delete Margin Interest Spec',
      message: `Are you sure you want to delete the margin interest configuration for ${asset}?`,
      confirmText: 'Delete Spec',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/margin-interest-configs/${asset}`, { method: 'DELETE' });
      showToast(`Deleted margin interest for ${asset}`);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete margin spec', 'error');
    }
  };

  const filteredFutures = futuresConfigs.filter((f) =>
    (f.symbol || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMargin = marginConfigs.filter((m) =>
    (m.asset || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Derivatives & Risk Specs
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
            Govern perpetual futures leverage limits, initial & maintenance margins, hourly funding rates, and margin borrow interest schedules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'futures' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setFuturesForm({
                  symbol: '',
                  max_leverage: '50',
                  initial_margin_rate: '0.02',
                  maintenance_margin_rate: '0.01',
                  max_position_size: '1000000',
                  min_position_size: '10',
                  funding_rate_hourly: '0.0001',
                  liquidation_fee_rate: '0.015',
                  liquidation_threshold: '1',
                  warning_threshold: '0.8',
                });
                setFuturesModalOpen(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#4d77f0',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Perpetual Contract
            </button>
          )}

          {activeTab === 'margin' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setMarginForm({
                  asset: '',
                  daily_interest_rate: '0.0005',
                  max_leverage: '10',
                  max_borrow_limit: '500000',
                  min_borrow_amount: '50',
                });
                setMarginModalOpen(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#4d77f0',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Configure Margin Asset
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div
        style={{
          background: '#13151c',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('futures')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'futures' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'futures' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <TrendingUp size={14} /> Perpetual Futures Specs ({futuresConfigs.length})
          </button>
          <button
            onClick={() => setActiveTab('margin')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'margin' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'margin' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Percent size={14} /> Margin Borrow Rates ({marginConfigs.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
              }}
            />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                background: '#181a22',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={fetchAll}
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
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* --- Tab 1: Futures Table --- */}
      {activeTab === 'futures' && (
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflowX: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Contract</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Max Leverage</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Initial Margin</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Maint. Margin</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Hourly Funding</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Position Limits</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Loading futures configs...
                  </td>
                </tr>
              ) : filteredFutures.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No perpetual futures contracts configured.
                  </td>
                </tr>
              ) : (
                filteredFutures.map((f) => (
                  <tr key={f.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                      {f.symbol}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                        }}
                      >
                        {Number(f.max_leverage)}x
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      {(Number(f.initial_margin_rate) * 100).toFixed(2)}%
                    </td>
                    <td style={{ padding: '14px 18px', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                      {(Number(f.maintenance_margin_rate) * 100).toFixed(2)}%
                    </td>
                    <td style={{ padding: '14px 18px', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      {(Number(f.funding_rate_hourly) * 100).toFixed(4)}% / hr
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
                      {f.min_position_size} – {Number(f.max_position_size).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingItem(f);
                            setFuturesForm({
                              symbol: f.symbol,
                              max_leverage: f.max_leverage,
                              initial_margin_rate: f.initial_margin_rate,
                              maintenance_margin_rate: f.maintenance_margin_rate,
                              max_position_size: f.max_position_size,
                              min_position_size: f.min_position_size,
                              funding_rate_hourly: f.funding_rate_hourly,
                              liquidation_fee_rate: f.liquidation_fee_rate,
                              liquidation_threshold: f.liquidation_threshold,
                              warning_threshold: f.warning_threshold,
                            });
                            setFuturesModalOpen(true);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteFutures(f.symbol)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Tab 2: Margin Borrow Rates Table --- */}
      {activeTab === 'margin' && (
        <div
          style={{
            background: '#13151c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflowX: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Borrow Asset</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Daily Interest Rate</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Annualized (APR)</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Max Margin Leverage</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Borrow Capacity Limits</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Loading margin interest specs...
                  </td>
                </tr>
              ) : filteredMargin.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No margin borrow assets configured.
                  </td>
                </tr>
              ) : (
                filteredMargin.map((m) => (
                  <tr key={m.asset} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      {m.asset}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#fff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {(Number(m.daily_interest_rate) * 100).toFixed(4)}% / day
                    </td>
                    <td style={{ padding: '14px 18px', color: '#60a5fa', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {(Number(m.daily_interest_rate) * 365 * 100).toFixed(2)}% APR
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'rgba(168, 85, 247, 0.12)',
                          color: '#c084fc',
                          border: '1px solid rgba(168, 85, 247, 0.25)',
                        }}
                      >
                        {Number(m.max_leverage)}x
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)' }}>
                      Min: {m.min_borrow_amount} | Max: {Number(m.max_borrow_limit).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingItem(m);
                            setMarginForm({
                              asset: m.asset,
                              daily_interest_rate: m.daily_interest_rate,
                              max_leverage: m.max_leverage,
                              max_borrow_limit: m.max_borrow_limit,
                              min_borrow_amount: m.min_borrow_amount,
                            });
                            setMarginModalOpen(true);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteMargin(m.asset)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Modal: Futures Config --- */}
      {futuresModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              {editingItem ? `Edit Futures Spec: ${editingItem.symbol}` : 'Configure Perpetual Futures Contract'}
            </h3>
            <form onSubmit={handleSaveFutures}>
              {!editingItem && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Contract Symbol (e.g. BTCUSDT-PERP)</label>
                  <input
                    type="text"
                    required
                    value={futuresForm.symbol}
                    onChange={(e) => setFuturesForm({ ...futuresForm, symbol: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Max Leverage</label>
                  <input
                    type="text"
                    required
                    value={futuresForm.max_leverage}
                    onChange={(e) => setFuturesForm({ ...futuresForm, max_leverage: e.target.value })}
                    placeholder="100"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Initial Margin Rate</label>
                  <input
                    type="text"
                    required
                    value={futuresForm.initial_margin_rate}
                    onChange={(e) => setFuturesForm({ ...futuresForm, initial_margin_rate: e.target.value })}
                    placeholder="0.01"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Maint. Margin Rate</label>
                  <input
                    type="text"
                    required
                    value={futuresForm.maintenance_margin_rate}
                    onChange={(e) => setFuturesForm({ ...futuresForm, maintenance_margin_rate: e.target.value })}
                    placeholder="0.005"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Max Position Size</label>
                  <input
                    type="text"
                    required
                    value={futuresForm.max_position_size}
                    onChange={(e) => setFuturesForm({ ...futuresForm, max_position_size: e.target.value })}
                    placeholder="1000000"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Min Position Size</label>
                  <input
                    type="text"
                    required
                    value={futuresForm.min_position_size}
                    onChange={(e) => setFuturesForm({ ...futuresForm, min_position_size: e.target.value })}
                    placeholder="10"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Hourly Funding Rate (decimal)</label>
                  <input
                    type="text"
                    required
                    value={futuresForm.funding_rate_hourly}
                    onChange={(e) => setFuturesForm({ ...futuresForm, funding_rate_hourly: e.target.value })}
                    placeholder="0.0001"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Liquidation Fee Rate</label>
                  <input
                    type="text"
                    required
                    value={futuresForm.liquidation_fee_rate}
                    onChange={(e) => setFuturesForm({ ...futuresForm, liquidation_fee_rate: e.target.value })}
                    placeholder="0.015"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setFuturesModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Margin Interest Config --- */}
      {marginModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              {editingItem ? `Edit Margin Asset: ${editingItem.asset}` : 'Configure Margin Borrow Spec'}
            </h3>
            <form onSubmit={handleSaveMargin}>
              {!editingItem && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Borrow Asset (e.g. USDT, BTC)</label>
                  <input
                    type="text"
                    required
                    value={marginForm.asset}
                    onChange={(e) => setMarginForm({ ...marginForm, asset: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Daily Interest Rate</label>
                  <input
                    type="text"
                    required
                    value={marginForm.daily_interest_rate}
                    onChange={(e) => setMarginForm({ ...marginForm, daily_interest_rate: e.target.value })}
                    placeholder="0.0005"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Max Margin Leverage</label>
                  <input
                    type="text"
                    required
                    value={marginForm.max_leverage}
                    onChange={(e) => setMarginForm({ ...marginForm, max_leverage: e.target.value })}
                    placeholder="10"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Max Borrow Capacity</label>
                  <input
                    type="text"
                    required
                    value={marginForm.max_borrow_limit}
                    onChange={(e) => setMarginForm({ ...marginForm, max_borrow_limit: e.target.value })}
                    placeholder="500000"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Min Borrow Amount</label>
                  <input
                    type="text"
                    required
                    value={marginForm.min_borrow_amount}
                    onChange={(e) => setMarginForm({ ...marginForm, min_borrow_amount: e.target.value })}
                    placeholder="50"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setMarginModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Margin Spec
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
