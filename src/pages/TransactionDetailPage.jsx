import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { getBlockchainNetwork } from "../utils/chain";
import { ArrowLeft, Copy, RefreshCw, CheckCircle, Clock, XCircle } from "lucide-react";
import { ShimmerDetailCard } from "../components/Shimmer";

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    showToast("Copied to clipboard!");
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api("/api/transactions/" + id);
      const data = res.transaction || res.data || res;
      setSelectedTxn(data);
    } catch (err) {
      showToast(err.message || "Failed to load transaction details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }}>
        <ShimmerDetailCard title="Loading transaction details..." />
      </div>
    );
  }

  if (!selectedTxn) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-primary)" }}>Transaction Not Found</h2>
        <button
          onClick={() => navigate("/transactions")}
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
          Back to Transactions
        </button>
      </div>
    );
  }

  const txHash = selectedTxn.hash || selectedTxn.tx_hash || selectedTxn.txHash;
  const userId = selectedTxn.user_id || selectedTxn.from_user_id || selectedTxn.to_user_id || 'N/A';
  const destination = selectedTxn.address || selectedTxn.to_address || selectedTxn.toAddress || selectedTxn.wallet_id || '—';
  const net = getBlockchainNetwork(selectedTxn, destination);
  const assetSymbol = selectedTxn.asset || selectedTxn.currency || selectedTxn.symbol || net.symbol || 'TOKEN';

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
            background: toast.type === "error" ? "var(--danger-solid)" : "var(--success-solid)",
            color: "#fff",
            boxShadow: "var(--shadow-md)",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => navigate("/transactions")}
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
          <ArrowLeft size={16} /> Back to Transactions
        </button>
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "var(--text-primary)", fontWeight: 700 }}>
              Transaction Inspection: {selectedTxn.id}
            </h2>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
              Created: {selectedTxn.created_at ? new Date(selectedTxn.created_at).toLocaleString() : "N/A"}
            </div>
          </div>
          <span style={{
            padding: "4px 12px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: 700,
            background: (selectedTxn.status || "").toLowerCase() === "completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
            color: (selectedTxn.status || "").toLowerCase() === "completed" ? "var(--success-text)" : "var(--info-text)",
          }}>
            {(selectedTxn.status || "COMPLETED").toUpperCase()}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "var(--bg-surface)", padding: "16px 20px", borderRadius: "10px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Transaction Type</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginTop: "6px" }}>
                {(selectedTxn.type || "DEPOSIT").toUpperCase()}
              </div>
            </div>
            <div style={{ background: "var(--bg-surface)", padding: "16px 20px", borderRadius: "10px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Network & Blockchain</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--info-text)", marginTop: "6px" }}>
                {selectedTxn.network || selectedTxn.chain || net.name} ({selectedTxn.chain || net.symbol})
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", padding: "20px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Gross Amount & Asset</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)", marginTop: "6px" }}>
              {selectedTxn.amount} {assetSymbol}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-tertiary)", marginTop: "4px" }}>
              Fee: {selectedTxn.fee || "0.00"} {assetSymbol}
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", padding: "16px 20px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>User Account ID</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
              <span style={{ fontSize: "14px", color: "var(--info-text)", fontFamily: "var(--font-mono)" }}>{userId}</span>
              <button onClick={() => copyToClipboard(userId)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <Copy size={13} />
              </button>
              <button
                onClick={() => navigate("/users/" + userId)}
                style={{
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid var(--info-border)",
                  color: "var(--info-text)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View User 360°
              </button>
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", padding: "16px 20px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>On-Chain Transaction Hash (TxHash)</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
              <span style={{ fontSize: "13px", color: "var(--success-text)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                {txHash || "Internal off-chain settlement"}
              </span>
              {txHash && (
                <button onClick={() => copyToClipboard(txHash)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                  <Copy size={13} />
                </button>
              )}
            </div>
          </div>

          <div style={{ background: "var(--bg-surface)", padding: "16px 20px", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Destination / Recipient Address</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-primary)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                {destination}
              </span>
              {destination !== "—" && (
                <button onClick={() => copyToClipboard(destination)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                  <Copy size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
