import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import {
  Award,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Search,
  Sliders,
  ShieldCheck,
  CheckCircle,
  Percent,
} from 'lucide-react';

export default function FeeTiersPage() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('tiers'); // 'tiers' | 'platform' | 'kyc'
  const [feeTiers, setFeeTiers] = useState([]);
  const [platformFees, setPlatformFees] = useState([]);
  const [kycLimits, setKycLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Forms
  const [tierForm, setTierForm] = useState({
    tier: 0,
    min_volume_usd_30d: 0,
    maker_rate: 0.001,
    taker_rate: 0.002,
    min_lim_balance: 0,
    lim_discount_display: 0,   // UI percentage (0–100)
    lim_discount_percent: 0,   // stored as fraction (0–1)
  });

  const [feeForm, setFeeForm] = useState({
    name: '',
    percentage: '0.001',
    fixed_amount: '0',
  });

  const [kycForm, setKycForm] = useState({
    tier: 0,
    daily_usd_cap: 10000,
    monthly_usd_cap: 50000,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tierRes, feeRes, kycRes] = await Promise.allSettled([
        api('/api/fee-tiers'),
        api('/api/fees'),
        api('/api/kyc-limits'),
      ]);

      if (tierRes.status === 'fulfilled') {
        const d = tierRes.value;
        setFeeTiers(Array.isArray(d) ? d : d?.tiers || d?.fee_tiers || d?.data || []);
      }
      if (feeRes.status === 'fulfilled') {
        const d = feeRes.value;
        setPlatformFees(Array.isArray(d) ? d : d?.platform_fees || d?.data || []);
      }
      if (kycRes.status === 'fulfilled') {
        const d = kycRes.value;
        setKycLimits(Array.isArray(d) ? d : d?.limits || d?.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load fee configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- Tier Actions ---
  const handleSaveTier = async (e) => {
    e.preventDefault();
    try {
      await api('/api/fee-tiers', {
        method: 'POST',
        body: {
          tier: Number(tierForm.tier),
          min_volume_usd_30d: Number(tierForm.min_volume_usd_30d),
          maker_rate: Number(tierForm.maker_rate),
          taker_rate: Number(tierForm.taker_rate),
          min_lim_balance: Number(tierForm.min_lim_balance) || 0,
          lim_discount_percent: Number(tierForm.lim_discount_percent) || 0,
        },
      });
      showToast(`Saved VIP Tier ${tierForm.tier}`);
      setTierModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save tier', 'error');
    }
  };

  const handleDeleteTier = async (tier) => {
    const ok = await confirm({
      title: `Delete VIP Tier ${tier}`,
      message: `Are you sure you want to delete VIP Tier ${tier}? Users on this tier will fall back to standard fee schedules.`,
      confirmText: 'Delete Tier',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/fee-tiers/${tier}`, { method: 'DELETE' });
      showToast(`Deleted VIP Tier ${tier}`);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete tier', 'error');
    }
  };

  // --- Platform Fee Actions ---
  const handleSaveFee = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api(`/api/fees/${editingItem.name}`, {
          method: 'PATCH',
          body: {
            percentage: feeForm.percentage,
            fixed_amount: feeForm.fixed_amount,
          },
        });
        showToast(`Updated fee ${editingItem.name}`);
      } else {
        await api('/api/fees', {
          method: 'POST',
          body: feeForm,
        });
        showToast(`Created fee rule ${feeForm.name}`);
      }
      setFeeModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save fee', 'error');
    }
  };

  const handleDeleteFee = async (name) => {
    const ok = await confirm({
      title: `Delete Platform Fee`,
      message: `Are you sure you want to delete the platform fee rule "${name}"?`,
      confirmText: 'Delete Fee',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/fees/${name}`, { method: 'DELETE' });
      showToast(`Deleted fee ${name}`);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to delete fee', 'error');
    }
  };

  // --- KYC Limit Actions ---
  const handleSaveKycLimit = async (e) => {
    e.preventDefault();
    try {
      await api('/api/kyc-limits', {
        method: 'POST',
        body: {
          tier: Number(kycForm.tier),
          daily_usd_cap: Number(kycForm.daily_usd_cap),
          monthly_usd_cap: Number(kycForm.monthly_usd_cap),
        },
      });
      showToast(`Saved limits for KYC Tier ${kycForm.tier}`);
      setKycModalOpen(false);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'Failed to save KYC limits', 'error');
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
            Fee Tiers & Limits
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
            Configure maker/taker VIP volume ladders, platform service charges, and tiered KYC withdrawal caps.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'tiers' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setTierForm({
                  tier: feeTiers.length,
                  min_volume_usd_30d: 50000,
                  maker_rate: 0.0008,
                  taker_rate: 0.0016,
                });
                setTierModalOpen(true);
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
              <Plus size={14} /> Add VIP Tier
            </button>
          )}

          {activeTab === 'platform' && (
            <button
              onClick={() => {
                setEditingItem(null);
                setFeeForm({ name: '', percentage: '0.001', fixed_amount: '0' });
                setFeeModalOpen(true);
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
              <Plus size={14} /> Add Platform Fee
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
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
            onClick={() => setActiveTab('tiers')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'tiers' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'tiers' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Award size={14} /> VIP Volume Tiers ({feeTiers.length})
          </button>
          <button
            onClick={() => setActiveTab('platform')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'platform' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'platform' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Percent size={14} /> Platform Service Fees ({platformFees.length})
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeTab === 'kyc' ? '#4d77f0' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: activeTab === 'kyc' ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <ShieldCheck size={14} /> KYC Withdrawal Caps ({kycLimits.length})
          </button>
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

      {/* --- Tab 1: VIP Fee Tiers Table --- */}
      {activeTab === 'tiers' && (
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
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>VIP Tier</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>30-Day Min Volume (USD)</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Maker Fee Rate</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Taker Fee Rate</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Min LIM Balance</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>LIM Discount</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Loading fee tiers...
                  </td>
                </tr>
              ) : feeTiers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No fee tiers configured.
                  </td>
                </tr>
              ) : (
                feeTiers
                  .sort((a, b) => a.tier - b.tier)
                  .map((tier) => (
                    <tr key={tier.tier} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: tier.tier === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(245, 158, 11, 0.15)',
                            color: tier.tier === 0 ? '#94a3b8' : '#fbbf24',
                            border: `1px solid ${tier.tier === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(245, 158, 11, 0.3)'}`,
                          }}
                        >
                          VIP {tier.tier}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        ${Number(tier.min_volume_usd_30d).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#34d399', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {(Number(tier.maker_rate) * 100).toFixed(4)}% ({tier.maker_rate})
                      </td>
                      <td style={{ padding: '14px 18px', color: '#60a5fa', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {(Number(tier.taker_rate) * 100).toFixed(4)}% ({tier.taker_rate})
                      </td>
                      <td style={{ padding: '14px 18px', color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                        {tier.min_lim_balance ? Number(tier.min_lim_balance).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                        {tier.lim_discount_percent ? `${(Number(tier.lim_discount_percent) * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setEditingItem(tier);
                              const pct = Number(tier.lim_discount_percent) || 0;
                              setTierForm({
                                tier: tier.tier,
                                min_volume_usd_30d: tier.min_volume_usd_30d,
                                maker_rate: tier.maker_rate,
                                taker_rate: tier.taker_rate,
                                min_lim_balance: tier.min_lim_balance || 0,
                                lim_discount_display: (pct * 100).toFixed(0),
                                lim_discount_percent: pct.toFixed(4),
                              });
                              setTierModalOpen(true);
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
                            onClick={() => handleDeleteTier(tier.tier)}
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

      {/* --- Tab 2: Platform Service Fees --- */}
      {activeTab === 'platform' && (
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
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Fee Identifier</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Percentage Rate</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Fixed Flat Amount</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Loading platform fees...
                  </td>
                </tr>
              ) : platformFees.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No platform service fees configured.
                  </td>
                </tr>
              ) : (
                platformFees.map((fee) => (
                  <tr key={fee.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      {fee.name}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#818cf8', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {(Number(fee.percentage) * 100).toFixed(4)}% ({fee.percentage})
                    </td>
                    <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)' }}>
                      {fee.fixed_amount}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingItem(fee);
                            setFeeForm({
                              name: fee.name,
                              percentage: fee.percentage,
                              fixed_amount: fee.fixed_amount,
                            });
                            setFeeModalOpen(true);
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
                          onClick={() => handleDeleteFee(fee.name)}
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

      {/* --- Tab 3: KYC Tier Limits --- */}
      {activeTab === 'kyc' && (
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
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>KYC Verification Level</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Daily Withdrawal Cap (USD)</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Monthly Withdrawal Cap (USD)</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Loading KYC limits...
                  </td>
                </tr>
              ) : kycLimits.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No KYC limits configured.
                  </td>
                </tr>
              ) : (
                kycLimits
                  .sort((a, b) => a.tier - b.tier)
                  .map((limit) => (
                    <tr key={limit.tier} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background:
                              limit.tier === 0
                                ? 'rgba(239, 68, 68, 0.12)'
                                : limit.tier === 1
                                ? 'rgba(59, 130, 246, 0.12)'
                                : limit.tier === 2
                                ? 'rgba(16, 185, 129, 0.12)'
                                : 'rgba(168, 85, 247, 0.12)',
                            color:
                              limit.tier === 0
                                ? '#f87171'
                                : limit.tier === 1
                                ? '#60a5fa'
                                : limit.tier === 2
                                ? '#34d399'
                                : '#c084fc',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          Level {limit.tier} ({limit.tier === 0 ? 'Unverified' : limit.tier === 1 ? 'Email Verified' : limit.tier === 2 ? 'Sumsub ID Verified' : 'Institutional / VIP'})
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        {limit.daily_usd_cap === -1 ? (
                          <span style={{ color: '#34d399' }}>UNLIMITED</span>
                        ) : (
                          `$${Number(limit.daily_usd_cap).toLocaleString()}`
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        {limit.monthly_usd_cap === -1 ? (
                          <span style={{ color: '#34d399' }}>UNLIMITED</span>
                        ) : (
                          `$${Number(limit.monthly_usd_cap).toLocaleString()}`
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setKycForm({
                              tier: limit.tier,
                              daily_usd_cap: limit.daily_usd_cap,
                              monthly_usd_cap: limit.monthly_usd_cap,
                            });
                            setKycModalOpen(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'rgba(77, 119, 240, 0.15)',
                            border: '1px solid rgba(77, 119, 240, 0.3)',
                            color: '#818cf8',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Edit Limits
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Modal: Add / Edit VIP Tier --- */}
      {tierModalOpen && (
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
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              Configure VIP Fee Tier
            </h3>
            <form onSubmit={handleSaveTier}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>VIP Tier Index (0 = Regular)</label>
                <input
                  type="number"
                  required
                  value={tierForm.tier}
                  onChange={(e) => setTierForm({ ...tierForm, tier: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Min 30-Day Volume (USD)</label>
                <input
                  type="number"
                  required
                  value={tierForm.min_volume_usd_30d}
                  onChange={(e) => setTierForm({ ...tierForm, min_volume_usd_30d: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Maker Rate (e.g. 0.001)</label>
                  <input
                    type="number"
                    step="0.00001"
                    required
                    value={tierForm.maker_rate}
                    onChange={(e) => setTierForm({ ...tierForm, maker_rate: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Taker Rate (e.g. 0.002)</label>
                  <input
                    type="number"
                    step="0.00001"
                    required
                    value={tierForm.taker_rate}
                    onChange={(e) => setTierForm({ ...tierForm, taker_rate: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Min LIM Balance</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={tierForm.min_lim_balance ?? ''}
                    onChange={(e) => setTierForm({ ...tierForm, min_lim_balance: e.target.value })}
                    placeholder="e.g. 1000"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>LIM tokens required to unlock discount</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>LIM Discount % (0–100)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={tierForm.lim_discount_display ?? ''}
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      setTierForm({ ...tierForm, lim_discount_display: e.target.value, lim_discount_percent: (pct / 100).toFixed(4) });
                    }}
                    placeholder="e.g. 20"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>% discount off base rate when holding LIM</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setTierModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Add / Edit Platform Fee --- */}
      {feeModalOpen && (
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
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              {editingItem ? `Edit Fee: ${editingItem.name}` : 'Create Platform Fee Rule'}
            </h3>
            <form onSubmit={handleSaveFee}>
              {!editingItem && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Fee Name / Operation</label>
                  <input
                    type="text"
                    required
                    value={feeForm.name}
                    onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                    placeholder="e.g. withdrawal_handling, p2p_escrow"
                    style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Percentage Fee (decimal, e.g. 0.002 = 0.2%)</label>
                <input
                  type="text"
                  required
                  value={feeForm.percentage}
                  onChange={(e) => setFeeForm({ ...feeForm, percentage: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Fixed Flat Amount</label>
                <input
                  type="text"
                  required
                  value={feeForm.fixed_amount}
                  onChange={(e) => setFeeForm({ ...feeForm, fixed_amount: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setFeeModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal: Edit KYC Limit --- */}
      {kycModalOpen && (
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
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '18px' }}>
              Edit KYC Tier {kycForm.tier} Withdrawal Caps
            </h3>
            <form onSubmit={handleSaveKycLimit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Daily USD Cap (-1 for Unlimited)</label>
                <input
                  type="number"
                  required
                  value={kycForm.daily_usd_cap}
                  onChange={(e) => setKycForm({ ...kycForm, daily_usd_cap: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Monthly USD Cap (-1 for Unlimited)</label>
                <input
                  type="number"
                  required
                  value={kycForm.monthly_usd_cap}
                  onChange={(e) => setKycForm({ ...kycForm, monthly_usd_cap: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setKycModalOpen(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Update Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
