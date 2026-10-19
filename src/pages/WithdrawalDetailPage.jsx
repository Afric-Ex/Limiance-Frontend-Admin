import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useConfirm } from "../context/ConfirmContext";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ShimmerDetailCard } from "../components/Shimmer";
import "./WithdrawalsQueuePage.css";

export default function WithdrawalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [selected, setSelected] = useState(id);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDetail = async () => {
    setDetailLoading(true);
    try {
      const res = await api("/api/withdrawals/pending");
      const list = res.withdrawals || res.data || [];
      const found = list.find((w) => String(w.id) === String(id));
      if (found) {
        setDetail(found);
      } else {
        const single = await api("/api/withdrawals/" + id);
        setDetail(single.withdrawal || single.data || single);
      }
    } catch (err) {
      showToast(err.message || "Failed to load withdrawal details", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    const ok = await confirm({
      title: "Approve Withdrawal",
      message: `Approve withdrawal #${id} and release funds on-chain to the destination address?`,
      confirmText: "Approve & Release",
      variant: "success",
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      await api("/api/withdrawals/" + id + "/approve", {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      showToast("Withdrawal approved and queued for dispatch.");
      setTimeout(() => navigate("/withdrawals-queue"), 1000);
    } catch (err) {
      showToast(err.message || "Approval failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      showToast("A rejection reason is strictly required.", "error");
      return;
    }
    const ok = await confirm({
      title: "Reject Withdrawal",
      message: `Are you sure you want to reject withdrawal #${id}? The funds will be credited back or retained per compliance policy.`,
      confirmText: "Reject Withdrawal",
      variant: "danger",
    });
    if (!ok) return;
    setActionLoading(true);
    try {
      await api("/api/withdrawals/" + id + "/reject", {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      showToast("Withdrawal rejected and customer notified.");
      setTimeout(() => navigate("/withdrawals-queue"), 1000);
    } catch (err) {
      showToast(err.message || "Rejection failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (detailLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
        <ShimmerDetailCard title="Loading withdrawal details..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-primary)" }}>Withdrawal Request Not Found</h2>
        <button
          onClick={() => navigate("/withdrawals-queue")}
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
          Back to Withdrawals Queue
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
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
          onClick={() => navigate("/withdrawals-queue")}
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
          <ArrowLeft size={16} /> Back to Withdrawals Queue
        </button>
      </div>

      <div className="wq-modal" style={{ maxWidth: "100%", maxHeight: "none" }}>
            <div className="wq-modal-header">
              <div>
                <h2 className="wq-modal-title">Withdrawal Decision Review</h2>
                <span className="wq-modal-id">{selected}</span>
              </div>
              <button className="wq-modal-close" onClick={() => navigate("/withdrawals-queue")}>
                ✕
              </button>
            </div>

            <div className="wq-audit-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>
                Approving this queued request releases funds to the destination blockchain address. Approvals and rejections are logged to the immutable admin audit trail.
              </span>
            </div>

            {detailLoading || !detail ? (
              <div className="wq-modal-loading">Loading withdrawal details...</div>
            ) : (
              <>
                <div className="wq-detail-grid">
                  <div className="wq-detail-section">
                    <h3 className="wq-section-title">Transfer Specification</h3>
                    <div className="wq-info-list">
                      <div className="wq-info-row">
                        <span>Asset & Network</span>
                        <strong>
                          {detail.asset} ({detail.chain})
                        </strong>
                      </div>
                      <div className="wq-info-row">
                        <span>Amount</span>
                        <strong>
                          {detail.amount} {detail.asset}
                        </strong>
                      </div>
                      <div className="wq-info-row">
                        <span>Destination Address</span>
                        <strong className="wq-mono-sm" style={{ wordBreak: 'break-all' }}>
                          {detail.destination}
                        </strong>
                      </div>
                      {detail.token_address && (
                        <div className="wq-info-row">
                          <span>Token Contract</span>
                          <strong className="wq-mono-sm" style={{ wordBreak: 'break-all' }}>
                            {detail.token_address}
                          </strong>
                        </div>
                      )}
                      <div className="wq-info-row">
                        <span>User Account ID</span>
                        <strong className="wq-mono-sm">{detail.user_id}</strong>
                      </div>
                      <div className="wq-info-row">
                        <span>Wallet ID</span>
                        <strong className="wq-mono-sm">{detail.wallet_id}</strong>
                      </div>
                      <div className="wq-info-row">
                        <span>Idempotency Key</span>
                        <strong className="wq-mono-sm">{detail.idempotency_key}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="wq-detail-section">
                    <h3 className="wq-section-title">Raw Payload Inspection</h3>
                    <pre
                      style={{
                        background: 'var(--bg-surface-2)',
                        padding: '12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'var(--success-text)',
                        overflowX: 'auto',
                        maxHeight: '220px',
                      }}
                    >
                      {JSON.stringify(detail.raw, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Decision Form */}
                <div className="wq-decision">
                  <h3 className="wq-section-title">Operator Action</h3>
                  <div className="wq-decision-form">
                    <div className="wq-input-group">
                      <label>Rejection Reason (required only when rejecting)</label>
                      <input
                        type="text"
                        className="wq-input"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Destination address flag, account pending KYC review..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          background: 'var(--bg-surface-2)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                    <div className="wq-decision-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button className="wq-btn-cancel" onClick={() => navigate("/withdrawals-queue")} disabled={actionLoading}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={actionLoading}
                        style={{
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        {actionLoading ? 'Processing...' : 'Reject Withdrawal'}
                      </button>
                      <button className="wq-btn-approve" onClick={handleApprove} disabled={actionLoading}>
                        {actionLoading ? 'Processing...' : '✓ Approve & Release'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
    </div>
  );
}
