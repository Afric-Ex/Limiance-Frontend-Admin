import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import {
  Coins,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Search,
  CheckCircle,
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';

export default function TokensPage() {
  const confirm = useConfirm();
  const [tokens, setTokens] = useState([]);
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChainFilter, setSelectedChainFilter] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [toast, setToast] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Form State
  const initialForm = {
    symbol: '',
    name: '',
    blockchain: '',
    contract_address: '',
    decimals: 18,
    min_deposit: '0',
    min_withdrawal: '0',
    is_active: true,
    is_tradable: true,
    is_stablecoin: false,
    is_fiat_pairable: false,
    image: '',
    website: '',
    whitepaper_url: '',
    explorer_url: '',
    description: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const copyToClipboard = (text) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await api('/api/tokens');
      setTokens(Array.isArray(res) ? res : res.tokens || res.data || []);
    } catch (err) {
      console.error('Failed to load tokens', err);
      showToast(err.message || 'Failed to load tokens', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworks = async () => {
    try {
      const res = await api('/api/networks');
      const list = Array.isArray(res) ? res : res.networks || res.data || [];
      setAvailableNetworks(list);
    } catch (err) {
      console.error('Failed to load networks', err);
    }
  };

  useEffect(() => {
    fetchTokens();
    fetchNetworks();
  }, []);

  // Force clean redis flush & re-populate canonical token configs
  const handleSyncContracts = async () => {
    setSyncing(true);
    try {
      const res = await api('/api/tokens/contracts/sync', { method: 'POST' });
      showToast(`Watcher sync complete: ${res.total_synced ?? res.count ?? 0} active token contracts published to Redis.`);
    } catch (err) {
      showToast(err.message || 'Failed to sync contracts to Redis', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteToken = async (token) => {
    const symbol = token.symbol;
    const blockchain = token.blockchain || (token.chains && token.chains[0]) || '';
    const ok = await confirm({
      title: 'Delist Token',
      message: `Are you sure you want to delist ${symbol} on ${blockchain || 'all chains'}? This removes it from the database and purges its Redis watcher keys.`,
      confirmText: 'Delist Token',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const query = blockchain ? `?blockchain=${encodeURIComponent(blockchain)}` : '';
      await api(`/api/tokens/${symbol}${query}`, { method: 'DELETE' });
      showToast(`Token ${symbol} (${blockchain}) deleted.`);
      fetchTokens();
    } catch (err) {
      showToast(err.message || 'Failed to delete token', 'error');
    }
  };

  const openAddModal = () => {
    setEditingToken(null);
    setFormData({
      ...initialForm,
      blockchain: availableNetworks[0]?.name || availableNetworks[0]?.blockchain || 'Ethereum',
    });
    setModalOpen(true);
  };

  const openEditModal = (tok) => {
    setEditingToken(tok);
    setFormData({
      symbol: tok.symbol || '',
      name: tok.name || '',
      blockchain: tok.blockchain || (tok.chains && tok.chains[0]) || '',
      contract_address: tok.contract_address || '',
      decimals: tok.decimals ?? 18,
      min_deposit: tok.min_deposit || '0',
      min_withdrawal: tok.min_withdrawal || '0',
      is_active: tok.is_active !== false,
      is_tradable: tok.is_tradable !== false,
      is_stablecoin: !!tok.is_stablecoin,
      is_fiat_pairable: !!tok.is_fiat_pairable,
      image: tok.image || tok.logo_url || '',
      website: tok.website || '',
      whitepaper_url: tok.whitepaper_url || '',
      explorer_url: tok.explorer_url || '',
      description: tok.description || '',
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingToken) {
        const blockchainParam = encodeURIComponent(editingToken.blockchain || formData.blockchain);
        await api(`/api/tokens/${editingToken.symbol}?blockchain=${blockchainParam}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: formData.name,
            contract_address: formData.contract_address,
            decimals: parseInt(formData.decimals, 10),
            min_deposit: formData.min_deposit,
            min_withdrawal: formData.min_withdrawal,
            is_active: formData.is_active,
            is_tradable: formData.is_tradable,
            is_stablecoin: formData.is_stablecoin,
            is_fiat_pairable: formData.is_fiat_pairable,
            image: formData.image,
            website: formData.website,
            whitepaper_url: formData.whitepaper_url,
            explorer_url: formData.explorer_url,
            description: formData.description,
          }),
        });
        showToast(`Token ${editingToken.symbol} updated and synced to Redis.`);
      } else {
        await api('/api/tokens', {
          method: 'POST',
          body: JSON.stringify({
            symbol: formData.symbol.toUpperCase().trim(),
            name: formData.name.trim(),
            blockchain: formData.blockchain.trim(),
            contract_address: formData.contract_address.trim() || 'N/A',
            decimals: parseInt(formData.decimals, 10),
            min_deposit: formData.min_deposit,
            min_withdrawal: formData.min_withdrawal,
            is_active: formData.is_active,
            is_tradable: formData.is_tradable,
            is_stablecoin: formData.is_stablecoin,
            is_fiat_pairable: formData.is_fiat_pairable,
            image: formData.image,
            website: formData.website,
            whitepaper_url: formData.whitepaper_url,
            explorer_url: formData.explorer_url,
            description: formData.description,
          }),
        });
        showToast(`Token ${formData.symbol.toUpperCase()} listed & published to watcher cache.`);
      }
      setModalOpen(false);
      fetchTokens();
    } catch (err) {
      showToast(err.message || 'Failed to save token', 'error');
    }
  };

  const filtered = tokens.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesChain = !selectedChainFilter ||
      (t.blockchain && t.blockchain.toLowerCase() === selectedChainFilter.toLowerCase()) ||
      (t.chains && t.chains.some(c => c.toLowerCase() === selectedChainFilter.toLowerCase()));

    const matchesSearch =
      (t.symbol && t.symbol.toLowerCase().includes(q)) ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.contract_address && t.contract_address.toLowerCase().includes(q));

    return matchesChain && matchesSearch;
  });

  return (
    <div className="tokens-page" style={{ maxWidth: '1440px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 22px',
            borderRadius: '10px',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            boxShadow: '0 12px 35px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} /> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Listed Tokens & Smart Contracts
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>
            Directly configure token parameters, deposit watcher addresses (<code className="mono">token:&lt;chainId&gt;:&lt;address&gt;</code>), and withdrawal limits.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSyncContracts}
            disabled={syncing}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: syncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Database size={15} /> {syncing ? 'Purging & Syncing...' : 'Resync Redis Watcher Cache'}
          </button>
          <button
            onClick={openAddModal}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: '#4d77f0',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(77, 119, 240, 0.35)',
            }}
          >
            <Plus size={15} /> List New Token
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Chain Filter */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '650px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="text"
              placeholder="Search by ticker, token name, or contract address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={selectedChainFilter}
            onChange={(e) => setSelectedChainFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px',
            }}
          >
            <option value="">All Blockchains</option>
            {availableNetworks.map((net, nIdx) => (
              <option key={nIdx} value={net.name || net.blockchain || net.symbol}>
                {net.name || net.blockchain || net.symbol}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchTokens}
          style={{
            padding: '9px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh List
        </button>
      </div>

      {/* Tokens Table */}
      <div className="glass-card" style={{ overflowX: 'auto', boxShadow: '0 4px 25px rgba(0,0,0,0.3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Asset</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Network</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contract Address</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Decimals</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Limits (Dep / Wd)</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Type</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '13px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading tokens...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tokens matching the current search or chain filter.
                </td>
              </tr>
            ) : (
              filtered.map((t, idx) => {
                const chainName = t.blockchain || (t.chains && t.chains[0]) || '—';
                const hasContract = t.contract_address && t.contract_address !== 'N/A' && t.contract_address !== '';
                return (
                  <tr key={`${t.symbol}-${chainName}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {t.image ? (
                          <img
                            src={t.image}
                            alt={t.symbol}
                            style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'contain' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(77,119,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 700, fontSize: '10px' }}>
                            {t.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '13px', letterSpacing: '0.01em' }}>
                            {t.symbol}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {t.name || t.symbol}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          color: '#a5b4fc',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {chainName}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {hasContract ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className="mono"
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#cbd5e1',
                            }}
                            title={t.contract_address}
                          >
                            {t.contract_address.length > 16
                              ? `${t.contract_address.slice(0, 8)}...${t.contract_address.slice(-6)}`
                              : t.contract_address}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(t.contract_address)}
                            style={{ background: 'none', border: 'none', color: copiedAddress === t.contract_address ? '#34d399' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px' }}
                            title="Copy Contract Address"
                          >
                            {copiedAddress === t.contract_address ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Native / Non-contract</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      {t.decimals ?? 18}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>Min Dep: <strong style={{ color: '#fff' }}>{t.min_deposit || '0'}</strong></span>
                        <span>Min Wd: <strong style={{ color: '#fff' }}>{t.min_withdrawal || '0'}</strong></span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {t.is_stablecoin && (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                            STABLE
                          </span>
                        )}
                        {t.is_tradable ? (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                            TRADE
                          </span>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                            OFF
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ padding: '3px 9px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: t.is_active !== false ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: t.is_active !== false ? '#34d399' : '#f87171' }}>
                        {t.is_active !== false ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(t)}
                          style={{ padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#818cf8', cursor: 'pointer' }}
                          title="Edit Token Details"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteToken(t)}
                          style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#f87171', cursor: 'pointer' }}
                          title="Delist Token"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add/Edit Token */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 28px',
              boxShadow: '0 24px 70px rgba(0,0,0,0.9)',
            }}
          >
            <h2 style={{ margin: '0 0 18px', fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>
              {editingToken ? `Edit Token ${editingToken.symbol}` : 'List New Token'}
            </h2>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Token Symbol (Ticker)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingToken}
                    placeholder="e.g. USDT, BTC"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Token Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tether USD"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Blockchain Network
                  </label>
                  <select
                    disabled={!!editingToken}
                    value={formData.blockchain}
                    onChange={(e) => setFormData({ ...formData, blockchain: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  >
                    {availableNetworks.map((net, nIdx) => {
                      const val = net.name || net.blockchain || net.symbol;
                      return (
                        <option key={nIdx} value={val}>
                          {val}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Decimals
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="18"
                    value={formData.decimals}
                    onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Smart Contract Address (leave N/A for native coins)
                </label>
                <input
                  type="text"
                  placeholder="0x... or mint address or N/A"
                  value={formData.contract_address}
                  onChange={(e) => setFormData({ ...formData, contract_address: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Minimum Deposit Limit
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formData.min_deposit}
                    onChange={(e) => setFormData({ ...formData, min_deposit: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Minimum Withdrawal Limit
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formData.min_withdrawal}
                    onChange={(e) => setFormData({ ...formData, min_withdrawal: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                  Logo Icon URL
                </label>
                <input
                  type="url"
                  placeholder="https://coin-images.coingecko.com/..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active / Enabled
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_tradable}
                    onChange={(e) => setFormData({ ...formData, is_tradable: e.target.checked })}
                  />
                  Tradable on Exchange
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_stablecoin}
                    onChange={(e) => setFormData({ ...formData, is_stablecoin: e.target.checked })}
                  />
                  Is Stablecoin (USD Pegged)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_fiat_pairable}
                    onChange={(e) => setFormData({ ...formData, is_fiat_pairable: e.target.checked })}
                  />
                  Fiat Pairable (NGN, etc.)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '9px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingToken ? 'Save Changes' : 'List Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

