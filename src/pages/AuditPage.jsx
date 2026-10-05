import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import './AuditPage.css';
import { Shimmer } from '../components/Shimmer';

const TARGET_TYPES = ['All', 'admin_operator', 'kyc_submission', 'withdrawal_approval', 'SYSTEM', 'USER', 'CONFIG'];

export default function AuditPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [filters, setFilters] = useState({ target_type: 'All', actor: '', action: '' });
  const [liveFilters, setLiveFilters] = useState({ target_type: 'All', actor: '', action: '' });
  const debounceRef = useRef(null);

  const fetchAuditLogs = async (f, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (f.target_type && f.target_type !== 'All') params.set('target_type', f.target_type);
      if (f.actor && f.actor.trim()) params.set('actor', f.actor.trim());
      if (f.action && f.action.trim()) params.set('action', f.action.trim());

      const res = await api(`/api/audit-logs?${params.toString()}`);
      setEvents(res.data || []);
      setTotalRecords(res.totalRecords || 0);
      setCurrentPage(res.currentPage || 1);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(filters, currentPage);
  }, [filters, currentPage]);

  const handleFilterChange = (key, value) => {
    const next = { ...liveFilters, [key]: value };
    setLiveFilters(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(next);
      setCurrentPage(1);
    }, 400);
  };

  const handleCategoryClick = (type) => {
    const next = { ...liveFilters, target_type: type };
    setLiveFilters(next);
    setFilters(next);
    setCurrentPage(1);
  };

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const actionColor = (action = '') => {
    const a = action.toLowerCase();
    if (a.includes('reject') || a.includes('halt') || a.includes('suspend') || a.includes('freeze') || a.includes('deactivate')) {
      return '#DC2626';
    }
    if (a.includes('approve') || a.includes('resume') || a.includes('create') || a.includes('unfreeze') || a.includes('enable')) {
      return '#059669';
    }
    return '#3B82F6';
  };

  const totalPages = Math.ceil(totalRecords / 20) || 1;

  return (
    <div className="al-page">
      <div className="al-header">
        <div>
          <h1 className="al-title">Immutable Admin Audit Log</h1>
          <p className="al-subtitle">
            Cryptographically signed and tamper-evident audit record of every administrative action on the Limiance platform.
          </p>
        </div>
        <div style={{ color: '#9ca3af', fontSize: '14px', background: '#1f2937', padding: '8px 14px', borderRadius: '6px' }}>
          {totalRecords} Total Recorded Events
        </div>
      </div>

      {/* Filter bar */}
      <div className="al-filter-bar">
        <div className="al-filter-group">
          <label>Target Category</label>
          <div className="al-category-pills">
            {TARGET_TYPES.map((type) => (
              <button
                key={type}
                className={`al-pill ${liveFilters.target_type === type ? 'active' : ''}`}
                onClick={() => handleCategoryClick(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="al-filter-inputs">
          <div className="al-filter-field">
            <label>Actor / Operator</label>
            <input
              type="text"
              className="al-input"
              value={liveFilters.actor}
              onChange={(e) => handleFilterChange('actor', e.target.value)}
              placeholder="e.g. admin@..."
            />
          </div>
          <div className="al-filter-field">
            <label>Action Query</label>
            <input
              type="text"
              className="al-input"
              value={liveFilters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="e.g. approve, halt..."
            />
          </div>
        </div>
      </div>

      {/* Event list */}
      <div className="al-event-list">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="al-event-card"
                style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '60%' }}>
                  <Shimmer width="8px" height="8px" borderRadius="50%" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    <Shimmer width="140px" height="14px" />
                    <Shimmer width="240px" height="11px" />
                  </div>
                </div>
                <Shimmer width="100px" height="12px" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="al-empty">No audit events match the selected filters.</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="al-event-card">
              <div className="al-event-main" onClick={() => toggle(event.id)}>
                <div className="al-event-left">
                  <div className="al-action-dot" style={{ background: actionColor(event.action) }} />
                  <div>
                    <div className="al-event-action" style={{ color: actionColor(event.action) }}>
                      {event.action}
                    </div>
                    <div className="al-event-meta">
                      <span style={{ fontWeight: '500', color: '#f3f4f6' }}>{event.actor}</span>
                      <span className="al-sep">·</span>
                      <span className="al-resource-type">{event.target_type}</span>
                      <span className="al-sep">·</span>
                      <span className="al-resource-id" style={{ fontFamily: 'monospace' }}>
                        {event.target_id || '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="al-event-right">
                  <span className="al-timestamp">
                    {event.created_at ? new Date(event.created_at).toLocaleString() : '—'}
                  </span>
                  <svg
                    className={`al-chevron ${expandedId === event.id ? 'open' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              {expandedId === event.id && (
                <div className="al-event-expanded">
                  <div className="al-note">
                    <span className="al-note-label">Event Details:</span> {event.details || 'No additional payload notes'}
                  </div>
                  <div className="al-expanded-meta" style={{ marginTop: '12px' }}>
                    <span>
                      <strong>Event ID:</strong> {event.id}
                    </span>
                    <span>
                      <strong>Target Type:</strong> {event.target_type}
                    </span>
                    <span>
                      <strong>Target ID:</strong> {event.target_id}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={{ padding: '6px 14px', background: '#374151', color: '#fff', borderRadius: '4px', border: 'none' }}
          >
            Previous
          </button>
          <span style={{ alignSelf: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={{ padding: '6px 14px', background: '#374151', color: '#fff', borderRadius: '4px', border: 'none' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
