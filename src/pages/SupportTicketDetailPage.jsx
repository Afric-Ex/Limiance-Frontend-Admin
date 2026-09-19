import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function SupportTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const statusColor = (st) => {
    switch ((st || "").toUpperCase()) {
      case "OPEN": return "#3b82f6";
      case "IN_PROGRESS": return "#f59e0b";
      case "RESOLVED": return "#10b981";
      case "CLOSED": return "#6b7280";
      default: return "#9ca3af";
    }
  };

  const fetchThread = async () => {
    setThreadLoading(true);
    try {
      const res = await api("/api/support/tickets/" + id);
      setSelectedTicket(res.ticket || res);
      setMessages(res.messages || []);
    } catch (err) {
      showToast(err.message || "Failed to load message thread", "error");
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchThread();
  }, [id]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setReplying(true);
    try {
      await api("/api/support/tickets/" + id + "/replies", {
        method: "POST",
        body: JSON.stringify({ body: replyText.trim() }),
      });
      setReplyText("");
      showToast("Reply sent to customer.");
      fetchThread();
    } catch (err) {
      showToast(err.message || "Failed to send reply", "error");
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api("/api/support/tickets/" + id + "/status", {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      showToast("Ticket status updated to " + newStatus);
    } catch (err) {
      showToast(err.message || "Failed to update ticket status", "error");
    }
  };

  if (threadLoading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        <div>Loading ticket conversation...</div>
      </div>
    );
  }

  if (!selectedTicket) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <h2 style={{ color: "#fff" }}>Support Ticket Not Found</h2>
        <button
          onClick={() => navigate("/support-tickets")}
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
          Back to Support Tickets
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
          onClick={() => navigate("/support-tickets")}
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
          <ArrowLeft size={16} /> Back to Support Tickets
        </button>
      </div>

      <div
        style={{
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: "12px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "28px",
          color: "#fff",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        }}
      >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #374151', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedTicket.subject}</h2>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  User ID: {selectedTicket.user_id} · Ticket: {selectedTicket.id}
                </div>
              </div>
              <button
                onClick={() => navigate("/support-tickets")}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Status Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Current Status:</span>
              <select
                value={selectedTicket.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                style={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  color: '#fff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {/* Messages Thread Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                background: '#161e2e',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '260px',
                maxHeight: '360px',
              }}
            >
              {threadLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Loading message thread...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No messages in thread yet.</div>
              ) : (
                messages.map((m) => {
                  const isAgent = m.sender_type === 'agent' || m.sender_type === 'admin';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isAgent ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        background: isAgent ? '#2563eb' : '#1f2937',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    >
                      <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>
                        {isAgent ? 'Support Agent' : 'Customer'} · {m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}
                      </div>
                      <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{m.body}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your official reply to customer..."
                required
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: '#1f2937',
                  border: '1px solid #374151',
                  color: '#fff',
                  borderRadius: '6px',
                }}
              />
              <button
                type="submit"
                disabled={replying}
                style={{
                  padding: '10px 18px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {replying ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          </div>
    </div>
  );
}
