import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  UserCheck,
} from "lucide-react";
import { ShimmerTableRows } from "../components/Shimmer";

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    showToast("Copied to clipboard");
  };

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const q = searchQuery.trim() ? "&query=" + encodeURIComponent(searchQuery.trim()) : "";
      const res = await api("/api/users?page=" + page + "&limit=20" + q);
      const rawUsers = res.users || res.data || (Array.isArray(res) ? res : []);
      setUsers(Array.isArray(rawUsers) ? rawUsers : []);
      setTotalPages(res.total_pages || res.totalPages || 1);
      setTotalRecords(res.total_records || res.totalRecords || (Array.isArray(rawUsers) ? rawUsers.length : 0));
      setCurrentPage(res.current_page || res.currentPage || page);
    } catch (err) {
      console.error("Failed to load users", err);
      showToast(err.message || "Failed to load user list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1);
  };

  // Filter users by client-side status selector
  const filteredUsers = (users || []).filter((u) => {
    if (!u) return false;
    const isFrozen = !u.trading_enabled && !u.withdrawals_enabled && !u.deposits_enabled;
    if (statusFilter === "FROZEN") return isFrozen;
    if (statusFilter === "ACTIVE") return u.is_active && !isFrozen;
    if (statusFilter === "NO_TRADING") return !u.trading_enabled;
    if (statusFilter === "VERIFIED") return u.is_id_verified || u.kyc_status === "VERIFIED" || u.kyc_status === "APPROVED";
    if (statusFilter === "UNVERIFIED") return !u.is_id_verified && u.kyc_status !== "VERIFIED" && u.kyc_status !== "APPROVED";
    return true;
  });

  return (
    <div className="users-page" style={{ maxWidth: "1440px", margin: "0 auto" }}>
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

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text-primary)", fontWeight: 700 }}>User Accounts & 360 Ops</h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Comprehensive account profiles, multi-chain custodial wallets, portfolio asset balances, trade logs, and security kill-switches.
          </p>
        </div>
        <div style={{ color: "var(--info-text)", fontSize: "13px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid var(--info-border)", padding: "6px 14px", borderRadius: "9999px", fontWeight: 600 }}>
          {totalRecords.toLocaleString()} Registered Users
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "20px",
          background: "var(--bg-card)",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", flex: 1, maxWidth: "480px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by User ID, email, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-medium)",
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "#4d77f0",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-medium)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "var(--text-primary)",
              fontSize: "13px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Users</option>
            <option value="FROZEN">Frozen / Restricted</option>
            <option value="NO_TRADING">Trading Disabled</option>
            <option value="VERIFIED">KYC Verified</option>
            <option value="UNVERIFIED">KYC Unverified</option>
          </select>

          <button
            onClick={() => fetchUsers(currentPage)}
            style={{
              padding: "8px 12px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-medium)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", color: "var(--text-tertiary)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>User Identity</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Account Status</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Operational Flags</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Compliance & KYC</th>
              <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <ShimmerTableRows rows={6} cols={5} colWidths={['65%', '45%', '50%', '40%', '35%']} />
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
                  No users found matching current filters
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isFrozen = !u.trading_enabled && !u.withdrawals_enabled && !u.deposits_enabled;
                const userIdStr = String(u.id || "");
                const shortId = userIdStr.length > 10 ? userIdStr.substring(0, 10) + "..." : userIdStr;

                return (
                  <tr
                    key={u.id}
                    onClick={() => navigate("/users/" + u.id)}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--overlay-1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>
                          {u.email || u.username || "Anonymous"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--info-text)" }}>
                            {shortId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(u.id);
                            }}
                            style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", padding: 0 }}
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      {isFrozen ? (
                        <span style={{ padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, background: "rgba(239, 68, 68, 0.15)", color: "var(--danger-text)", border: "1px solid var(--danger-border)" }}>
                          ❄️ FROZEN
                        </span>
                      ) : u.is_active ? (
                        <span style={{ padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, background: "rgba(16, 185, 129, 0.12)", color: "var(--success-text)", border: "1px solid var(--success-border)" }}>
                          ACTIVE
                        </span>
                      ) : (
                        <span style={{ padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, background: "var(--overlay-3)", color: "var(--text-tertiary)" }}>
                          SUSPENDED
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: u.trading_enabled ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.1)", color: u.trading_enabled ? "var(--success-text)" : "var(--danger-text)" }}>
                          Trade: {u.trading_enabled ? "ON" : "OFF"}
                        </span>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: u.withdrawals_enabled ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.1)", color: u.withdrawals_enabled ? "var(--success-text)" : "var(--danger-text)" }}>
                          WD: {u.withdrawals_enabled ? "ON" : "OFF"}
                        </span>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, background: u.deposits_enabled ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.1)", color: u.deposits_enabled ? "var(--success-text)" : "var(--danger-text)" }}>
                          Dep: {u.deposits_enabled ? "ON" : "OFF"}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", background: "rgba(99, 102, 241, 0.14)", color: "var(--info-text)", fontSize: "11px", fontWeight: 600 }}>
                          Tier {u.kyc_tier || 0}
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                          {u.kyc_status || "UNVERIFIED"}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        ID Verified: {u.is_id_verified ? "✅ Yes" : "No"}
                      </div>
                    </td>

                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/users/" + u.id);
                        }}
                        style={{
                          padding: "6px 14px",
                          background: "var(--bg-surface-2)",
                          border: "1px solid var(--border-medium)",
                          color: "var(--text-primary)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        View 360°
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)" }}>
          <div style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
            Page {currentPage} of {totalPages}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "var(--bg-surface-2)",
                border: "1px solid var(--border-medium)",
                color: currentPage <= 1 ? "var(--text-faint)" : "var(--text-primary)",
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "var(--bg-surface-2)",
                border: "1px solid var(--border-medium)",
                color: currentPage >= totalPages ? "var(--text-faint)" : "var(--text-primary)",
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
