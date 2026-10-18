import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useConfirm } from "../context/ConfirmContext";
import { getBlockchainNetwork } from "../utils/chain";
import {
  Shield,
  ShieldAlert,
  Wallet,
  PieChart,
  ArrowRightLeft,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  ArrowLeft,
  Sliders,
  Bell,
  Save,
} from "lucide-react";

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(false);

  // Tab Data States
  const [userWallets, setUserWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);

  const [userPortfolio, setUserPortfolio] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioSearch, setPortfolioSearch] = useState("");
  const [portfolioCategory, setPortfolioCategory] = useState("ALL");

  const [userTrades, setUserTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradesPage, setTradesPage] = useState(1);
  const [tradesTotal, setTradesTotal] = useState(0);
  const [tradesTotalPages, setTradesTotalPages] = useState(1);

  const [userApiKeys, setUserApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);

  const [userLoginLogs, setUserLoginLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // User Preferences & Settings State
  const [userSettings, setUserSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // KYC Override Form State
  const [newKycStatus, setNewKycStatus] = useState("UNVERIFIED");
  const [newKycTier, setNewKycTier] = useState(0);

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

  const fetchFullUser = async () => {
    setModalLoading(true);
    try {
      const full = await api("/api/users/" + id);
      const userData = full.user || full;
      setSelectedUser(userData);
      if (userData.kyc_status) setNewKycStatus(userData.kyc_status);
      if (userData.kyc_tier !== undefined) setNewKycTier(userData.kyc_tier);
    } catch (err) {
      showToast(err.message || "Failed to load user profile", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const fetchUserSettings = async (userId) => {
    setSettingsLoading(true);
    try {
      const res = await api(`/api/users/${userId}/settings`);
      setUserSettings(res || {});
    } catch (err) {
      showToast(err.message || "Failed to load user preferences", "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!selectedUser?.id || !userSettings) return;
    setSavingSettings(true);
    try {
      await api(`/api/users/${selectedUser.id}/settings`, {
        method: "PUT",
        body: userSettings,
      });
      showToast("User preferences updated successfully");
    } catch (err) {
      showToast(err.message || "Failed to update user preferences", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (id) fetchFullUser();
  }, [id]);

  useEffect(() => {
    if (!selectedUser?.id) return;
    if (activeTab === "wallets") {
      fetchUserWallets(selectedUser.id);
    } else if (activeTab === "portfolio") {
      fetchUserPortfolio(selectedUser.id, portfolioSearch);
    } else if (activeTab === "trades") {
      fetchUserTrades(selectedUser.id, tradesPage);
    } else if (activeTab === "apikeys") {
      fetchUserApiKeys(selectedUser.id);
    } else if (activeTab === "logs") {
      fetchUserLoginLogs(selectedUser.id);
    } else if (activeTab === "settings") {
      fetchUserSettings(selectedUser.id);
    }
  }, [activeTab, selectedUser?.id, tradesPage]);

  const fetchUserWallets = async (userId) => {
    setWalletsLoading(true);
    try {
      const res = await api("/api/users/" + userId + "/wallets");
      const list = res.wallets || res.data || (Array.isArray(res) ? res : []);
      setUserWallets(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast("Failed to load custodial wallets", "error");
    } finally {
      setWalletsLoading(false);
    }
  };

  const fetchUserPortfolio = async (userId, q = "") => {
    setPortfolioLoading(true);
    try {
      const queryParam = q ? "&query=" + encodeURIComponent(q) : "";
      const res = await api("/api/users/" + userId + "/portfolio?limit=50" + queryParam);
      const list = res.portfolio || res.assets || res.data || (Array.isArray(res) ? res : []);
      setUserPortfolio(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast("Failed to load portfolio assets", "error");
    } finally {
      setPortfolioLoading(false);
    }
  };

  const fetchUserTrades = async (userId, page = 1) => {
    setTradesLoading(true);
    try {
      const res = await api("/api/orders?userId=" + userId + "&page=" + page + "&limit=15");
      const list = res.data || res.trades || res.orders || (Array.isArray(res) ? res : []);
      setUserTrades(Array.isArray(list) ? list : []);
      const total = res.totalRecords || res.total || res.total_records || 0;
      setTradesTotal(total);
      setTradesTotalPages(Math.max(1, Math.ceil(total / 15)));
      setTradesPage(res.currentPage || res.page || page);
    } catch (err) {
      showToast("Failed to load user trades", "error");
    } finally {
      setTradesLoading(false);
    }
  };

  const fetchUserApiKeys = async (userId) => {
    setApiKeysLoading(true);
    try {
      const res = await api("/api/users/" + userId + "/api_keys");
      const list = res.api_keys || res.keys || (Array.isArray(res) ? res : []);
      setUserApiKeys(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast("Failed to load API keys", "error");
    } finally {
      setApiKeysLoading(false);
    }
  };

  const fetchUserLoginLogs = async (userId) => {
    setLogsLoading(true);
    try {
      const res = await api("/api/users/" + userId + "/login_logs?limit=30");
      const list = res.last_login || res.logs || res.last_logins || (Array.isArray(res) ? res : []);
      setUserLoginLogs(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast("Failed to load sign-in history", "error");
    } finally {
      setLogsLoading(false);
    }
  };

  const executeUserAction = async (endpoint, label, payload = null, method = "POST") => {
    if (!selectedUser) return;
    const ok = await confirm({
      title: `Confirm ${label}`,
      message: `Are you sure you want to execute "${label}" for ${selectedUser.email || selectedUser.id}?`,
      confirmText: `Execute ${label}`,
      variant: label.toLowerCase().includes('freeze') || label.toLowerCase().includes('disable') ? 'danger' : 'warning',
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      const opts = { method };
      if (payload) {
        opts.body = JSON.stringify(payload);
      }
      await api("/api/users/" + selectedUser.id + "/" + endpoint, opts);
      showToast(`Action "${label}" executed successfully.`);
      const updated = await api("/api/users/" + selectedUser.id);
      setSelectedUser(updated.user || updated);
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleKycOverride = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api("/api/users/" + selectedUser.id + "/kyc", {
        method: "PUT",
        body: JSON.stringify({
          status: newKycStatus,
          tier: parseInt(newKycTier, 10),
        }),
      });
      showToast("KYC status and tier updated.");
      const updated = await api("/api/users/" + selectedUser.id);
      const userData = updated.user || updated;
      setSelectedUser(userData);
      if (userData.kyc_status) setNewKycStatus(userData.kyc_status);
      if (userData.kyc_tier !== undefined) setNewKycTier(userData.kyc_tier);
    } catch (err) {
      showToast(err.message || "Failed to update KYC", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    const ok = await confirm({
      title: "Revoke API Key",
      message: "Are you sure you want to revoke this API key? Applications using this key will immediately lose access.",
      confirmText: "Revoke Key",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api("/api/api_keys/" + keyId + "/deactivate", { method: "POST" });
      showToast("API key revoked.");
      fetchUserApiKeys(selectedUser.id);
    } catch (err) {
      showToast(err.message || "Failed to revoke API key", "error");
    }
  };

  const handleRevokeAllApiKeys = async () => {
    const ok = await confirm({
      title: "Emergency Revoke All API Keys",
      message: `Emergency revoke ALL active API keys for ${selectedUser.email || selectedUser.id}? All trading bots and integrations will be disconnected immediately.`,
      confirmText: "Revoke All Keys",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api("/api/users/" + selectedUser.id + "/api_keys/deactivate_all", { method: "POST" });
      showToast("All API keys revoked.");
      fetchUserApiKeys(selectedUser.id);
    } catch (err) {
      showToast(err.message || "Failed to revoke keys", "error");
    }
  };

  const handleWalletStatus = async (walletId, action) => {
    let payload = null;
    if (action === "suspend") {
      const reason = await confirm({
        title: "Suspend Custodial Wallet",
        message: "Please provide an administrative or compliance reason for placing this wallet on hold:",
        confirmText: "Suspend Wallet",
        variant: "warning",
        prompt: true,
        promptPlaceholder: "e.g. Admin compliance hold, AML surveillance flag",
        promptDefault: "Admin compliance hold",
        promptRequired: true,
      });
      if (!reason) return;
      payload = { reason };
    } else {
      const ok = await confirm({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} Wallet`,
        message: `Are you sure you want to ${action} this custodial wallet?`,
        confirmText: `${action.charAt(0).toUpperCase() + action.slice(1)} Wallet`,
        variant: action === "activate" ? "success" : "warning",
      });
      if (!ok) return;
    }
    try {
      const opts = { method: "POST" };
      if (payload) {
        opts.body = JSON.stringify(payload);
      }
      await api("/api/wallets/" + walletId + "/" + action, opts);
      showToast("Wallet " + action + "d successfully.");
      fetchUserWallets(selectedUser.id);
    } catch (err) {
      showToast(err.message || ("Failed to " + action + " wallet"), "error");
    }
  };

  const isSelectedFrozen = selectedUser && (!selectedUser.trading_enabled && !selectedUser.withdrawals_enabled && !selectedUser.deposits_enabled);

  const filteredPortfolio = userPortfolio.filter((item) => {
    if (portfolioCategory === "SPOT") {
      return parseFloat(item.spot_balance || item.available || item.free || 0) > 0;
    }
    if (portfolioCategory === "FUNDING") {
      return parseFloat(item.funding_balance || 0) > 0;
    }
    if (portfolioCategory === "FUTURES") {
      return parseFloat(item.futures_balance || 0) > 0;
    }
    if (portfolioCategory === "MARGIN") {
      return parseFloat(item.margin_balance || 0) > 0;
    }
    return true;
  });

  if (modalLoading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        <div>Loading user 360 profile...</div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <h2 style={{ color: "#fff" }}>User Not Found</h2>
        <button
          onClick={() => navigate("/users")}
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
          Return to Users List
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1440px", margin: "0 auto", position: "relative" }}>
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
          onClick={() => navigate("/users")}
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
            transition: "all 0.15s ease",
          }}
        >
          <ArrowLeft size={16} /> Back to Users List
        </button>
      </div>

      <div
        style={{
          background: "#13151c",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#161822', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>
                    {selectedUser.email || selectedUser.username || selectedUser.id}
                  </h2>
                  {isSelectedFrozen ? (
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      ❄️ FROZEN
                    </span>
                  ) : (
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      ACTIVE
                    </span>
                  )}
                  <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: 'rgba(99, 102, 241, 0.14)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                    KYC Tier {selectedUser.kyc_tier || 0} ({selectedUser.kyc_status || 'UNVERIFIED'})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                  <span>User ID:</span>
                  <code style={{ color: '#818cf8', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>
                    {selectedUser.id}
                  </code>
                  <button onClick={() => copyToClipboard(selectedUser.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
                    <Copy size={12} />
                  </button>
                  {selectedUser.created_at && (
                    <span>• Registered: {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate("/users")}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '2px', background: '#0e1017', padding: '6px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
              {[
                { id: 'overview', label: 'Overview & Controls', icon: Shield },
                { id: 'wallets', label: 'Custodial Wallets', icon: Wallet },
                { id: 'portfolio', label: 'Portfolio Balances', icon: PieChart },
                { id: 'trades', label: 'Trade Executions', icon: ArrowRightLeft },
                { id: 'apikeys', label: 'API Keys', icon: Key },
                { id: 'logs', label: 'Sign-In Logs', icon: Clock },
                { id: 'settings', label: 'Preferences & Settings', icon: Sliders },
              ].map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      background: active ? '#13151c' : 'transparent',
                      color: active ? '#818cf8' : 'rgba(255,255,255,0.5)',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      borderBottom: active ? '2px solid #818cf8' : '2px solid transparent',
                    }}
                  >
                    <Icon size={14} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* TAB 1: OVERVIEW & KILL-SWITCHES */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* User Profile & Bio-Data Card */}
                  <div style={{ background: '#181a22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      User Profile & Bio-Data
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div style={{ background: '#13151c', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Full Name</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
                          {selectedUser.first_name || selectedUser.last_name
                            ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()
                            : selectedUser.name || 'Not Specified'}
                        </div>
                      </div>

                      <div style={{ background: '#13151c', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Primary Email</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#818cf8', marginTop: '4px' }}>
                          {selectedUser.email || '—'}
                        </div>
                      </div>

                      <div style={{ background: '#13151c', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Username</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
                          {selectedUser.username ? `@${selectedUser.username}` : 'None Set'}
                        </div>
                      </div>

                      <div style={{ background: '#13151c', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Phone Number</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
                          {selectedUser.phone || selectedUser.phone_number || 'None Linked'}
                        </div>
                      </div>

                      <div style={{ background: '#13151c', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Country / Region</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#34d399', marginTop: '4px' }}>
                          {selectedUser.country || selectedUser.nationality || 'Not Specified'}
                        </div>
                      </div>

                      <div style={{ background: '#13151c', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Referral Code</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                          {selectedUser.referral_code || '—'}
                        </div>
                      </div>

                      <div style={{ background: '#13151c', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Referred By</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                          {selectedUser.referred_by || 'None'}
                        </div>
                      </div>

                      <div style={{ background: '#13151c', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Registration Date</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginTop: '4px' }}>
                          {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Freeze Banner */}
                  <div style={{ padding: '16px 20px', borderRadius: '12px', background: isSelectedFrozen ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)', border: isSelectedFrozen ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: isSelectedFrozen ? '#f87171' : '#fbbf24', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={18} />
                        {isSelectedFrozen ? 'ACCOUNT CURRENTLY FROZEN' : 'EMERGENCY KILL SWITCH'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                        {isSelectedFrozen
                          ? 'All trading, withdrawals, and deposits are fully suspended for this account.'
                          : 'Instantly lock down trading, withdrawal execution, and deposit crediting in case of suspicious behavior or compromise.'}
                      </div>
                    </div>
                    {isSelectedFrozen ? (
                      <button
                        onClick={() => executeUserAction('unfreeze', 'Unfreeze Account')}
                        disabled={actionLoading}
                        style={{ padding: '10px 20px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                      >
                        Unfreeze Account
                      </button>
                    ) : (
                      <button
                        onClick={() => executeUserAction('freeze', 'Freeze Entire Account')}
                        disabled={actionLoading}
                        style={{ padding: '10px 20px', borderRadius: '8px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                      >
                        Freeze Entire Account
                      </button>
                    )}
                  </div>

                  {/* Granular Permission Toggles */}
                  <div style={{ background: '#181a22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Granular Capability Toggles
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      {/* Trading Toggle */}
                      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.06)', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Spot & Futures Trading</div>
                          <div style={{ fontSize: '11px', color: selectedUser.trading_enabled !== false ? '#34d399' : '#f87171' }}>{selectedUser.trading_enabled !== false ? 'Active' : 'Disabled'}</div>
                        </div>
                        <button
                          onClick={() => executeUserAction(selectedUser.trading_enabled !== false ? 'disable-trading' : 'enable-trading', 'Toggle Trading')}
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: selectedUser.trading_enabled !== false ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: selectedUser.trading_enabled !== false ? '#f87171' : '#34d399' }}
                        >
                          {selectedUser.trading_enabled !== false ? 'Disable' : 'Enable'}
                        </button>
                      </div>

                      {/* Withdrawals Toggle */}
                      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.06)', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Withdrawals</div>
                          <div style={{ fontSize: '11px', color: selectedUser.withdrawals_enabled !== false ? '#34d399' : '#f87171' }}>{selectedUser.withdrawals_enabled !== false ? 'Active' : 'Disabled'}</div>
                        </div>
                        <button
                          onClick={() => executeUserAction(selectedUser.withdrawals_enabled !== false ? 'disable-withdrawals' : 'enable-withdrawals', 'Toggle Withdrawals')}
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: selectedUser.withdrawals_enabled !== false ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: selectedUser.withdrawals_enabled !== false ? '#f87171' : '#34d399' }}
                        >
                          {selectedUser.withdrawals_enabled !== false ? 'Disable' : 'Enable'}
                        </button>
                      </div>

                      {/* Deposits Toggle */}
                      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.06)', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Deposits</div>
                          <div style={{ fontSize: '11px', color: selectedUser.deposits_enabled !== false ? '#34d399' : '#f87171' }}>{selectedUser.deposits_enabled !== false ? 'Active' : 'Disabled'}</div>
                        </div>
                        <button
                          onClick={() => executeUserAction(selectedUser.deposits_enabled !== false ? 'disable-deposits' : 'enable-deposits', 'Toggle Deposits')}
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: selectedUser.deposits_enabled !== false ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: selectedUser.deposits_enabled !== false ? '#f87171' : '#34d399' }}
                        >
                          {selectedUser.deposits_enabled !== false ? 'Disable' : 'Enable'}
                        </button>
                      </div>

                      {/* Custodial Wallet Toggle */}
                      <div style={{ background: '#13151c', border: '1px solid rgba(255,255,255,0.06)', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Custodial Wallet Access</div>
                          <div style={{ fontSize: '11px', color: selectedUser.is_wallet_enabled ? '#34d399' : '#f87171' }}>{selectedUser.is_wallet_enabled ? 'Active' : 'Disabled'}</div>
                        </div>
                        <button
                          onClick={() => executeUserAction(selectedUser.is_wallet_enabled ? 'wallet_disable' : 'wallet_enable', 'Toggle Wallet Access')}
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: selectedUser.is_wallet_enabled ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: selectedUser.is_wallet_enabled ? '#f87171' : '#34d399' }}
                        >
                          {selectedUser.is_wallet_enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security & KYC Overrides */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {/* KYC Tier Override */}
                    <div style={{ background: '#181a22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Manual KYC Level Override
                      </h3>
                      <form onSubmit={handleKycOverride} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Verification Status</label>
                          <select
                            value={newKycStatus}
                            onChange={(e) => setNewKycStatus(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                          >
                            <option value="VERIFIED">VERIFIED (Approved)</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="PENDING">PENDING (Under Review)</option>
                            <option value="UNVERIFIED">UNVERIFIED (Not Submitted)</option>
                            <option value="REJECTED">REJECTED (Declined)</option>
                            <option value="RESUBMIT">RESUBMIT (Info Needed)</option>
                            <option value="ON_HOLD">ON_HOLD</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>KYC Tier Bracket</label>
                          <select
                            value={newKycTier}
                            onChange={(e) => setNewKycTier(parseInt(e.target.value, 10))}
                            style={{ width: '100%', padding: '8px 12px', background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                          >
                            <option value={0}>Tier 0 (Unverified / Restricted)</option>
                            <option value={1}>Tier 1 (Basic Identity Verified)</option>
                            <option value={2}>Tier 2 (Full Enhanced Due Diligence)</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={actionLoading}
                          style={{ padding: '8px 16px', background: '#4d77f0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}
                        >
                          Apply KYC Override
                        </button>
                      </form>
                    </div>

                    {/* Security Authentication Overrides */}
                    <div style={{ background: '#181a22', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Security & Authenticator Actions
                        </h3>
                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                          Reset lost 2FA Google Authenticator devices, or manage government ID verification overrides directly.
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                          onClick={() => executeUserAction('reset-2fa', 'Reset 2FA Authenticator')}
                          style={{ padding: '10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', color: '#fbbf24', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Reset User Two-Factor (2FA)
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => executeUserAction(selectedUser.is_id_verified ? 'id_unverify' : 'id_verify', 'Toggle ID Verification')}
                            style={{ flex: 1, padding: '8px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {selectedUser.is_id_verified ? 'Revoke Gov ID Verify' : 'Mark Gov ID Verified'}
                          </button>
                          <button
                            onClick={() => executeUserAction(selectedUser.is_active ? 'deactivate' : 'activate', 'Toggle Active Status')}
                            style={{ flex: 1, padding: '8px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTODIAL WALLETS */}
              {activeTab === 'wallets' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                      Assigned on-chain deposit addresses and custodial wallets across blockchains.
                    </div>
                    <button
                      onClick={() => fetchUserWallets(selectedUser.id)}
                      style={{ padding: '6px 12px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>

                  {walletsLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading wallets...</div>
                  ) : userWallets.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: '#181a22', borderRadius: '8px' }}>
                      No custodial wallets provisioned yet.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Blockchain Network</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Address</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Type</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userWallets.map((w) => {
                            const isWalletActive = (w.status || '').toUpperCase() === 'ACTIVE' || w.is_active === true;
                            const net = getBlockchainNetwork(w, w.address);
                            const walletType = w.wallet_type ? (
                              w.wallet_type.toLowerCase() === 'deposit' ? 'On-Chain Deposit' :
                              w.wallet_type.toLowerCase() === 'custodial' ? 'Custodial Vault' :
                              w.wallet_type.toUpperCase()
                            ) : 'Custodial Deposit';

                            return (
                              <tr key={w.id || Math.random()} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: net.bg, color: net.color, fontWeight: 700, fontSize: '11px', letterSpacing: '0.04em' }}>
                                      {net.symbol}
                                    </span>
                                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                                      {net.name}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#e2e8f0' }}>
                                      {w.address || 'Pending HD Derivation'}
                                    </span>
                                    {w.address && (
                                      <button onClick={() => copyToClipboard(w.address)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                                        <Copy size={12} />
                                      </button>
                                    )}
                                  </div>
                                  {w.tag && (
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                                      Tag/Memo: {w.tag}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                  {walletType}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, background: isWalletActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isWalletActive ? '#34d399' : '#f87171' }}>
                                    {w.status || (isWalletActive ? 'ACTIVE' : 'SUSPENDED')}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleWalletStatus(w.id, isWalletActive ? 'suspend' : 'reactivate')}
                                    style={{ padding: '4px 10px', borderRadius: '4px', background: isWalletActive ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: '1px solid rgba(255,255,255,0.1)', color: isWalletActive ? '#f87171' : '#34d399', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    {isWalletActive ? 'Suspend' : 'Reactivate'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PORTFOLIO BALANCES */}
              {activeTab === 'portfolio' && (
                <div>
                  {/* Portfolio Sub-Category Filter Pills */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'All Portfolio Tokens', value: 'ALL' },
                      { label: 'Spot Account', value: 'SPOT' },
                      { label: 'Funding / Custodial', value: 'FUNDING' },
                      { label: 'Futures Margin', value: 'FUTURES' },
                      { label: 'Cross/Isolated Margin', value: 'MARGIN' },
                    ].map((pill) => (
                      <button
                        key={pill.label}
                        onClick={() => setPortfolioCategory(pill.value)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: portfolioCategory === pill.value ? '#4d77f0' : 'rgba(255,255,255,0.06)',
                          color: portfolioCategory === pill.value ? '#fff' : 'rgba(255,255,255,0.7)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Search token symbol or name..."
                        value={portfolioSearch}
                        onChange={(e) => setPortfolioSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            fetchUserPortfolio(selectedUser.id, portfolioSearch);
                          }
                        }}
                        style={{ padding: '8px 12px', background: '#181a22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '13px', width: '280px' }}
                      />
                      <button
                        onClick={() => fetchUserPortfolio(selectedUser.id, portfolioSearch)}
                        style={{ padding: '8px 14px', background: '#4d77f0', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Filter
                      </button>
                    </div>
                    <button
                      onClick={() => fetchUserPortfolio(selectedUser.id, portfolioSearch)}
                      style={{ padding: '6px 12px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>

                  {portfolioLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading asset balances...</div>
                  ) : filteredPortfolio.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: '#181a22', borderRadius: '8px' }}>
                      No assets found in user portfolio matching current filter.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Asset</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Spot Balance</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Funding Balance</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Futures Margin</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>In Orders (Locked)</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'right' }}>Est. Value (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPortfolio.map((item, idx) => {
                            const spot = parseFloat(item.spot_balance || item.available || item.free || 0);
                            const funding = parseFloat(item.funding_balance || 0);
                            const futures = parseFloat(item.futures_balance || 0);
                            const locked = parseFloat(item.locked_balance || item.locked || item.in_orders || 0);
                            const total = spot + funding + futures + locked;
                            const price = parseFloat(item.current_price || item.price || 0);
                            const usdValue = item.usd_value ? parseFloat(item.usd_value) : (total * price);

                            return (
                              <tr key={item.symbol || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#fff', fontSize: '13px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', marginRight: '8px' }}>
                                    {item.symbol || item.currency || '—'}
                                  </span>
                                  {item.name || ''}
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '13px', color: '#34d399' }}>
                                  {item.spot_balance || item.available || item.free || '0.00'}
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '13px', color: '#60a5fa' }}>
                                  {item.funding_balance || '0.00'}
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '13px', color: '#a78bfa' }}>
                                  {item.futures_balance || '0.00'}
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '13px', color: '#fbbf24' }}>
                                  {item.locked_balance || item.locked || item.in_orders || '0.00'}
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '13px', textAlign: 'right', color: '#94a3b8' }}>
                                  ${usdValue ? usdValue.toFixed(2) : '0.00'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TRADE EXECUTIONS */}
              {activeTab === 'trades' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                      Historical filled orders and trade executions ({tradesTotal} records).
                    </div>
                    <button
                      onClick={() => fetchUserTrades(selectedUser.id, tradesPage)}
                      style={{ padding: '6px 12px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>

                  {tradesLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading trades...</div>
                  ) : userTrades.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: '#181a22', borderRadius: '8px' }}>
                      No trades found for this user.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Pair</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Side</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Price</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Quantity</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Fee</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'right' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userTrades.map((t) => {
                            const side = (t.side || t.Side || '').toLowerCase();
                            const isBuy = side === 'buy';
                            const date = t.CreatedAt || t.created_at;
                            return (
                              <tr key={t.ID || t.id || Math.random()} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#fff', fontSize: '13px' }}>
                                  {t.symbol || t.Symbol || '—'}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: isBuy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: isBuy ? '#34d399' : '#f87171' }}>
                                    {(t.side || t.Side || 'TRADE').toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '13px', color: '#e2e8f0' }}>
                                  {t.price || t.Price || '—'}
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '13px', color: '#fff' }}>
                                  {t.quantity || t.Quantity || '—'}
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#fbbf24' }}>
                                  {t.fee || t.Fee || '0'} {t.FeeAsset || t.fee_asset || ''}
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', textAlign: 'right' }}>
                                  {date ? new Date(date).toLocaleString() : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {tradesTotalPages > 1 && (
                        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181a22' }}>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            Page {tradesPage} of {tradesTotalPages}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              disabled={tradesPage <= 1}
                              onClick={() => setTradesPage((p) => Math.max(1, p - 1))}
                              style={{ padding: '4px 10px', borderRadius: '4px', background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', color: tradesPage <= 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: tradesPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '11px' }}
                            >
                              Prev
                            </button>
                            <button
                              disabled={tradesPage >= tradesTotalPages}
                              onClick={() => setTradesPage((p) => p + 1)}
                              style={{ padding: '4px 10px', borderRadius: '4px', background: '#13151c', border: '1px solid rgba(255,255,255,0.1)', color: tradesPage >= tradesTotalPages ? 'rgba(255,255,255,0.2)' : '#fff', cursor: tradesPage >= tradesTotalPages ? 'not-allowed' : 'pointer', fontSize: '11px' }}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: API KEYS */}
              {activeTab === 'apikeys' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                      Active programmatic API credentials provisioned by user.
                    </div>
                    {userApiKeys.length > 0 && (
                      <button
                        onClick={handleRevokeAllApiKeys}
                        style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Revoke All API Keys
                      </button>
                    )}
                  </div>

                  {apiKeysLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading keys...</div>
                  ) : userApiKeys.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: '#181a22', borderRadius: '8px' }}>
                      No API keys provisioned for this user.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Key ID / Label</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Permissions</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Created</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Last Used</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userApiKeys.map((k) => {
                            const keyId = k.id || k.ID || k.key_id;
                            const label = k.label || k.Label || 'API Key';
                            const perms = Array.isArray(k.permissions || k.Permissions) ? (k.permissions || k.Permissions).join(', ') : (k.permissions || 'Standard Access');
                            const isActive = k.is_active !== undefined ? k.is_active : (k.IsActive !== undefined ? k.IsActive : true);
                            const createdAt = k.CreatedAt || k.created_at;
                            const lastUsedAt = k.LastUsedAt || k.last_used_at;

                            return (
                              <tr key={keyId || Math.random()} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>{label}</div>
                                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>{keyId}</div>
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                  {perms}
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                  {createdAt ? new Date(createdAt).toLocaleDateString() : '—'}
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                  {lastUsedAt ? new Date(lastUsedAt).toLocaleString() : 'Never'}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isActive ? '#34d399' : '#f87171' }}>
                                    {isActive ? 'ACTIVE' : 'REVOKED'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  {isActive && (
                                    <button
                                      onClick={() => handleRevokeApiKey(keyId)}
                                      style={{ padding: '4px 10px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: LOGIN AUDIT LOGS */}
              {activeTab === 'logs' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                      Audit records of recent authentication events.
                    </div>
                    <button
                      onClick={() => fetchUserLoginLogs(selectedUser.id)}
                      style={{ padding: '6px 12px', background: '#1c1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>

                  {logsLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading logs...</div>
                  ) : userLoginLogs.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: '#181a22', borderRadius: '8px' }}>
                      No sign-in history recorded.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#181a22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Timestamp</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>IP Address</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Location</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Device / Client</th>
                            <th style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userLoginLogs.map((l, idx) => {
                            const date = l.LoginAt || l.login_at || l.created_at || l.timestamp;
                            const ip = l.IP || l.ip || l.ip_address || '—';
                            const loc = l.Location || l.location || '—';
                            const device = l.Device || l.device || l.user_agent || 'Client Session';
                            const isSuccess = l.Success !== undefined ? l.Success : (l.success !== undefined ? l.success : true);

                            return (
                              <tr key={l.ID || l.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#fff' }}>
                                  {date ? new Date(date).toLocaleString() : '—'}
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#818cf8' }}>
                                  {ip}
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#cbd5e1' }}>
                                  {loc}
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                  {device}
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    background: isSuccess ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                    color: isSuccess ? '#34d399' : '#f87171',
                                  }}>
                                    {isSuccess ? 'SUCCESS' : 'FAILED'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 7: Preferences & Settings */}
              {activeTab === 'settings' && (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sliders size={18} style={{ color: '#818cf8' }} /> User Account Preferences & Notification Settings
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                        Manage user localization, security whitelisting, notification rules, and trading fee deduction settings.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => fetchUserSettings(selectedUser.id)}
                        disabled={settingsLoading}
                        style={{
                          background: '#1f222e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '7px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <RefreshCw size={14} className={settingsLoading ? "animate-spin" : ""} /> Refresh
                      </button>
                      <button
                        onClick={handleUpdateSettings}
                        disabled={savingSettings || settingsLoading || !userSettings}
                        style={{
                          background: '#6366f1',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '7px 16px',
                          cursor: savingSettings ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          opacity: savingSettings ? 0.7 : 1,
                        }}
                      >
                        <Save size={14} /> {savingSettings ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>

                  {settingsLoading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      Loading preferences...
                    </div>
                  ) : !userSettings ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: '#181a22', borderRadius: '8px' }}>
                      No settings record found for this user.
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Grid 1: General & Localization */}
                      <div style={{ background: '#181a22', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sliders size={16} style={{ color: '#818cf8' }} /> Localization & Security Preferences
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Timezone
                            </label>
                            <input
                              type="text"
                              value={userSettings.timezone || ''}
                              onChange={(e) => setUserSettings({ ...userSettings, timezone: e.target.value })}
                              placeholder="e.g. UTC, America/New_York"
                              style={{
                                width: '100%',
                                background: '#12141a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#fff',
                                fontSize: '13px',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Language
                            </label>
                            <input
                              type="text"
                              value={userSettings.language || ''}
                              onChange={(e) => setUserSettings({ ...userSettings, language: e.target.value })}
                              placeholder="e.g. en, fr, es"
                              style={{
                                width: '100%',
                                background: '#12141a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#fff',
                                fontSize: '13px',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Anti-Phishing Code
                            </label>
                            <input
                              type="text"
                              value={userSettings.antiPhishingCode || ''}
                              onChange={(e) => setUserSettings({ ...userSettings, antiPhishingCode: e.target.value })}
                              placeholder="Custom code"
                              style={{
                                width: '100%',
                                background: '#12141a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#fff',
                                fontSize: '13px',
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1' }}>
                            <input
                              type="checkbox"
                              checked={!!userSettings.withdrawalWhitelist}
                              onChange={(e) => setUserSettings({ ...userSettings, withdrawalWhitelist: e.target.checked })}
                              style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                            />
                            Withdrawal Address Whitelist Active
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1' }}>
                            <input
                              type="checkbox"
                              checked={!!userSettings.chartColor}
                              onChange={(e) => setUserSettings({ ...userSettings, chartColor: e.target.checked })}
                              style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                            />
                            Alternative Chart Colors (Green Up / Red Down)
                          </label>
                        </div>
                      </div>

                      {/* Grid 2: Notifications & Reminders */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                        {/* Notification Preferences */}
                        <div style={{ background: '#181a22', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
                          <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bell size={16} style={{ color: '#38bdf8' }} /> Notifications
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                              { key: 'tradeNotification', label: 'Trade Notification Alerts' },
                              { key: 'activities', label: 'Account Activities' },
                              { key: 'news', label: 'Product & Market News' },
                              { key: 'systemMessages', label: 'System & Security Messages' },
                            ].map((item) => (
                              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={!!userSettings.notificationPreference?.[item.key]}
                                  onChange={(e) => setUserSettings({
                                    ...userSettings,
                                    notificationPreference: {
                                      ...(userSettings.notificationPreference || {}),
                                      [item.key]: e.target.checked,
                                    },
                                  })}
                                  style={{ cursor: 'pointer', accentColor: '#38bdf8' }}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Trade Orders Notification Reminders */}
                        <div style={{ background: '#181a22', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
                          <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} style={{ color: '#fbbf24' }} /> Order Reminders
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                              { key: 'limitOrder', label: 'Limit Order Execution Reminders' },
                              { key: 'marketOrder', label: 'Market Order Filled Reminders' },
                              { key: 'stopOrder', label: 'Stop-Loss / Take-Profit Trigger Reminders' },
                              { key: 'autoBorrowRepayMargin', label: 'Auto-Borrow / Repay Margin Alerts' },
                            ].map((item) => (
                              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={!!userSettings.tradeOrdersNotificationReminder?.[item.key]}
                                  onChange={(e) => setUserSettings({
                                    ...userSettings,
                                    tradeOrdersNotificationReminder: {
                                      ...(userSettings.tradeOrdersNotificationReminder || {}),
                                      [item.key]: e.target.checked,
                                    },
                                  })}
                                  style={{ cursor: 'pointer', accentColor: '#fbbf24' }}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Transaction Sound & Real-time Alerts */}
                        <div style={{ background: '#181a22', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
                          <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bell size={16} style={{ color: '#a855f7' }} /> Execution Sounds & Alerts
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                              { key: 'spotTradingNotification', label: 'Spot Trading Push Notification' },
                              { key: 'spotNotificationSound', label: 'Spot Execution Sound Effect' },
                              { key: 'futuresTradingNotification', label: 'Futures Trading Push Notification' },
                              { key: 'futuresNotificationSound', label: 'Futures Execution Sound Effect' },
                            ].map((item) => (
                              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={!!userSettings.transactionNotifications?.[item.key]}
                                  onChange={(e) => setUserSettings({
                                    ...userSettings,
                                    transactionNotifications: {
                                      ...(userSettings.transactionNotifications || {}),
                                      [item.key]: e.target.checked,
                                    },
                                  })}
                                  style={{ cursor: 'pointer', accentColor: '#a855f7' }}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Trade Fee Deduction Options */}
                        <div style={{ background: '#181a22', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
                          <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={16} style={{ color: '#34d399' }} /> Fee Deductions (BNB Discount)
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                              { key: 'useBNBToPayFees', label: 'Use BNB to Pay Spot Fees (25% discount)' },
                              { key: 'useBNBToPayMarginFees', label: 'Use BNB for Margin Interest Fees' },
                              { key: 'useBNBToPayFuturesFees', label: 'Use BNB for Futures Trading Fees (10% discount)' },
                            ].map((item) => (
                              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={!!userSettings.tradeFeeDeductions?.[item.key]}
                                  onChange={(e) => setUserSettings({
                                    ...userSettings,
                                    tradeFeeDeductions: {
                                      ...(userSettings.tradeFeeDeductions || {}),
                                      [item.key]: e.target.checked,
                                    },
                                  })}
                                  style={{ cursor: 'pointer', accentColor: '#34d399' }}
                                />
                                {item.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button
                          type="submit"
                          disabled={savingSettings}
                          style={{
                            background: '#6366f1',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '10px 24px',
                            cursor: savingSettings ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                        >
                          <Save size={16} /> {savingSettings ? 'Saving...' : 'Save Preferences'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
      </div>
    </div>
  );
}
