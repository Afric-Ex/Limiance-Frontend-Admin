import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useConfirm } from '../context/ConfirmContext';
import { getBlockchainNetwork } from '../utils/chain';
import { Wallet, Search, RefreshCw, Copy, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';

export default function WalletsPage() {
  const confirm = useConfirm();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWallets = async (page = 1) => {
    setLoading(true);
    try {
      const q = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : '';
      const res = await api(`/api/wallets?page=${page}&limit=20${q}`);
      setWallets(res.wallets || res.data || []);
      setTotalPages(res.total_pages || res.totalPages || 1);
      setTotalRecords(res.total_records || res.totalRecords || 0);
      setCurrentPage(res.current_page || res.currentPage || page);
    } catch (err) {
      console.error('Failed to load wallets', err);
      showToast(err.message || 'Failed to load custodial wallets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets(currentPage);
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchWallets(1);
  };

  const handleWalletAction = async (walletId, action, label) => {
    let payload = null;
    if (action === 'suspend') {
      const reason = await confirm({
        title: 'Suspend Custodial Wallet',
        message: 'Please provide an administrative or compliance reason for placing this wallet on hold:',
        confirmText: 'Suspend Wallet',
        variant: 'warning',
        prompt: true,
        promptPlaceholder: 'e.g. Admin compliance hold, AML surveillance flag',
        promptDefault: 'Admin compliance hold',
        promptRequired: true,
      });
      if (!reason) return;
      payload = { reason };
    } else {
      const ok = await confirm({
        title: `${label.charAt(0).toUpperCase() + label.slice(1)} Wallet`,
        message: `Are you sure you want to ${label} this custodial wallet?`,
        confirmText: `${label.charAt(0).toUpperCase() + label.slice(1)} Wallet`,
        variant: action === 'activate' ? 'success' : 'warning',
      });
      if (!ok) return;
    }
    try {
      const opts = { method: 'POST' };
      if (payload) {
        opts.body = JSON.stringify(payload);
      }
      await api(`/api/wallets/${walletId}/${action}`, opts);
      showToast(`Wallet ${label}d successfully.`);
      fetchWallets(currentPage);
    } catch (err) {
      showToast(err.message || `Failed to ${label} wallet`, 'error');
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    showToast('Copied to clipboard');
  };

  return (
    <div className="wallets-page" style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>Platform Custodial Wallets</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            Inspect on-chain custodial addresses across networks, monitoring addresses, and apply administrative locks.
          </p>
        </div>
        <div style={{ color: '#818cf8', fontSize: '13px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '6px 14px', borderRadius: '9999px', fontWeight: 600 }}>
          {totalRecords.toLocaleString()} Total Wallets
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Search by user ID, chain, or on-chain address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
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
            type="submit"
            style={{
              padding: '0 16px',
              borderRadius: '8px',
              background: '#4d77f0',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>

        <button
          onClick={() => fetchWallets(currentPage)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: '#181a22',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Wallets Table */}
      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Blockchain Network</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Custodial Address</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Assigned User ID</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Status</th>
              <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  Loading custodial wallets...
                </td>
              </tr>
            ) : wallets.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  No custodial wallets found
                </td>
              </tr>
            ) : (
              wallets.map((w) => {
                const isWalletActive = (w.status || '').toUpperCase() === 'ACTIVE' || w.is_active === true;
                const net = getBlockchainNetwork(w, w.address);

                return (
                  <tr key={w.id || Math.random()} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', background: net.bg, color: net.color, fontWeight: 700, fontSize: '11px', letterSpacing: '0.04em' }}>
                          {net.symbol}
                        </span>
                        <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{net.name}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#e2e8f0' }}>
                          {w.address || 'Pending HD Derivation'}
                        </span>
                        {w.address && (
                          <button onClick={() => copyToClipboard(w.address)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                      {w.tag && (
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                          Tag: {w.tag}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#94a3b8' }}>
                        {w.user_id}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: isWalletActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isWalletActive ? '#34d399' : '#f87171' }}>
                        {w.status || (isWalletActive ? 'ACTIVE' : 'SUSPENDED')}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {isWalletActive ? (
                          <button
                            onClick={() => handleWalletAction(w.id, 'suspend', 'suspend')}
                            style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleWalletAction(w.id, 'reactivate', 'reactivate')}
                            style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleWalletAction(w.id, 'deactivate', 'deactivate')}
                          style={{ padding: '4px 10px', borderRadius: '4px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181a22' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Page {currentPage} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#1c1e28',
                border: '1px solid rgba(255,255,255,0.1)',
                color: currentPage <= 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#1c1e28',
                border: '1px solid rgba(255,255,255,0.1)',
                color: currentPage >= totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
