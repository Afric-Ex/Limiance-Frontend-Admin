import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import { Layers, Plus, RefreshCw, Trash2, Zap, Search } from 'lucide-react';

export default function PairsPage() {
  const confirm = useConfirm();
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genSymbol, setGenSymbol] = useState('');
  const [toast, setToast] = useState(null);

  const [pairForm, setPairForm] = useState({
    symbol: '',
    base_asset: '',
    quote_asset: '',
    price_decimals: 2,
    quantity_decimals: 6,
    min_order_qty: '0.0001',
    is_active: true,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPairs = async () => {
    setLoading(true);
    try {
      const res = await api('/api/pairs');
      setPairs(Array.isArray(res) ? res : res.pairs || res.data || []);
    } catch (err) {
      console.error('Failed to load pairs', err);
      showToast(err.message || 'Failed to load trading pairs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPairs();
  }, []);

  const handleCreatePair = async (e) => {
    e.preventDefault();
    try {
      const symbol = pairForm.symbol || `${pairForm.base_asset.toUpperCase()}/${pairForm.quote_asset.toUpperCase()}`;
      await api('/api/pairs', {
        method: 'POST',
        body: JSON.stringify({
          symbol,
          base_asset: pairForm.base_asset.toUpperCase(),
          quote_asset: pairForm.quote_asset.toUpperCase(),
          price_decimals: parseInt(pairForm.price_decimals, 10),
          quantity_decimals: parseInt(pairForm.quantity_decimals, 10),
          min_order_qty: pairForm.min_order_qty,
          is_active: pairForm.is_active,
        }),
      });
      showToast(`Trading pair ${symbol} created.`);
      setModalOpen(false);
      fetchPairs();
    } catch (err) {
      showToast(err.message || 'Failed to create pair', 'error');
    }
  };

  const handleGenerateAll = async () => {
    const ok = await confirm({
      title: 'Auto-Generate Trading Pairs',
      message: 'Automatically generate and register trading pairs across all active tokens and quote currencies? Existing pairs will be preserved.',
      confirmText: 'Generate Pairs',
      variant: 'primary',
    });
    if (!ok) return;
    setGenerating(true);
    try {
      await api('/api/pairs/generate', { method: 'POST' });
      showToast('Trading pairs generated successfully!');
      fetchPairs();
    } catch (err) {
      showToast(err.message || 'Failed to auto-generate pairs', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSymbol = async (e) => {
    e.preventDefault();
    if (!genSymbol.trim()) return;
    setGenerating(true);
    try {
      await api(`/api/pairs/generate/${genSymbol.trim().toUpperCase()}`, { method: 'POST' });
      showToast(`Pairs for ${genSymbol.toUpperCase()} generated!`);
      setGenModalOpen(false);
      fetchPairs();
    } catch (err) {
      showToast(err.message || 'Failed to generate pairs for token', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const filtered = pairs.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (p.symbol && p.symbol.toLowerCase().includes(q)) ||
           (p.base_asset && p.base_asset.toLowerCase().includes(q)) ||
           (p.quote_asset && p.quote_asset.toLowerCase().includes(q));
  });

  return (
    <div className="pairs-page" style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>Spot & Derivatives Trading Pairs</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            Configure active order book pairs, price precision, minimum ticket sizes, and automated pair generation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setGenModalOpen(true)}
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
            <Zap size={14} /> Auto-Generate
          </button>
          <button
            onClick={() => setModalOpen(true)}
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
            <Plus size={14} /> Add Trading Pair
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            placeholder="Search pairs (e.g. BTC/USDT)..."
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
          onClick={fetchPairs}
          style={{ padding: '8px 14px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Pairs Table */}
      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Trading Pair</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Base / Quote</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Price Precision</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Min Order Qty</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  Loading trading pairs...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  No trading pairs configured yet. Click "Auto-Generate" or "Add Trading Pair".
                </td>
              </tr>
            ) : (
              filtered.map((p, idx) => (
                <tr key={p.symbol || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>
                    {p.symbol}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13px' }}>
                    <span style={{ color: '#818cf8', fontWeight: 600 }}>{p.base_asset || p.symbol?.split('/')[0]}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>/</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>{p.quote_asset || p.symbol?.split('/')[1]}</span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>
                    {p.price_decimals ?? p.price_precision ?? 2} decimals
                  </td>
                  <td style={{ padding: '14px 18px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace' }}>
                    {p.min_order_qty || p.min_order_size || '0.0001'}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: p.is_active !== false ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: p.is_active !== false ? '#34d399' : '#f87171' }}>
                      {p.is_active !== false ? 'ONLINE' : 'HALTED'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Pair */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#fff' }}>Add Trading Pair</h2>
            <form onSubmit={handleCreatePair} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Base Asset (e.g. BTC)</label>
                  <input
                    type="text"
                    required
                    value={pairForm.base_asset}
                    onChange={(e) => setPairForm({ ...pairForm, base_asset: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Quote Asset (e.g. USDT)</label>
                  <input
                    type="text"
                    required
                    value={pairForm.quote_asset}
                    onChange={(e) => setPairForm({ ...pairForm, quote_asset: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Price Decimals</label>
                  <input
                    type="number"
                    value={pairForm.price_decimals}
                    onChange={(e) => setPairForm({ ...pairForm, price_decimals: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Min Order Qty</label>
                  <input
                    type="text"
                    value={pairForm.min_order_qty}
                    onChange={(e) => setPairForm({ ...pairForm, min_order_qty: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '8px 16px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  Create Pair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Auto-Generate Pairs */}
      {genModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.25rem', color: '#fff' }}>Auto-Generate Trading Pairs</h2>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Generate spot markets against supported quote currencies (USDT, USDC, BTC, USD).
            </p>

            <form onSubmit={handleGenerateSymbol} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Target Token Symbol (e.g. ETH, SOL)</label>
                <input
                  type="text"
                  placeholder="Leave empty or enter symbol..."
                  value={genSymbol}
                  onChange={(e) => setGenSymbol(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={generating || !genSymbol.trim()}
                  style={{ padding: '10px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  Generate Pairs for {genSymbol ? genSymbol.toUpperCase() : 'Token'}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAll}
                  disabled={generating}
                  style={{ padding: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', color: '#818cf8', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  {generating ? 'Generating...' : 'Batch Generate All Markets'}
                </button>
                <button
                  type="button"
                  onClick={() => setGenModalOpen(false)}
                  style={{ padding: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
