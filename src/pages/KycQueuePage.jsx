import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../context/ConfirmContext';
import './KycQueuePage.css';
import { api } from '../api/client';
import { ShimmerTableRows } from '../components/Shimmer';

export default function KycQueuePage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, VERIFIED, REJECTED, RESUBMIT, or ALL
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedCase, setSelectedCase] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [docData, setDocData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [docViewerUrl, setDocViewerUrl] = useState(null);
  const [docLoading, setDocLoading] = useState(false);

  // Decision state
  const [approveTier, setApproveTier] = useState(1);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'ALL' ? '' : statusFilter;
      const res = await api(`/api/kyc?status=${statusParam}&page=${currentPage}&limit=20`);
      setCases(
        (res.submissions || []).map((c) => ({
          id: c.id || c.submission_id || c.SubmissionID || c.ID || '—',
          user_id: c.user_id || c.userId || c.UserID || '—',
          applicant_id: c.applicant_id || c.applicantId || c.ApplicantID || '—',
          status: c.status || c.Status || '',
          submitted_at: c.submitted_at || c.SubmittedAt || c.created_at || c.CreatedAt || null,
          reviewed_at: c.reviewed_at || c.ReviewedAt || null,
        }))
      );
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch KYC submissions', err);
      showToast(err.message || 'Failed to fetch KYC queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, currentPage]);

  const openCase = async (sub) => {
    setSelectedCase(sub.id);
    setSubmission(sub);
    setUserDetails(null);
    setDocData(null);
    setActionReason('');
    setApproveTier(1);
    setDetailsLoading(true);

    try {
      // Parallel fetch of user details and live KYC documents
      const [userRes, docsRes] = await Promise.allSettled([
        api(`/api/users/${sub.user_id}`),
        api(`/api/users/${sub.user_id}/kyc-documents`),
      ]);

      if (userRes.status === 'fulfilled') {
        setUserDetails(userRes.value.user || userRes.value);
      }
      if (docsRes.status === 'fulfilled') {
        setDocData(docsRes.value);
      }
    } catch (err) {
      console.error('Error fetching KYC submission details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const viewDocumentImage = async (userId, imageId) => {
    setDocLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/users/${userId}/kyc-documents/${imageId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to load document image (HTTP ${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setDocViewerUrl(objectUrl);
    } catch (err) {
      showToast(`Could not load document: ${err.message}`, 'error');
    } finally {
      setDocLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    if ((decision === 'reject' || decision === 'request-information') && !actionReason.trim()) {
      showToast(`A reason must be provided when choosing ${decision.replace('-', ' ')}.`, 'error');
      return;
    }

    const actionTitle = decision === 'approve' ? 'Approve KYC Submission' : decision === 'reject' ? 'Reject KYC Submission' : 'Request Resubmission';
    const actionVariant = decision === 'approve' ? 'success' : 'danger';
    const ok = await confirm({
      title: actionTitle,
      message: decision === 'approve'
        ? `Approve KYC verification for this user and advance them to Tier ${approveTier}?`
        : `Are you sure you want to ${decision.replace('-', ' ')} this KYC submission? Reason: "${actionReason.trim()}"`,
      confirmText: decision === 'approve' ? `Approve Tier ${approveTier}` : decision === 'reject' ? 'Reject Submission' : 'Request Resubmission',
      variant: actionVariant,
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      if (decision === 'approve') {
        await api(`/api/kyc/${selectedCase}/approve`, {
          method: 'POST',
          body: JSON.stringify({ tier: Number(approveTier) }),
        });
        showToast(`KYC submission approved for Tier ${approveTier}.`);
      } else if (decision === 'reject') {
        await api(`/api/kyc/${selectedCase}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason: actionReason.trim() }),
        });
        showToast('KYC submission rejected.');
      } else if (decision === 'request-information') {
        await api(`/api/kyc/${selectedCase}/request-information`, {
          method: 'POST',
          body: JSON.stringify({ reason: actionReason.trim() }),
        });
        showToast('Resubmission requested from user.');
      }

      setSelectedCase(null);
      setSubmission(null);
      fetchCases();
    } catch (err) {
      console.error(`Failed to ${decision} case:`, err);
      showToast(`Failed to ${decision}: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatus = (status) => {
    const s = (status || 'UNVERIFIED').toUpperCase();
    const className =
      s === 'VERIFIED' || s === 'APPROVED'
        ? 'approved'
        : s === 'REJECTED'
        ? 'rejected'
        : s === 'PENDING'
        ? 'pending'
        : 'on_hold';
    return <span className={`status-badge ${className}`}>{s}</span>;
  };

  return (
    <div className="kyc-queue-page">
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '8px',
            background: toast.type === 'error' ? '#EF4444' : '#10B981',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="kyc-header">
        <div>
          <h1 className="kyc-title">KYC Review Queue</h1>
          <p className="kyc-subtitle">Live identity submissions from users connected to Sumsub verification.</p>
        </div>
        <div className="kyc-filters">
          {['PENDING', 'VERIFIED', 'REJECTED', 'RESUBMIT', 'ALL'].map((status) => (
            <button
              key={status}
              className={`kyc-filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="kyc-table-container">
        <table className="kyc-table">
          <thead>
            <tr>
              <th>Submission ID</th>
              <th>User ID</th>
              <th>Applicant ID</th>
              <th>Status</th>
              <th>Submitted At</th>
              <th>Reviewed At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={6} cols={7} colWidths={['25%', '25%', '25%', '15%', '20%', '20%', '15%']} />
            ) : cases.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No KYC submissions found in this queue.
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{c.id}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{c.user_id}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    {c.applicant_id || '—'}
                  </td>
                  <td>{renderStatus(c.status)}</td>
                  <td>{c.submitted_at ? new Date(c.submitted_at).toLocaleString() : '—'}</td>
                  <td>{c.reviewed_at ? new Date(c.reviewed_at).toLocaleString() : '—'}</td>
                  <td>
                    <button className="action-btn view" onClick={() => navigate(`/kyc-queue/${c.id}`)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={{ padding: '6px 12px', background: '#374151', color: '#fff', borderRadius: '4px', border: 'none' }}
          >
            Previous
          </button>
          <span style={{ alignSelf: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={{ padding: '6px 12px', background: '#374151', color: '#fff', borderRadius: '4px', border: 'none' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
