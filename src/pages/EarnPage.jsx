import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import {
  Coins,
  TrendingUp,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  Clock,
  Lock,
  Unlock,
  AlertCircle,
  Filter,
  DollarSign,
  Award,
} from 'lucide-react';
import { ShimmerTableRows } from '../components/Shimmer';

export default function EarnPage() {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'positions' | 'rewards'
  const [products, setProducts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [rewardsData, setRewardsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'flexible' | 'locked'
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [form, setForm] = useState({
    symbol: 'USDT',
    name: '',
    apyPercent: '6.5',
    minAmount: '10',
    lockPeriodDays: '0',
    isFlexible: true,
    isActive: true,
    totalCapacity: '1000000',
    maxPersonalLimit: '50000',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProducts = async () => {
    try {
      const res = await api('/earn/products?query=all');
      if (res.data) {
        setProducts(res.data);
      } else if (Array.isArray(res)) {
        setProducts(res);
      }
    } catch (err) {
      console.error('Failed to load earn products:', err);
      showToast(err.message || 'Failed to fetch products', 'error');
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await api('/earn/admin/positions');
      if (res.data) {
        setPositions(res.data);
      } else if (Array.isArray(res)) {
        setPositions(res);
      }
    } catch (err) {
      console.error('Failed to load earn positions:', err);
    }
  };

  const fetchRewards = async () => {
    try {
      const res = await api('/earn/admin/rewards');
      setRewardsData(res);
    } catch (err) {
      console.error('Failed to load earn rewards:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchPositions(), fetchRewards()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setForm({
      symbol: 'USDT',
      name: 'USDT Flexible Savings',
      apyPercent: '6.5',
      minAmount: '10',
      lockPeriodDays: '0',
      isFlexible: true,
      isActive: true,
      totalCapacity: '1000000',
      maxPersonalLimit: '50000',
    });
    setProductModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setForm({
      symbol: p.symbol || 'USDT',
      name: p.name || '',
      apyPercent: ((p.apy || 0) * 100).toFixed(2),
      minAmount: String(p.minAmount || '0'),
      lockPeriodDays: String(p.lockPeriodDays || 0),
      isFlexible: p.isFlexible,
      isActive: p.isActive,
      totalCapacity: String(p.totalCapacity || '0'),
      maxPersonalLimit: String(p.maxPersonalLimit || '0'),
    });
    setProductModalOpen(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      const apyDecimal = parseFloat(form.apyPercent) / 100;
      const minAmt = parseFloat(form.minAmount) || 0;
      const lockDays = parseInt(form.lockPeriodDays, 10) || 0;
      const totalCap = parseFloat(form.totalCapacity) || 0;
      const maxLimit = parseFloat(form.maxPersonalLimit) || 0;

      if (editingProduct) {
        // Update product
        await api(`/earn/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: {
            id: editingProduct.id,
            name: form.name,
            apy: apyDecimal,
            minAmount: minAmt,
            isActive: form.isActive,
            totalCapacity: totalCap,
            maxPersonalLimit: maxLimit,
          },
        });
        showToast('Earn product updated successfully');
      } else {
        // Create product
        await api('/earn/admin/products', {
          method: 'POST',
          body: {
            symbol: form.symbol.toUpperCase().trim(),
            name: form.name.trim(),
            apy: apyDecimal,
            minAmount: minAmt,
            lockPeriodDays: lockDays,
            isFlexible: lockDays === 0,
            isActive: form.isActive,
            totalCapacity: totalCap,
            maxPersonalLimit: maxLimit,
          },
        });
        showToast('Earn product created successfully');
      }

      setProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleDeleteProduct = async (p) => {
    const isConfirmed = await confirm({
      title: `Deactivate ${p.name || p.symbol}?`,
      message: `Are you sure you want to deactivate this product? Existing subscribed user positions will continue to earn interest until redeemed or matured, but new subscriptions will be disabled.`,
      confirmLabel: 'Deactivate',
      isDestructive: true,
    });
    if (!isConfirmed) return;

    try {
      await api(`/earn/admin/products/${p.id}`, { method: 'DELETE' });
      showToast(`Product ${p.symbol} deactivated`);
      fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to deactivate product', 'error');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.symbol || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'flexible' && p.isFlexible) ||
      (typeFilter === 'locked' && !p.isFlexible);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.isActive) ||
      (statusFilter === 'inactive' && !p.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtered Positions
  const filteredPositions = positions.filter((pos) => {
    const matchesSearch =
      (pos.userId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pos.asset || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pos.product?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || (pos.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Filtered Rewards History
  const historyList = rewardsData?.history || [];
  const filteredHistory = historyList.filter((h) => {
    return (
      (h.asset || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.userId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.type || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="earn-page" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '8px',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coins size={26} color="var(--primary-solid)" /> Earn & Staking Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
            Configure Simple Earn (flexible) and Fixed Staking products, adjust APY yields, and view platform-wide user accrued earnings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary-solid)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
          >
            <Plus size={18} /> Add Earn Product
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} color="#3b82f6" /> Total Platform Staked (USD)
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            ${(rewardsData?.totalStakedUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active across Flexible & Fixed terms
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="#10b981" /> Total Rewards Distributed
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '8px' }}>
            ${(rewardsData?.totalEarnedUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            All-time cumulative interest credited
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="#f59e0b" /> Yesterday's Rewards Accrued
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            ${(rewardsData?.yesterdayRewardsUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Last 24h daily distribution cycle
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} color="#8b5cf6" /> 30-Day Total Rewards
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            ${(rewardsData?.thirtyDayRewardsUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Past 30 days reward yield
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-medium)', marginBottom: '20px', gap: '24px' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('products'); setStatusFilter('all'); }}
          style={{
            padding: '12px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'products' ? '2px solid var(--primary-solid)' : '2px solid transparent',
            color: activeTab === 'products' ? 'var(--primary-solid)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'products' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Coins size={16} /> Products Catalog ({products.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('positions'); setStatusFilter('all'); }}
          style={{
            padding: '12px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'positions' ? '2px solid var(--primary-solid)' : '2px solid transparent',
            color: activeTab === 'positions' ? 'var(--primary-solid)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'positions' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Lock size={16} /> User Stakes & Positions ({positions.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('rewards'); setStatusFilter('all'); }}
          style={{
            padding: '12px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'rewards' ? '2px solid var(--primary-solid)' : '2px solid transparent',
            color: activeTab === 'rewards' ? 'var(--primary-solid)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'rewards' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={16} /> All Accrued Rewards & Ledger ({historyList.length})
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={
              activeTab === 'products'
                ? 'Search symbol or name...'
                : activeTab === 'positions'
                ? 'Search user ID, asset, product...'
                : 'Search asset, user ID, type...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {activeTab === 'products' && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="all">All Product Types</option>
            <option value="flexible">Simple Earn (Flexible)</option>
            <option value="locked">Fixed Staking (Locked)</option>
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        >
          {activeTab === 'products' ? (
            <>
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </>
          ) : (
            <>
              <option value="all">All Position Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="REDEEMED">REDEEMED</option>
              <option value="MATURED">MATURED</option>
            </>
          )}
        </select>
      </div>

      {/* TAB 1: PRODUCTS TABLE */}
      {activeTab === 'products' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px' }}>Asset</th>
                  <th style={{ padding: '12px 16px' }}>Product Name</th>
                  <th style={{ padding: '12px 16px' }}>Type</th>
                  <th style={{ padding: '12px 16px' }}>Annual APY</th>
                  <th style={{ padding: '12px 16px' }}>Lock Period</th>
                  <th style={{ padding: '12px 16px' }}>Min Amount</th>
                  <th style={{ padding: '12px 16px' }}>Subscribed / Cap</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <ShimmerTableRows cols={9} rows={5} />
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No earn products found. Click "Add Earn Product" to configure one.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isFlexible = p.isFlexible || p.lockPeriodDays === 0;
                    const apyDisplay = ((p.apy || 0) * 100).toFixed(2) + '%';
                    const capDisplay = p.totalCapacity > 0 ? p.totalCapacity.toLocaleString() : 'Unlimited';
                    const subDisplay = (p.totalSubscribed || 0).toLocaleString();

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', marginRight: '6px' }}>
                            {p.symbol}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {p.name}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {isFlexible ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '11px', fontWeight: 600 }}>
                              <Unlock size={12} /> Flexible
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontSize: '11px', fontWeight: 600 }}>
                              <Lock size={12} /> Staking ({p.lockPeriodDays}d)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10b981', fontSize: '14px' }}>
                          {apyDisplay}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {isFlexible ? 'None (Instant)' : `${p.lockPeriodDays} Days`}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {p.minAmount} {p.symbol}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {subDisplay} / {capDisplay}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {p.isActive ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
                              <CheckCircle size={12} /> Active
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              title="Adjust APY and Product Terms"
                              style={{
                                padding: '6px 12px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-medium)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 500,
                              }}
                            >
                              <Edit size={14} /> Adjust APY
                            </button>
                            {p.isActive && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p)}
                                title="Deactivate Product"
                                style={{
                                  padding: '6px 10px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '6px',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USER POSITIONS & STAKES */}
      {activeTab === 'positions' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px' }}>User ID</th>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Type</th>
                  <th style={{ padding: '12px 16px' }}>Principal Staked</th>
                  <th style={{ padding: '12px 16px' }}>Accrued Rewards</th>
                  <th style={{ padding: '12px 16px' }}>Start Date</th>
                  <th style={{ padding: '12px 16px' }}>Maturity Date</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <ShimmerTableRows cols={8} rows={5} />
                ) : filteredPositions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No active or historical user positions found.
                    </td>
                  </tr>
                ) : (
                  filteredPositions.map((pos) => {
                    const isFlexible = pos.product?.isFlexible || pos.product?.lockPeriodDays === 0;
                    const startStr = pos.startDate ? new Date(pos.startDate).toLocaleDateString() : '-';
                    const endStr = pos.endDate ? new Date(pos.endDate).toLocaleDateString() : (isFlexible ? 'Anytime' : '-');

                    return (
                      <tr key={pos.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {pos.userId?.slice(0, 12)}...
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {pos.product?.name || `${pos.asset} Earn`}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {isFlexible ? (
                            <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '11px', fontWeight: 600 }}>
                              Flexible
                            </span>
                          ) : (
                            <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontSize: '11px', fontWeight: 600 }}>
                              Staking
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {pos.amount?.toLocaleString()} {pos.asset}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#10b981' }}>
                          +{(pos.accruedRewards || 0).toFixed(6)} {pos.asset}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {startStr}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {endStr}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {pos.status === 'ACTIVE' ? (
                            <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
                              ACTIVE
                            </span>
                          ) : pos.status === 'MATURED' ? (
                            <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontSize: '11px', fontWeight: 600 }}>
                              MATURED
                            </span>
                          ) : (
                            <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(107, 114, 128, 0.1)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>
                              {pos.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACCRUED REWARDS & DISTRIBUTION LEDGER */}
      {activeTab === 'rewards' && (
        <div>
          {/* Asset Breakdown Summary */}
          {rewardsData?.assetSummaries?.length > 0 && (
            <div style={{ marginBottom: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
                Asset Yield & Staking Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {rewardsData.assetSummaries.map((sum) => (
                  <div key={sum.asset} style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{sum.asset}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Active Staked: <strong style={{ color: 'var(--text-primary)' }}>{sum.activeStaked}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                      Rewards Paid: <strong>+{sum.totalRewards}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px' }}>User ID</th>
                    <th style={{ padding: '12px 16px' }}>Asset</th>
                    <th style={{ padding: '12px 16px' }}>Reward Amount</th>
                    <th style={{ padding: '12px 16px' }}>Applied APY</th>
                    <th style={{ padding: '12px 16px' }}>Distribution Type</th>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <ShimmerTableRows cols={6} rows={5} />
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No reward distributions recorded yet. Daily rewards are calculated and credited automatically at 00:00 UTC.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((h, i) => (
                      <tr key={h.id || i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {h.userId?.slice(0, 12)}...
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {h.asset}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10b981' }}>
                          +{h.amount} {h.asset}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {((h.apy || 0) * 100).toFixed(2)}%
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '11px', fontWeight: 600 }}>
                            {h.type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {h.distributionDate ? new Date(h.distributionDate).toLocaleString() : '-'}
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingProduct ? 'Adjust APY & Product Terms' : 'Add New Earn Product'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Asset Symbol</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                    placeholder="e.g. USDT"
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Product Title</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. USDT Flexible Savings"
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Annual APY % (e.g. 6.5)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.apyPercent}
                    onChange={(e) => setForm({ ...form, apyPercent: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily yield = Principal &times; APY / 365</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Lock Term Days
                  </label>
                  <select
                    disabled={!!editingProduct}
                    value={form.lockPeriodDays}
                    onChange={(e) => {
                      const days = e.target.value;
                      setForm({
                        ...form,
                        lockPeriodDays: days,
                        isFlexible: days === '0',
                      });
                    }}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="0">0 Days &mdash; Simple Earn (Flexible)</option>
                    <option value="15">15 Days &mdash; Fixed Staking</option>
                    <option value="30">30 Days &mdash; Fixed Staking</option>
                    <option value="60">60 Days &mdash; Fixed Staking</option>
                    <option value="90">90 Days &mdash; Fixed Staking</option>
                    <option value="120">120 Days &mdash; Fixed Staking</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Minimum Amount</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    required
                    value={form.minAmount}
                    onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Pool Total Capacity</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.totalCapacity}
                    onChange={(e) => setForm({ ...form, totalCapacity: e.target.value })}
                    placeholder="0 for unlimited"
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Max Personal Limit (per user)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.maxPersonalLimit}
                  onChange={(e) => setForm({ ...form, maxPersonalLimit: e.target.value })}
                  placeholder="0 for unlimited"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isActiveToggle" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
                  Active & Available for User Subscriptions
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', background: 'var(--primary-solid)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingProduct ? 'Save APY & Terms' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
