import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ShimmerDetailCard } from "../components/Shimmer";
import "./DepositsQueuePage.css";

export default function DepositDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(id);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const statusBadge = (st) => {
    const s = (st || "").toLowerCase();
    if (s === "completed" || s === "confirmed" || s === "credited") {
      return <span className="dq-badge credited">CREDITED</span>;
    }
    if (s === "pending" || s === "confirming") {
      return <span className="dq-badge pending">CONFIRMING</span>;
    }
    if (s === "failed" || s === "dropped") {
      return <span className="dq-badge dropped">DROPPED</span>;
    }
    return <span className="dq-badge">{st || "UNKNOWN"}</span>;
  };

  const fetchDetail = async () => {
    setDetailLoading(true);
    try {
      const res = await api("/api/deposits/" + id);
      const data = res.deposit || res.transaction || res.data || res;
      setDetail(data);
    } catch (err) {
      showToast(err.message || "Failed to load deposit transaction audit", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  if (detailLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
        <ShimmerDetailCard title="Loading deposit transaction audit..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <h2 style={{ color: "#fff" }}>Deposit Transaction Not Found</h2>
        <button
          onClick={() => navigate("/deposits-queue")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "#1c1e28",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Back to Deposits Queue
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
          onClick={() => navigate("/deposits-queue")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#181a22",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Deposits Queue
        </button>
      </div>

      <div className="dq-modal" style={{ maxWidth: "100%", maxHeight: "none" }}>
            <div className="dq-modal-header">
              <div>
                <h2 className="dq-modal-title">Deposit Transaction Audit</h2>
                <span className="dq-modal-id">{selected}</span>
              </div>
              <button className="dq-modal-close" onClick={() => navigate("/deposits-queue")}>
                ✕
              </button>
            </div>

            <div className="dq-audit-notice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>
                On-chain deposit events are verified by blockchain indexers and credited atomically into customer ledger accounts.
              </span>
            </div>

            {detailLoading || !detail ? (
              <div className="dq-modal-loading">Loading transaction details...</div>
            ) : (
              <>
                <div className="dq-detail-grid">
                  <div className="dq-detail-section">
                    <h3 className="dq-section-title">Transfer Specifics</h3>
                    <div className="dq-info-list">
                      <div className="dq-info-row">
                        <span>Status</span>
                        <strong>{statusBadge(detail.status)}</strong>
                      </div>
                      <div className="dq-info-row">
                        <span>Asset & Network</span>
                        <strong>
                          {detail.asset} on {detail.chain}
                        </strong>
                      </div>
                      <div className="dq-info-row">
                        <span>Gross Amount</span>
                        <strong>
                          {detail.amount} {detail.asset}
                        </strong>
                      </div>
                      <div className="dq-info-row">
                        <span>Network / Gas Fee</span>
                        <strong>
                          {detail.fee || '0'} {detail.asset}
                        </strong>
                      </div>
                      <div className="dq-info-row">
                        <span>Confirmations</span>
                        <strong>{detail.confirmations ?? 0} blocks</strong>
                      </div>
                      <div className="dq-info-row">
                        <span>Tx Hash</span>
                        <strong className="dq-mono-sm" style={{ wordBreak: 'break-all' }}>
                          {detail.hash || '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="dq-detail-section">
                    <h3 className="dq-section-title">Account Attribution</h3>
                    <div className="dq-info-list">
                      <div className="dq-info-row">
                        <span>Customer User ID</span>
                        <strong className="dq-mono-sm">{detail.user_id || detail.from_user_id || '—'}</strong>
                      </div>
                      <div className="dq-info-row">
                        <span>Destination Wallet ID</span>
                        <strong className="dq-mono-sm">{detail.wallet_id || detail.to_wallet_id || '—'}</strong>
                      </div>
                      <div className="dq-info-row">
                        <span>Created Timestamp</span>
                        <strong style={{ fontSize: '12px' }}>
                          {detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}
                        </strong>
                      </div>
                      {detail.completed_at && (
                        <div className="dq-info-row">
                          <span>Completed At</span>
                          <strong style={{ fontSize: '12px' }}>{new Date(detail.completed_at).toLocaleString()}</strong>
                        </div>
                      )}
                      {detail.failed_at && (
                        <div className="dq-info-row">
                          <span>Failed At</span>
                          <strong style={{ fontSize: '12px', color: '#ef4444' }}>
                            {new Date(detail.failed_at).toLocaleString()}
                          </strong>
                        </div>
                      )}
                      {detail.failure_reason && (
                        <div className="dq-info-row">
                          <span>Failure Reason</span>
                          <strong style={{ color: '#ef4444' }}>{detail.failure_reason}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="dq-btn-release" onClick={() => navigate("/deposits-queue")} style={{ background: '#374151' }}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
    </div>
  );
}
