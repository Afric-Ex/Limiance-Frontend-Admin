import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ShimmerDetailCard } from "../components/Shimmer";
import "./KycQueuePage.css";

export default function KycDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedCase, setSelectedCase] = useState(id);
  const [submission, setSubmission] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [docData, setDocData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  const [approveTier, setApproveTier] = useState(1);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [docViewerUrl, setDocViewerUrl] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const renderStatus = (st) => {
    const s = (st || "").toLowerCase();
    let badgeClass = "badge-pending";
    let label = st || "UNKNOWN";
    if (s === "approved" || s === "completed" || s === "verified") {
      badgeClass = "badge-approved";
    } else if (s === "rejected") {
      badgeClass = "badge-rejected";
    } else if (s === "resubmit_requested") {
      badgeClass = "badge-resubmit";
      label = "RESUBMIT";
    }
    return <span className={"kyc-badge " + badgeClass}>{label}</span>;
  };

  const fetchDetails = async () => {
    setDetailsLoading(true);
    try {
      const res = await api("/api/kyc/" + id);
      console.log("res:", res.ID);
      const sub = res || res;
      setSubmission(sub);
      setSelectedCase(sub.ID);

      if (sub.UserId) {
        try {
          const u = await api("/api/users/" + sub.UserId);
          setUserDetails(u.user || u);
          if (u.user?.kyc_tier !== undefined) {
            setApproveTier(Math.max(1, u.user.kyc_tier));
          }
        } catch (e) {
          console.warn("Could not fetch user details for KYC case", e);
        }
      }

      if (sub.applicant_id) {
        try {
          const d = await api("/api/kyc/applicant/" + sub.applicant_id);
          setDocData(d);
        } catch (e) {
          console.warn("Could not fetch Sumsub applicant docs", e);
        }
      }
    } catch (err) {
      showToast(err.message || "Failed to load KYC case", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleDecision = async (decision) => {
    console.log("Decision:", decision, "Reason:", actionReason);
    if (!selectedCase) return;
    if (decision === "REJECT" && !actionReason.trim()) {
      showToast("A rejection reason is strictly required.", "error");
      return;
    }
    console.log("Decision:", decision, "Reason:", actionReason);
    setActionLoading(true);
    try {
          console.log("Decision:", decision, "Reason:", actionReason);
      const payload = {
        action: decision,
        reason: actionReason.trim() || undefined,
        tier: decision === "APPROVE" ? parseInt(approveTier, 10) : undefined,
      };
    console.log("Decision:", decision, "Reason:", actionReason);
      await api("/api/kyc/" + selectedCase + "/review", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showToast("KYC submission " + decision.toLowerCase() + "d successfully.");
      setTimeout(() => navigate("/kyc-queue"), 1000);
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (detailsLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
        <ShimmerDetailCard title="Loading KYC submission details..." />
      </div>
    );
  }

  if (!submission) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-primary)" }}>KYC Submission Not Found</h2>
        <button
          onClick={() => navigate("/kyc-queue")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border-medium)",
            color: "var(--text-primary)",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Back to KYC Queue
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1320px", margin: "0 auto", position: "relative" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "10px",
            background: toast.type === "error" ? "rgba(239, 68, 68, 0.95)" : "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => navigate("/kyc-queue")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-medium)",
            color: "var(--text-primary)",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to KYC Queue
        </button>
      </div>

      <div className="kyc-detail-card" style={{ maxWidth: "100%" }}>
        <div className="kyc-detail-header">
          <h2>Submission Review: {selectedCase}</h2>
          <button className="btn-close-detail" onClick={() => navigate("/kyc-queue")}>
            Back
          </button>
        </div>

        <div
          style={{
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid var(--warning-border)",
            padding: "12px 16px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "20px 28px 0",
            color: "var(--warning-text)",
            fontSize: "13px",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>
            <strong>Audit Notice:</strong> Access to identity documents and applicant records is permanently logged for compliance auditing.
          </span>
        </div>
<div className="kyc-detail-body">
              {detailsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>Loading applicant data & documents...</div>
              ) : (
                <>
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>User Account & Profile</h3>
                    <div className="kyc-info-grid">
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Name</span>
                        <span className="kyc-info-value">
                          {userDetails?.first_name || userDetails?.last_name
                            ? `${userDetails.first_name || ''} ${userDetails.last_name || ''}`
                            : '—'}
                        </span>
                      </div>
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Email</span>
                        <span className="kyc-info-value">{userDetails?.email || '—'}</span>
                      </div>
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Phone</span>
                        <span className="kyc-info-value">{userDetails?.phone || '—'}</span>
                      </div>
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Country</span>
                        <span className="kyc-info-value">{userDetails?.country || '—'}</span>
                      </div>
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Current KYC Tier</span>
                        <span className="kyc-info-value">Tier {userDetails?.kyc_tier ?? 0}</span>
                      </div>
                      <div className="kyc-info-item">
                        <span className="kyc-info-label">Submission Status</span>
                        <span className="kyc-info-value">{renderStatus(submission.status)}</span>
                      </div>
                      {submission.rejection_reason && (
                        <div className="kyc-info-item" style={{ gridColumn: 'span 2' }}>
                          <span className="kyc-info-label">Previous Rejection / Note</span>
                          <span className="kyc-info-value" style={{ color: 'var(--danger-text)' }}>
                            {submission.rejection_reason}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Sumsub Verification Documents</h3>
                    {docData?.documents && docData.documents.length > 0 ? (
                      <div className="kyc-documents">
                        {docData.documents.map((doc, idx) => (
                          <div key={idx} className="kyc-doc-item">
                            <div className="kyc-doc-info">
                              <svg className="kyc-doc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                              </svg>
                              <div>
                                <div className="kyc-doc-name">{doc.idDocType || doc.type || 'DOCUMENT'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                  Country: {doc.country || 'N/A'} · Answer: {doc.reviewResult?.reviewAnswer || 'UNREVIEWED'}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {(doc.imageIds || []).map((imgId) => (
                                <button
                                  key={imgId}
                                  className="kyc-doc-view-btn"
                                  onClick={() => viewDocumentImage(submission.user_id, imgId)}
                                  disabled={docLoading}
                                >
                                  View Page #{imgId}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', background: 'var(--bg-surface-2)', padding: '12px', borderRadius: '6px' }}>
                        No direct documents synced from Sumsub or applicant is still completing the flow.
                      </div>
                    )}
                  </div>

                  {/* Decision Controls */}
                  <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>Operator Compliance Action</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-primary)', minWidth: '120px' }}>Approval Tier:</label>
                        <select
                          value={approveTier}
                          onChange={(e) => setApproveTier(e.target.value)}
                          style={{ padding: '8px 12px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: '6px' }}
                        >
                          <option value="1">Tier 1 (Basic Trading & Standard Limits)</option>
                          <option value="2">Tier 2 (Higher Volume & Unlimited Fiat/Crypto)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-primary)' }}>
                          Reason / Instructions (Required for Rejection or Requesting Resubmission):
                        </label>
                        <input
                          type="text"
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          placeholder="e.g. Document expired, please provide valid passport with visible MRZ..."
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div className="kyc-detail-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleDecision('request-information')}
                        disabled={actionLoading}
                        style={{ padding: '8px 14px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Request Resubmission
                      </button>
                      <button
                        type="button"
                        className="btn-reject"
                        onClick={() => handleDecision('reject')}
                        disabled={actionLoading}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="btn-approve"
                        onClick={() => handleDecision('approve')}
                        disabled={actionLoading}
                      >
                        Approve (Tier {approveTier})
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

      {docViewerUrl && (
        <div className="doc-viewer-modal" onClick={() => setDocViewerUrl(null)}>
          <button className="doc-viewer-close" onClick={() => setDocViewerUrl(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <div className="doc-viewer-content" onClick={(e) => e.stopPropagation()}>
            <img src={docViewerUrl} alt="KYC Document Preview" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }} />
          </div>
        </div>
      )}
    </div>
  );
}
