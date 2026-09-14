import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import './AuditPage.css';

// ---------------------------------------------------------------------------
// Mock data — removed once the backend endpoint is live
// ---------------------------------------------------------------------------
const MOCK_EVENTS = [
  {
    id: 'evt_a1b2c3d4e5f6',
    timestamp: '2026-09-01T16:42:18Z',
    actor_id: 'adm_cc7f0b1',
    actor_email: 'compliance@celvios.site',
    action: 'withdrawal.approved',
    resource_type: 'withdrawal',
    resource_id: 'wdl_b3c7f2a9e1d4',
    outcome: 'success',
    ip_address: '10.0.0.5',
    note: 'Dual-control approval. Travel rule complete. Amount within policy.',
    payload: { withdrawal_id: 'wdl_b3c7f2a9e1d4', amount: '1.25', asset: 'BTC', approved_by: 'adm_cc7f0b1' },
  },
  {
    id: 'evt_b2c3d4e5f6a7',
    timestamp: '2026-09-01T15:33:01Z',
    actor_id: 'adm_cc7f0b1',
    actor_email: 'compliance@celvios.site',
    action: 'kyc.rejected',
    resource_type: 'kyc_application',
    resource_id: 'usr_8c3f01a',
    outcome: 'success',
    ip_address: '10.0.0.5',
    note: 'Document blurry. Selfie mismatch.',
    payload: { user_id: 'usr_8c3f01a', reason: 'ID document is blurry, Selfie does not match ID' },
  },
  {
    id: 'evt_c3d4e5f6a7b8',
    timestamp: '2026-09-01T14:10:55Z',
    actor_id: 'adm_9d2a5f3',
    actor_email: 'ops@celvios.site',
    action: 'operational_controls.withdrawals.disabled',
    resource_type: 'operational_control',
    resource_id: 'withdrawals',
    outcome: 'success',
    ip_address: '10.0.0.9',
    note: 'Maintenance window — disabling withdrawals for 30 minutes.',
    payload: { control: 'withdrawals', enabled: false, reason: 'Maintenance window' },
  },
  {
    id: 'evt_d4e5f6a7b8c9',
    timestamp: '2026-09-01T13:48:22Z',
    actor_id: 'adm_cc7f0b1',
    actor_email: 'compliance@celvios.site',
    action: 'roles.granted',
    resource_type: 'user_role',
    resource_id: 'usr_f0b22de',
    outcome: 'success',
    ip_address: '10.0.0.5',
    note: 'Granting compliance_officer role as per HR ticket #4891.',
    payload: { user_id: 'usr_f0b22de', role: 'compliance_officer', granted_by: 'adm_cc7f0b1' },
  },
  {
    id: 'evt_e5f6a7b8c9d0',
    timestamp: '2026-09-01T11:02:44Z',
    actor_id: 'adm_9d2a5f3',
    actor_email: 'ops@celvios.site',
    action: 'deposit.released',
    resource_type: 'deposit',
    resource_id: 'dep_7f3a9c2e1b4d',
    outcome: 'success',
    ip_address: '10.0.0.9',
    note: 'Reviewed chain analysis. No issues found. Released to user.',
    payload: { deposit_id: 'dep_7f3a9c2e1b4d', released_by: 'adm_9d2a5f3' },
  },
  {
    id: 'evt_f6a7b8c9d0e1',
    timestamp: '2026-09-01T09:15:10Z',
    actor_id: 'adm_cc7f0b1',
    actor_email: 'compliance@celvios.site',
    action: 'kyc.approved',
    resource_type: 'kyc_application',
    resource_id: 'usr_3891abc',
    outcome: 'success',
    ip_address: '10.0.0.5',
    note: 'All documents clear. Nationality verified.',
    payload: { user_id: 'usr_3891abc', tier: 2, approved_by: 'adm_cc7f0b1' },
  },
  {
    id: 'evt_g7h8i9j0k1l2',
    timestamp: '2026-08-31T22:11:03Z',
    actor_id: 'system',
    actor_email: 'system',
    action: 'deposit.flagged',
    resource_type: 'deposit',
    resource_id: 'dep_a1b2c3d4e5f6',
    outcome: 'success',
    ip_address: '—',
    note: 'Auto-flagged by risk engine. Score: 61.',
    payload: { deposit_id: 'dep_a1b2c3d4e5f6', risk_score: 61, flags: ['Sanctioned address in tx chain'] },
  },
  {
    id: 'evt_h8i9j0k1l2m3',
    timestamp: '2026-08-31T18:03:30Z',
    actor_id: 'adm_9d2a5f3',
    actor_email: 'ops@celvios.site',
    action: 'api_key.revoked',
    resource_type: 'api_key',
    resource_id: 'key_zz99',
    outcome: 'success',
    ip_address: '10.0.0.9',
    note: 'Revoked compromised API key per security incident SR-2281.',
    payload: { key_id: 'key_zz99', user_id: 'usr_f0b22de', revoked_by: 'adm_9d2a5f3' },
  },
];

const ACTION_CATEGORIES = ['All', 'kyc', 'withdrawal', 'deposit', 'roles', 'operational_controls', 'api_key'];

