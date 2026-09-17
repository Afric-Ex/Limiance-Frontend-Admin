import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import { Coins, Plus, RefreshCw, Trash2, Edit, Search, CheckCircle, Database } from 'lucide-react';

export default function TokensPage() {
  const confirm = useConfirm();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [toast, setToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    decimals: 18,
    is_active: true,
    logo_url: '',
    networks: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
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

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleSyncContracts = async () => {
    setSyncing(true);
    try {
      await api('/api/tokens/contracts/sync', { method: 'POST' });
      showToast('Token contracts synced to Redis watcher cache!');
    } catch (err) {
      showToast(err.message || 'Failed to sync contracts', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteToken = async (symbol) => {
    const ok = await confirm({
      title: 'Delist Token',
      message: `Are you sure you want to delist token ${symbol}? This removes it from active trading and deposit processing.`,
      confirmText: 'Delist Token',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/tokens/${symbol}`, { method: 'DELETE' });
      showToast(`Token ${symbol} delisted.`);
      fetchTokens();
    } catch (err) {
      showToast(err.message || 'Failed to delete token', 'error');
    }
  };

  const openAddModal = () => {
    setEditingToken(null);
    setFormData({
      symbol: '',
      name: '',
      decimals: 18,
      is_active: true,
      logo_url: '',
      networks: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (tok) => {
    setEditingToken(tok);
    const chainsList = Array.isArray(tok.chains) && tok.chains.length > 0
      ? tok.chains
      : Array.isArray(tok.networks)
        ? tok.networks
        : tok.blockchain
          ? [tok.blockchain]
          : [];
    setFormData({
      symbol: tok.symbol || '',
      name: tok.name || '',
      decimals: tok.decimals || 18,
      is_active: tok.is_active !== false,
      logo_url: tok.logo_url || tok.icon || '',
      networks: chainsList.join(', '),
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingToken) {
        await api(`/api/tokens/${editingToken.symbol}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: formData.name,
            decimals: parseInt(formData.decimals, 10),
            is_active: formData.is_active,
            logo_url: formData.logo_url,
          }),
        });
        showToast(`Token ${editingToken.symbol} updated.`);
      } else {
        await api('/api/tokens', {
          method: 'POST',
          body: JSON.stringify({
            symbol: formData.symbol.toUpperCase(),
            name: formData.name,
            decimals: parseInt(formData.decimals, 10),
            is_active: formData.is_active,
            logo_url: formData.logo_url,
          }),
        });
        showToast(`Token ${formData.symbol.toUpperCase()} listed.`);
      }
      setModalOpen(false);
      fetchTokens();
    } catch (err) {
      showToast(err.message || 'Failed to save token', 'error');
    }
  };

  // Deduplicate and aggregate chains if API returns raw rows or already grouped rows
  const groupedTokens = React.useMemo(() => {
    const map = new Map();
    for (const t of tokens) {
      const sym = (t.symbol || '').toUpperCase().trim();
      if (!sym) continue;
      if (!map.has(sym)) {
        const initialChains = Array.isArray(t.chains) && t.chains.length > 0
          ? [...t.chains]
          : t.blockchain
            ? [t.blockchain]
            : [];
        map.set(sym, {
          ...t,
          chains: initialChains,
        });
      } else {
        const existing = map.get(sym);
        // Merge chains
        const newChains = Array.isArray(t.chains) ? t.chains : (t.blockchain ? [t.blockchain] : []);
        for (const c of newChains) {
          if (c && !existing.chains.includes(c)) {
            existing.chains.push(c);
          }
        }
      }
    }
    return Array.from(map.values());
  }, [tokens]);

  const filtered = groupedTokens.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesChain = t.chains && t.chains.some(c => c.toLowerCase().includes(q));
    return (t.symbol && t.symbol.toLowerCase().includes(q)) ||
           (t.name && t.name.toLowerCase().includes(q)) ||
           matchesChain;
  });

  return (
    <div className="tokens-page" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(10px)',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>Listed Tokens & Smart Contracts</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            Manage supported cryptocurrencies, contract addresses, decimals, and synchronize on-chain deposit watcher nodes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSyncContracts}
            disabled={syncing}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Database size={14} /> {syncing ? 'Syncing...' : 'Sync Contracts to Redis'}
          </button>
          <button
            onClick={openAddModal}
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
            <Plus size={14} /> List New Token
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            placeholder="Search tokens by symbol, name, or chain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              background: '#181a22',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={fetchTokens}
          style={{ padding: '8px 14px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tokens Table */}
      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Symbol</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Token Name</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Chains</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Decimals</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Status</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  Loading listed tokens...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  No tokens listed matching search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((t, idx) => (
                <tr key={t.symbol || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {t.logo_url && (
                        <img src={t.logo_url} alt={t.symbol} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                      )}
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>
                        {t.symbol}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#e2e8f0', fontSize: '14px' }}>
                    {t.name || t.symbol}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      {t.chains && t.chains.length > 0 ? (
                        t.chains.map((chain, cIdx) => (
                          <span
                            key={cIdx}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              color: '#a5b4fc',
                              fontSize: '11px',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {chain}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>
                    {t.decimals || 18}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: t.is_active !== false ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: t.is_active !== false ? '#34d399' : '#f87171' }}>
                      {t.is_active !== false ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(t)}
                        style={{ padding: '5px 10px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#818cf8', cursor: 'pointer', fontSize: '12px' }}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteToken(t.symbol)}
                        style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}
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

      {/* Modal: Add/Edit Token */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#fff' }}>
              {editingToken ? `Edit Token ${editingToken.symbol}` : 'List New Token'}
            </h2>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Token Symbol (e.g. BTC, ETH)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingToken}
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Token Full Name (e.g. Bitcoin)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Decimals (e.g. 18 for ERC-20, 8 for BTC, 6 for USDT)</label>
                <input
                  type="number"
                  required
                  value={formData.decimals}
                  onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Logo Icon URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Chains / Networks (comma separated, e.g. Ethereum, BSC, Polygon)</label>
                <input
                  type="text"
                  placeholder="Ethereum, Polygon, Arbitrum..."
                  value={formData.networks}
                  onChange={(e) => setFormData({ ...formData, networks: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="activeCheck" style={{ fontSize: '13px', color: '#fff' }}>Enable Token for Trading & Deposits</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '8px 16px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
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
