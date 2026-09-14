import React, { useState, useEffect } from 'react';
import './KycQueuePage.css';
import { api } from '../api/client';

export default function KycQueuePage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('on_hold'); // on_hold, pending, approved, rejected
  
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [docViewerUrl, setDocViewerUrl] = useState(null);
  
  // Decision state
  const [rejectReason, setRejectReason] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api(`/v1/admin/kyc/applications?status=${statusFilter}`);
      setCases(res.applications || []);
    } catch (err) {
      console.error('Failed to fetch cases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter]);

  const openCase = (application) => {
    setSelectedCase(application.user_id);
    setCaseDetails(application);
  };

  const viewDocument = (documentUrl) => {
    // Documents come from the KYC application details directly from backend
    if (documentUrl) {
      setDocViewerUrl(documentUrl);
    } else {
      alert('Document URL not available.');
    }
  };

  const handleDecision = async (decision) => {
    if (decision === 'reject' && !rejectReason.trim()) {
      alert('A reject reason must be provided when rejecting an application.');
      return;
    }
    
    try {
      const endpoint = decision === 'approve' ? 'approve' : 'reject';
      const response = await api(`/v1/admin/kyc/${selectedCase}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ 
          reason: decision === 'reject' ? rejectReason : 'Application approved after compliance review.'
        })
      });
      alert(`Case ${decision}d successfully.`);
      setSelectedCase(null);
      setCaseDetails(null);
      setRejectReason('');
      setNotes('');
      fetchCases();
    } catch (err) {
      console.error(`Failed to ${decision} case:`, err);
      alert(`Failed to ${decision} case: ${err.message || 'Unknown error'}`);
    }
  };

  const renderStatus = (status) => {
    return <span className={`status-badge ${status}`}>{status.replace('_', ' ').toUpperCase()}</span>;
  };

  return (
    <div className="kyc-queue-page">
      <div className="kyc-header">
        <div>
          <h1 className="kyc-title">KYC Queue</h1>
          <p className="kyc-subtitle">Review and manage user identity verification applications.</p>
        </div>
        <div className="kyc-filters">
          {['on_hold', 'pending', 'approved', 'rejected'].map(status => (
            <button 
              key={status}
              className={`kyc-filter-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="kyc-table-container">
        <table className="kyc-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>User ID</th>
              <th>Level Request</th>
              <th>Submitted At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No cases found in this queue.</td></tr>
            ) : (
              cases.map(c => (
                <tr key={c.user_id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{c.applicant_id || c.user_id}</td>
                  <td>{c.uid || c.user_id}</td>
                  <td>{c.level_name || `Level ${c.tier}`}</td>
                  <td>{new Date(c.updated_at).toLocaleString()}</td>
                  <td>{renderStatus(c.status)}</td>
                  <td>
                    <button className="action-btn view" onClick={() => openCase(c)}>
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedCase && (
        <div className="kyc-modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="kyc-detail-card" onClick={e => e.stopPropagation()}>
            <div className="kyc-detail-header">
              <h2>Case Details: {selectedCase}</h2>
              <button className="btn-close-detail" onClick={() => setSelectedCase(null)}>Close</button>
            </div>
            
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: '#F59E0B', fontSize: '13px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span><strong>Audit Notice:</strong> Access to sensitive PII and identity documents is actively monitored and logged by the Limiance Security Team.</span>
            </div>

            <div className="kyc-detail-body">
              {detailsLoading || !caseDetails ? (
                <div>Loading details...</div>
              ) : (
                <>
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Applicant Details</h3>
                    <div className="kyc-info-grid">
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Full Name</span>
                        <span className="kyc-info-value">{caseDetails.applicant?.first_name} {caseDetails.applicant?.last_name}</span>
                      </div>
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Date of Birth</span>
                        <span className="kyc-info-value">{caseDetails.applicant?.dob || 'N/A'}</span>
                      </div>
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Nationality</span>
                        <span className="kyc-info-value">{caseDetails.applicant?.nationality || 'N/A'}</span>
                      </div>
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Status</span>
                        <span className="kyc-info-value">{renderStatus(caseDetails.status)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Submitted Documents</h3>
                    <div className="kyc-documents">
                      {caseDetails.documents?.map(doc => (
                        <div key={doc.id || doc.type} className="kyc-doc-item">
                          <div className="kyc-doc-info">
                            <svg className="kyc-doc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span className="kyc-doc-name">{doc.type.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          <button 
                            className="kyc-doc-view-btn" 
                            onClick={() => viewDocument(doc.url || doc.image_url || doc.document_url || doc.id)}
                            disabled={!doc.url && !doc.image_url && !doc.document_url}
                          >
                            View Document
                          </button>
                        </div>
                      ))}
                      {(!caseDetails.documents || caseDetails.documents.length === 0) && (
                        <div style={{ color: '#6B7280', fontSize: '14px' }}>No documents provided.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {!detailsLoading && caseDetails && (caseDetails.status === 'on_hold' || caseDetails.status === 'pending') && (
              <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>Compliance Decision</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Internal Notes (Optional)</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any internal compliance notes here..."
                      style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'white', resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Reject Reason (Required for rejection)</label>
                    <input 
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. ID document is blurry, Selfie does not match ID..."
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
                    />
                  </div>
                </div>

                <div className="kyc-detail-footer">
                  <button className="btn-reject" onClick={() => handleDecision('reject')}>Reject Application</button>
                  <button className="btn-approve" onClick={() => handleDecision('approve')}>Approve Application</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {docViewerUrl && (
        <div className="doc-viewer-modal" onClick={() => setDocViewerUrl(null)}>
          <button className="doc-viewer-close" onClick={() => setDocViewerUrl(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <div className="doc-viewer-content" onClick={e => e.stopPropagation()}>
            {/* If URL is image, render img. If PDF or other, render iframe/object. */}
            {docViewerUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || docViewerUrl.startsWith('data:image') ? (
              <img src={docViewerUrl} alt="Document" />
            ) : (
              <iframe src={docViewerUrl} title="Document Viewer" frameBorder="0" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