const OUTCOME_STYLES = {
  success: { color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
  failure: { color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5' },
};

async function fetchAuditEvents(filters) {
  const params = new URLSearchParams();
  // Backend expects: action, resource_type, resource_id, cursor, limit
  if (filters.action && filters.action !== 'All') params.set('action', filters.action);
  if (filters.resource_id) params.set('resource_id', filters.resource_id);
  // Note: backend doesn't have actor_email filter, but supports resource_type
  params.set('limit', '50');
  
  try {
    const res = await api(`/v1/admin/audit-events?${params.toString()}`);
    return res.events || [];
  } catch (err) {
    console.error('Failed to fetch audit events, using mock data:', err);
    // Fallback to mock data for development/demo
    return MOCK_EVENTS.filter(e => {
      if (filters.action && filters.action !== 'All' && !e.action.startsWith(filters.action)) return false;
      if (filters.resource_id && !e.resource_id.includes(filters.resource_id)) return false;
      if (filters.actor && !e.actor_email.includes(filters.actor)) return false;
      return true;
    });
  }
}

// ---------------------------------------------------------------------------

export default function AuditPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({ action: 'All', resource_id: '', actor: '' });
  const [liveFilters, setLiveFilters] = useState({ action: 'All', resource_id: '', actor: '' });
  const debounceRef = useRef(null);

  const load = async (f) => {
    setLoading(true);
    const data = await fetchAuditEvents(f);
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => { load(filters); }, []);

  const handleFilterChange = (key, value) => {
    const next = { ...liveFilters, [key]: value };
    setLiveFilters(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(next);
      load(next);
    }, 500);
  };

  const handleCategoryClick = (cat) => {
    const next = { ...liveFilters, action: cat };
    setLiveFilters(next);
    setFilters(next);
    load(next);
  };

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  const outcomeBadge = (outcome) => {
    const s = OUTCOME_STYLES[outcome] || OUTCOME_STYLES.success;
    return (
      <span className="al-outcome-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
        {outcome}
      </span>
    );
  };

  const actionColor = (action) => {
    if (action.includes('reject') || action.includes('disable') || action.includes('flagged') || action.includes('revoked')) return '#DC2626';
    if (action.includes('approve') || action.includes('release') || action.includes('granted')) return '#059669';
    return '#1D4ED8';
  };

  return (
    <div className="al-page">
      <div className="al-header">
        <div>
          <h1 className="al-title">Audit Log Explorer</h1>
          <p className="al-subtitle">Immutable log of all admin actions across the Limiance platform.</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="al-filter-bar">
        <div className="al-filter-group">
          <label>Filter by Category</label>
          <div className="al-category-pills">
            {ACTION_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`al-pill ${liveFilters.action === cat ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="al-filter-inputs">
          <div className="al-filter-field">
            <label>Resource ID</label>
            <input
              type="text"
              className="al-input"
              value={liveFilters.resource_id}
              onChange={e => handleFilterChange('resource_id', e.target.value)}
              placeholder="e.g. wdl_b3c7..."
            />
          </div>
          <div className="al-filter-field">
            <label>Actor Email</label>
            <input
              type="text"
              className="al-input"
              value={liveFilters.actor}
              onChange={e => handleFilterChange('actor', e.target.value)}
              placeholder="e.g. compliance@..."
            />
          </div>
        </div>
      </div>

      {/* Event list */}
      <div className="al-event-list">
        {loading ? (
          <div className="al-empty">Loading audit events...</div>
        ) : events.length === 0 ? (
          <div className="al-empty">No audit events match the selected filters.</div>
        ) : events.map(event => (
          <div key={event.id} className="al-event-card">
            <div className="al-event-main" onClick={() => toggle(event.id)}>
              <div className="al-event-left">
                <div className="al-action-dot" style={{ background: actionColor(event.action) }} />
                <div>
                  <div className="al-event-action" style={{ color: actionColor(event.action) }}>
                    {event.action}
                  </div>
                  <div className="al-event-meta">
                    <span>{event.actor_email}</span>
                    <span className="al-sep">·</span>
                    <span className="al-resource-type">{event.resource_type}</span>
                    <span className="al-sep">·</span>
                    <span className="al-resource-id">{event.resource_id}</span>
                  </div>
                </div>
              </div>
              <div className="al-event-right">
                {outcomeBadge(event.outcome)}
                <span className="al-timestamp">{new Date(event.timestamp).toLocaleString()}</span>
                <span className="al-ip">{event.ip_address}</span>
                <svg
                  className={`al-chevron ${expandedId === event.id ? 'open' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            {expandedId === event.id && (
              <div className="al-event-expanded">
                {event.note && (
                  <div className="al-note">
                    <span className="al-note-label">Operator Note:</span> {event.note}
                  </div>
                )}
                <div className="al-payload-label">Payload</div>
                <pre className="al-payload-json">{JSON.stringify(event.payload, null, 2)}</pre>
                <div className="al-expanded-meta">
                  <span><strong>Event ID:</strong> {event.id}</span>
                  <span><strong>Actor ID:</strong> {event.actor_id}</span>
                  <span><strong>IP:</strong> {event.ip_address}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
