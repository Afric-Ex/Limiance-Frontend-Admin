import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import { Plus, RefreshCw, Trash2, Search, Pencil } from 'lucide-react';
import { ShimmerTableRows } from '../components/Shimmer';

export default function PairsPage() {
  const confirm = useConfirm();
  const [pairs, setPairs] = useState([]);
  const [futuresPairs, setFuturesPairs] = useState([]);
  const [marketType, setMarketType] = useState('spot');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState(null);
  const [toast, setToast] = useState(null);

  const [pairForm, setPairForm] = useState({
    symbol: '',
    base_asset: '',
    quote_asset: '',
    price_decimals: 2,
    quantity_decimals: 6,
    min_order_qty: '0.0001',
    mark_price: '0',
    index_price: '0',
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
      const rows = Array.isArray(res) ? res : res.pairs || res.data || [];
      setPairs(rows.map((pair) => {
        const base = pair.base || pair.base_asset || '';
        const quote = pair.quote || pair.quote_asset || '';
        return {
          ...pair,
          base_asset: base,
          quote_asset: quote,
          symbol: pair.symbol || `${base}/${quote}`,
        };
      }));
    } catch (err) {
      console.error('Failed to load pairs', err);
      showToast(err.message || 'Failed to load trading pairs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFuturesPairs = async () => {
    try {
      const res = await api('/api/futures-configs');
      setFuturesPairs(res.futures_configs || res.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load futures pairs', 'error');
    }
  };

  useEffect(() => {
    fetchPairs();
    fetchFuturesPairs();
  }, []);

  const handleCreatePair = async (e) => {
    e.preventDefault();
    try {
      const symbol = pairForm.symbol || `${pairForm.base_asset.toUpperCase()}/${pairForm.quote_asset.toUpperCase()}`;
      await api('/api/pairs', {
        method: 'POST',
        body: JSON.stringify({
          base: pairForm.base_asset.toUpperCase(),
          quote: pairForm.quote_asset.toUpperCase(),
        }),
      });
      showToast(`Trading pair ${symbol} created.`);
      setModalOpen(false);
      fetchPairs();
    } catch (err) {
      showToast(err.message || 'Failed to create pair', 'error');
    }
  };

  const handleEditPair = (pair) => {
    setEditingPair(pair);
    setPairForm({
      ...pairForm,
      base_asset: pair.base_asset,
      quote_asset: pair.quote_asset,
      mark_price: String(pair.mark_price ?? '0'),
      index_price: String(pair.index_price ?? '0'),
    });
    setModalOpen(true);
  };

  const handleUpdatePairPrices = async (e) => {
    e.preventDefault();
    try {
      await api('/api/pairs', {
        method: 'PATCH',
        body: JSON.stringify({
          base: editingPair.base_asset,
          quote: editingPair.quote_asset,
          mark_price: pairForm.mark_price,
          index_price: pairForm.index_price,
        }),
      });
      showToast(`${editingPair.symbol} mark and index prices updated.`);
      setModalOpen(false);
      setEditingPair(null);
      fetchPairs();
    } catch (err) {
      showToast(err.message || 'Failed to update pair prices', 'error');
    }
  };

  const handleDeletePair = async (pair) => {
    const ok = await confirm({
      title: 'Delete Trading Pair',
      message: `Delete ${pair.symbol}? This removes the pair from spot and margin markets.`,
      confirmText: 'Delete Pair',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/pairs?base=${encodeURIComponent(pair.base_asset)}&quote=${encodeURIComponent(pair.quote_asset)}`, { method: 'DELETE' });
      showToast(`${pair.symbol} deleted.`);
      fetchPairs();
    } catch (err) {
      showToast(err.message || 'Failed to delete pair', 'error');
    }
  };

  const visiblePairs = marketType === 'futures'
    ? futuresPairs.map((p) => ({
      ...p,
      base_asset: p.symbol?.split('/')[0] || p.symbol,
      quote_asset: p.symbol?.split('/')[1] || 'PERP',
    }))
    : pairs;
  const filtered = visiblePairs.filter((p) => {
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>Trading Pairs</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            Manage shared spot and margin pairs, plus configured futures markets.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { setEditingPair(null); setModalOpen(true); }}
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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['spot', 'margin', 'futures'].map((type) => (
          <button key={type} onClick={() => setMarketType(type)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: marketType === type ? '#4d77f0' : '#1c1e28', color: '#fff', textTransform: 'capitalize', cursor: 'pointer' }}>
            {type}
          </button>
        ))}
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
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Mark Price</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Index Price</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Price Precision</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Min Order Qty</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Status</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={6} cols={8} colWidths={['25%', '25%', '20%', '20%', '15%', '15%', '20%', '15%']} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  No trading pairs configured yet. Click "Add Trading Pair".
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
                  <td style={{ padding: '14px 18px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace' }}>{marketType === 'futures' ? '—' : (p.mark_price ?? '0')}</td>
                  <td style={{ padding: '14px 18px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace' }}>{marketType === 'futures' ? '—' : (p.index_price ?? '0')}</td>
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
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    {marketType !== 'futures' && (
                      <>
                        <button type="button" title="Edit mark and index prices" onClick={() => handleEditPair(p)} style={{ background: 'transparent', border: 'none', color: '#93c5fd', cursor: 'pointer', marginRight: '8px' }}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" title="Delete pair" onClick={() => handleDeletePair(p)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add or edit pair */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: editingPair ? '600px' : '480px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#fff' }}>{editingPair ? `Edit ${editingPair.symbol} Prices` : 'Add Trading Pair'}</h2>
            <form onSubmit={editingPair ? handleUpdatePairPrices : handleCreatePair} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Base Asset (e.g. BTC)</label>
                  <input
                    type="text"
                    required
                    value={pairForm.base_asset}
                    disabled={Boolean(editingPair)}
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
                    disabled={Boolean(editingPair)}
                    onChange={(e) => setPairForm({ ...pairForm, quote_asset: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
                  />
                </div>
              </div>

              {editingPair ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Mark Price</label>
                    <input type="number" min="0" step="any" required value={pairForm.mark_price} onChange={(e) => setPairForm({ ...pairForm, mark_price: e.target.value })} style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Index Price</label>
                    <input type="number" min="0" step="any" required value={pairForm.index_price} onChange={(e) => setPairForm({ ...pairForm, index_price: e.target.value })} style={{ width: '100%', padding: '9px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
                  </div>
                </div>
              ) : (
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
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => { setModalOpen(false); setEditingPair(null); }} style={{ padding: '8px 16px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  {editingPair ? 'Save Prices' : 'Create Pair'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
