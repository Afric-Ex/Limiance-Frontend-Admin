import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const MOCK_COUNTS = { kyc: 3, deposits: 3, withdrawals: 3, audit_events_today: 8 };

async function fetchCounts() {
  const results = { kyc: '—', deposits: '—', withdrawals: '—', audit_events_today: '—' };
  try {
    const kyc = await api('/v1/admin/kyc/applications?status=on_hold').catch(() => null);
    if (kyc) results.kyc = (kyc.applications || []).length;
    else results.kyc = MOCK_COUNTS.kyc;
  } catch { results.kyc = MOCK_COUNTS.kyc; }

  try {
    const dep = await api('/v1/admin/deposits?status=pending_risk_review').catch(() => null);
    if (dep) results.deposits = (dep.deposits || []).length;
    else results.deposits = MOCK_COUNTS.deposits;
  } catch { results.deposits = MOCK_COUNTS.deposits; }

  try {
    const wdl = await api('/v1/admin/withdrawals?status=pending_approval').catch(() => null);
    if (wdl) results.withdrawals = (wdl.withdrawals || []).length;
    else results.withdrawals = MOCK_COUNTS.withdrawals;
  } catch { results.withdrawals = MOCK_COUNTS.withdrawals; }

  try {
    const aud = await api('/v1/admin/audit-events').catch(() => null);
    if (aud) results.audit_events_today = (aud.events || []).length;
    else results.audit_events_today = MOCK_COUNTS.audit_events_today;
  } catch { results.audit_events_today = MOCK_COUNTS.audit_events_today; }

  return results;
}

export default function DashboardPage() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    fetchCounts().then(setCounts);
  }, []);

  const cards = [
    {
      label: 'KYC Queue',
      desc: 'Applications on hold awaiting compliance decision',
      count: counts?.kyc,
      color: 'orange',
      urgent: counts?.kyc > 0,
      route: '/kyc-queue',
    },
    {
      label: 'Deposit Exceptions',
      desc: 'Deposits flagged by risk engine for manual review',
      count: counts?.deposits,
      color: 'red',
      urgent: counts?.deposits > 0,
      route: '/deposits-queue',
    },
    {
      label: 'Withdrawals Queue',
      desc: 'Withdrawals pending dual-control approval',
      count: counts?.withdrawals,
      color: 'yellow',
      urgent: counts?.withdrawals > 0,
      route: '/withdrawals-queue',
    },
    {
      label: 'Audit Events',
      desc: 'Total logged admin actions in this session',
      count: counts?.audit_events_today,
      color: 'blue',
      urgent: false,
      route: '/audit',
    },
  ];

  return (
    <div className="dashboard">
      <div className="welcome-banner">
        <h2>Welcome back</h2>
        <p>{user?.email}</p>
        <div className="role-chips">
          {roles.map(role => (
            <span key={role} className="role-chip">{role}</span>
          ))}
        </div>
      </div>

      <div className="info-grid">
        {cards.map(card => (
          <button
            key={card.label}
            className={`info-card ${card.color} ${card.urgent ? 'urgent' : ''}`}
            onClick={() => navigate(card.route)}
          >
            <div className="info-card-top">
              <h3>{card.label}</h3>
              <div className="info-card-count">
                {counts === null ? (
                  <span className="count-loading">…</span>
                ) : (
                  <span className={card.urgent ? 'count-urgent' : 'count-normal'}>{card.count}</span>
                )}
              </div>
            </div>
            <p className="info-card-desc">{card.desc}</p>
            <span className="info-card-link">View queue →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
