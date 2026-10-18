import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Shield,
  DollarSign,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { ShimmerTableRows } from '../components/Shimmer';

export default function DerivativesPage() {
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'risk' ? 'risk' : tabFromUrl === 'margin' ? 'margin' : 'futures'
  );

  useEffect(() => {
    if (tabFromUrl && ['futures', 'margin', 'risk'].includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };
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

  // Risk & Insurance Monitoring State
  const [insuranceFund, setInsuranceFund] = useState(null);
  const [adlQueue, setAdlQueue] = useState([]);
  const [adlSymbolFilter, setAdlSymbolFilter] = useState('');
  const [feeReport, setFeeReport] = useState([]);
  const [spotRiskLimits, setSpotRiskLimits] = useState({
    fat_finger_pct: '0.10',
    max_notional: '500000',
  });
  const [marginRiskLimits, setMarginRiskLimits] = useState({
    warning_threshold: '1.20',
    call_threshold: '1.10',
    liquidation_threshold: '1.05',
    default_cross_leverage: '3',
  });
  const [savingSpotRisk, setSavingSpotRisk] = useState(false);
  const [savingMarginRisk, setSavingMarginRisk] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [futRes, marRes, insRes, adlRes, feeRes, spotRkRes, marRkRes] = await Promise.allSettled([
        api('/api/futures-configs'),
        api('/api/margin-interest-configs'),
        api('/api/risk/insurance-fund'),
        api(`/api/risk/adl-queue${adlSymbolFilter ? `?symbol=${adlSymbolFilter}` : ''}`),
        api('/api/trades/fees'),
        api('/api/risk-limits/spot'),
        api('/api/risk-limits/margin'),
      ]);

      if (futRes.status === 'fulfilled') {
        const d = futRes.value;
        setFuturesConfigs(Array.isArray(d) ? d : d?.futures_configs || d?.data || []);
      }
      if (marRes.status === 'fulfilled') {
        const d = marRes.value;
        setMarginConfigs(Array.isArray(d) ? d : d?.margin_interest_configs || d?.data || []);
      }
      if (insRes.status === 'fulfilled' && insRes.value?.insurance_fund) {
        setInsuranceFund(insRes.value.insurance_fund);
      }
      if (adlRes.status === 'fulfilled') {
        const queue = adlRes.value.adl_queue || adlRes.value.queue || [];
        setAdlQueue(Array.isArray(queue) ? queue : []);
      }
      if (feeRes.status === 'fulfilled') {
        const data = feeRes.value.data || feeRes.value.fees || [];
        setFeeReport(Array.isArray(data) ? data : []);
      }
      if (spotRkRes.status === 'fulfilled' && spotRkRes.value) {
        setSpotRiskLimits((prev) => ({
          ...prev,
          fat_finger_pct: spotRkRes.value.fat_finger_pct || prev.fat_finger_pct,
          max_notional: spotRkRes.value.max_notional || prev.max_notional,
        }));
      }
      if (marRkRes.status === 'fulfilled' && marRkRes.value) {
        setMarginRiskLimits((prev) => ({
          ...prev,
          warning_threshold: marRkRes.value.warning_threshold || prev.warning_threshold,
          call_threshold: marRkRes.value.call_threshold || prev.call_threshold,
          liquidation_threshold: marRkRes.value.liquidation_threshold || prev.liquidation_threshold,
          default_cross_leverage: marRkRes.value.default_cross_leverage || prev.default_cross_leverage,
        }));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load derivatives risk configs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSpotRisk = async (e) => {
    e.preventDefault();
    setSavingSpotRisk(true);
    try {
      await api('/api/risk-limits/spot', {
        method: 'PUT',
        body: spotRiskLimits,
      });
      showToast('Spot risk limits updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update spot risk limits', 'error');
    } finally {
      setSavingSpotRisk(false);
    }
  };

  const handleSaveMarginRisk = async (e) => {
    e.preventDefault();
    setSavingMarginRisk(true);
    try {
      await api('/api/risk-limits/margin', {
        method: 'PUT',
        body: marginRiskLimits,
      });
      showToast('Margin risk thresholds updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update margin risk thresholds', 'error');
    } finally {
      setSavingMarginRisk(false);
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
            onClick={() => handleTabChange('futures')}
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
            onClick={() => handleTabChange('margin')}
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
          <button
            onClick={() => handleTabChange('risk')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'risk' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'risk' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Shield size={14} /> Risk & Insurance Fund
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
                <ShimmerTableRows rows={6} cols={7} colWidths={['20%', '15%', '20%', '15%', '20%', '20%', '15%']} />
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
                <ShimmerTableRows rows={6} cols={6} colWidths={['20%', '20%', '15%', '15%', '20%', '10%']} />
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

      {/* --- Tab 3: Risk & Insurance Fund --- */}
      {activeTab === 'risk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Insurance Fund Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Total Fund Balance */}
            <div
              style={{
                background: '#13151c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  Insurance Fund Balance
                </span>
                <Shield size={16} color="#34d399" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                ${insuranceFund?.total_fund_balance_usd ? Number(insuranceFund.total_fund_balance_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </div>
              <span style={{ fontSize: '12px', color: '#34d399', marginTop: '4px', display: 'block' }}>
                Backed collateral reserve
              </span>
            </div>

            {/* Total Open Interest */}
            <div
              style={{
                background: '#13151c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  Futures Open Interest
                </span>
                <TrendingUp size={16} color="#818cf8" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                ${insuranceFund?.total_open_interest_usd ? Number(insuranceFund.total_open_interest_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', display: 'block' }}>
                Live active perpetual positions
              </span>
            </div>

            {/* Coverage Ratio */}
            <div
              style={{
                background: '#13151c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  Coverage Ratio
                </span>
                <Percent size={16} color="#fbbf24" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                {insuranceFund?.coverage_ratio ? `${(Number(insuranceFund.coverage_ratio) * 100).toFixed(2)}%` : '0.00%'}
              </div>
              <span style={{ fontSize: '12px', color: insuranceFund?.is_depleted ? '#ef4444' : 'rgba(255,255,255,0.5)', marginTop: '4px', display: 'block' }}>
                {insuranceFund?.is_depleted ? 'Critical depletion warning (< 1%)' : 'Healthy reserve margin (target ≥ 5%)'}
              </span>
            </div>

            {/* Health / Alert Level */}
            <div
              style={{
                background: '#13151c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  System Risk Level
                </span>
                <AlertTriangle size={16} color={insuranceFund?.alert_level === 'CRITICAL' ? '#ef4444' : insuranceFund?.alert_level === 'WARNING' ? '#fbbf24' : '#34d399'} />
              </div>
              <div style={{ marginTop: '6px' }}>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    background: insuranceFund?.alert_level === 'CRITICAL'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : insuranceFund?.alert_level === 'WARNING'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                    color: insuranceFund?.alert_level === 'CRITICAL'
                      ? '#f87171'
                      : insuranceFund?.alert_level === 'WARNING'
                      ? '#fbbf24'
                      : '#34d399',
                    border: `1px solid ${
                      insuranceFund?.alert_level === 'CRITICAL'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : insuranceFund?.alert_level === 'WARNING'
                        ? 'rgba(245, 158, 11, 0.3)'
                        : 'rgba(16, 185, 129, 0.3)'
                    }`,
                    display: 'inline-block',
                  }}
                >
                  {insuranceFund?.alert_level || 'NORMAL'}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', display: 'block' }}>
                Auto-Deleveraging (ADL) trigger state
              </span>
            </div>
          </div>

          {/* Dynamic Risk Parameters: Spot & Margin */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Spot Risk Limits */}
            <div
              style={{
                background: '#13151c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sliders size={18} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 600 }}>
                  Spot Market Risk Limits
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: '1.5' }}>
                Guards matching engine against fat-finger orders and extreme price deviation spikes.
              </p>

              <form onSubmit={handleSaveSpotRisk}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                      Fat-Finger Price Deviation Band (e.g. 0.10 = ±10%)
                    </label>
                    <input
                      type="text"
                      required
                      value={spotRiskLimits.fat_finger_pct}
                      onChange={(e) => setSpotRiskLimits({ ...spotRiskLimits, fat_finger_pct: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#181a24',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                      Max Order Notional Value (USD)
                    </label>
                    <input
                      type="text"
                      required
                      value={spotRiskLimits.max_notional}
                      onChange={(e) => setSpotRiskLimits({ ...spotRiskLimits, max_notional: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#181a24',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSpotRisk}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#4d77f0',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: savingSpotRisk ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingSpotRisk ? 'Saving Limits...' : 'Save Spot Risk Limits'}
                </button>
              </form>
            </div>

            {/* Margin Risk Limits */}
            <div
              style={{
                background: '#13151c',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Percent size={18} color="#fbbf24" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 600 }}>
                  Margin Maintenance & Liquidation Thresholds
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: '1.5' }}>
                Account margin level triggers for warning notifications, margin calls, and automated forced liquidations.
              </p>

              <form onSubmit={handleSaveMarginRisk}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                      Warning Ratio (e.g. 1.20)
                    </label>
                    <input
                      type="text"
                      required
                      value={marginRiskLimits.warning_threshold}
                      onChange={(e) => setMarginRiskLimits({ ...marginRiskLimits, warning_threshold: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#181a24',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                      Margin Call (e.g. 1.10)
                    </label>
                    <input
                      type="text"
                      required
                      value={marginRiskLimits.call_threshold}
                      onChange={(e) => setMarginRiskLimits({ ...marginRiskLimits, call_threshold: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#181a24',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                      Liquidation (e.g. 1.05)
                    </label>
                    <input
                      type="text"
                      required
                      value={marginRiskLimits.liquidation_threshold}
                      onChange={(e) => setMarginRiskLimits({ ...marginRiskLimits, liquidation_threshold: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#181a24',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                      Default Leverage (e.g. 3)
                    </label>
                    <input
                      type="text"
                      required
                      value={marginRiskLimits.default_cross_leverage}
                      onChange={(e) => setMarginRiskLimits({ ...marginRiskLimits, default_cross_leverage: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#181a24',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingMarginRisk}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#4d77f0',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: savingMarginRisk ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingMarginRisk ? 'Saving Thresholds...' : 'Save Margin Thresholds'}
                </button>
              </form>
            </div>
          </div>

          {/* ADL Queue Section */}
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 600 }}>
                  Live ADL (Auto-Deleveraging) Counterparty Queue
                </h3>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  Prioritized position list for automated deleveraging if the insurance fund is depleted during a bankruptcy event.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Filter by Symbol (e.g. BTCUSDT)"
                  value={adlSymbolFilter}
                  onChange={(e) => setAdlSymbolFilter(e.target.value.toUpperCase())}
                  style={{
                    padding: '8px 12px',
                    background: '#181a24',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={fetchAll}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={12} /> Refresh Queue
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                    <th style={{ padding: '12px 14px' }}>Rank</th>
                    <th style={{ padding: '12px 14px' }}>User ID</th>
                    <th style={{ padding: '12px 14px' }}>Position ID</th>
                    <th style={{ padding: '12px 14px' }}>Symbol</th>
                    <th style={{ padding: '12px 14px' }}>Side</th>
                    <th style={{ padding: '12px 14px' }}>Size</th>
                    <th style={{ padding: '12px 14px' }}>Entry Price</th>
                    <th style={{ padding: '12px 14px' }}>Leverage</th>
                    <th style={{ padding: '12px 14px' }}>PnL %</th>
                    <th style={{ padding: '12px 14px' }}>ADL Score</th>
                  </tr>
                </thead>
                <tbody>
                  {adlQueue.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        No positions currently queued for Auto-Deleveraging.
                      </td>
                    </tr>
                  ) : (
                    adlQueue.map((item, idx) => (
                      <tr key={item.position_id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#fbbf24' }}>
                          #{item.queue_rank || idx + 1}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#9ca3af', fontSize: '12px' }}>
                          {item.user_id ? `${item.user_id.slice(0, 10)}...` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                          {item.position_id ? `${item.position_id.slice(0, 10)}...` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>
                          {item.symbol}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: item.side === 'LONG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: item.side === 'LONG' ? '#34d399' : '#f87171',
                            }}
                          >
                            {item.side}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>
                          {item.size}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>
                          ${item.entry_price}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#818cf8', fontWeight: 600 }}>
                          {item.leverage}x
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: Number(item.pnl_percent) >= 0 ? '#34d399' : '#f87171' }}>
                          {item.pnl_percent}%
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24' }}>
                          {item.adl_score}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exchange Fee Breakdown Section */}
          <div
            style={{
              background: '#13151c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 600 }}>
                  Cumulative Exchange Trading Fee Breakdown
                </h3>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  All-time revenue audit by collected token asset and maker/taker role.
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                    <th style={{ padding: '12px 14px' }}>Asset</th>
                    <th style={{ padding: '12px 14px' }}>Liquidity Role</th>
                    <th style={{ padding: '12px 14px' }}>Total Fee Collected</th>
                    <th style={{ padding: '12px 14px' }}>Trade Executions</th>
                    <th style={{ padding: '12px 14px' }}>USD Value Approx.</th>
                  </tr>
                </thead>
                <tbody>
                  {feeReport.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '30px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        No fee revenue history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    feeReport.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#fff' }}>
                          {row.fee_asset}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: row.role === 'MAKER' ? 'rgba(77, 119, 240, 0.15)' : 'rgba(129, 140, 248, 0.15)',
                              color: row.role === 'MAKER' ? '#818cf8' : '#a5b4fc',
                            }}
                          >
                            {row.role || 'TAKER'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#34d399', fontWeight: 600 }}>
                          {row.total_fee} {row.fee_asset}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.7)' }}>
                          {Number(row.trade_count || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#fff' }}>
                          ${row.total_fee_usd || row.value_usd ? Number(row.total_fee_usd || row.value_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
