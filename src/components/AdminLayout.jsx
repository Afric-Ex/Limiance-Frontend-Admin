import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Users,
  TrendingUp,
  ArrowRightLeft,
  Award,
  ChevronDown,
  Coins,
  UserCheck,
  BarChart3,
  LogOut,
  Shield,
} from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, roles, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible dropdown states
  const [openDropdowns, setOpenDropdowns] = useState({
    markets: true,
    transactions: true,
    financialRules: true,
    derivativesRisk: true,
    analytics: true,
    complianceSupport: true,
    staffAdmin: true,
  });

  const toggleDropdown = (key) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentEnv = (import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development').toLowerCase();
  const getEnvBadge = () => {
    if (currentEnv === 'production' || currentEnv === 'prod') {
      return { label: 'Live Mainnet Ops', className: 'env-badge prod' };
    }
    if (currentEnv === 'staging' || currentEnv === 'testnet') {
      return { label: 'Staging Testnet', className: 'env-badge staging' };
    }
    return { label: 'Dev Sandbox', className: 'env-badge dev' };
  };
  const envBadge = getEnvBadge();

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img
            src="/logo.png"
            alt="Limiance Logo"
            className="logo-icon"
            style={{ height: '32px', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h4>Admin</h4>
        </div>


        <nav className="sidebar-nav">
          {/* 1. DASHBOARD */}
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <Activity size={18} /> Dashboard
          </NavLink>

          {/* 2. USERS (360 Console) */}
          {(hasRole('support') || hasRole('superadmin')) && (
            <NavLink to="/users" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Users size={18} /> User Accounts
            </NavLink>
          )}

          {/* 3. MARKETS (Dropdown) */}
          {(hasRole('config_admin') || hasRole('support') || hasRole('superadmin')) && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-header ${location.pathname.startsWith('/markets') || location.pathname.startsWith('/tokens') || location.pathname.startsWith('/pairs') || location.pathname.startsWith('/networks') ? 'active' : ''}`}
                onClick={() => toggleDropdown('markets')}
              >
                <div className="nav-group-title">
                  <Coins size={18} /> Markets & Listings
                </div>
                <ChevronDown size={14} className={`nav-group-chevron ${openDropdowns.markets ? 'open' : ''}`} />
              </button>
              {openDropdowns.markets && (
                <div className="nav-sub-items">
                  <NavLink to="/markets/overview" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Overview
                  </NavLink>
                  <NavLink to="/markets/orderbook" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Orderbook
                  </NavLink>
                  <NavLink to="/tokens" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Tokens & Contracts
                  </NavLink>
                  <NavLink to="/pairs" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Trading Pairs
                  </NavLink>
                  <NavLink to="/networks" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Networks & RPCs
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* 4. TRANSACTIONS & TREASURY (Dropdown) */}
          {(hasRole('support') || hasRole('superadmin')) && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-header ${location.pathname.startsWith('/treasury') || location.pathname.startsWith('/transactions') || location.pathname.startsWith('/onchain-transactions') || location.pathname.startsWith('/deposits-queue') || location.pathname.startsWith('/withdrawals-queue') || location.pathname.startsWith('/wallets') ? 'active' : ''}`}
                onClick={() => toggleDropdown('transactions')}
              >
                <div className="nav-group-title">
                  <ArrowRightLeft size={18} /> Transactions & Treasury
                </div>
                <ChevronDown size={14} className={`nav-group-chevron ${openDropdowns.transactions ? 'open' : ''}`} />
              </button>
              {openDropdowns.transactions && (
                <div className="nav-sub-items">
                  <NavLink to="/treasury" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Treasury & Reserves
                  </NavLink>
                  <NavLink to="/transactions" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Transactions Ledger
                  </NavLink>
                  <NavLink to="/onchain-transactions" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    On-chain Transactions
                  </NavLink>
                  <NavLink to="/deposits-queue" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Deposits Ledger
                  </NavLink>
                  <NavLink to="/withdrawals-queue" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Withdrawals Queue
                  </NavLink>
                  <NavLink to="/wallets" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Custodial Wallets
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* 5. FINANCIAL RULES (Dropdown) */}
          {(hasRole('config_admin') || hasRole('superadmin')) && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-header ${location.pathname.startsWith('/fee-tiers') || location.pathname.startsWith('/withdrawal-rules') ? 'active' : ''}`}
                onClick={() => toggleDropdown('financialRules')}
              >
                <div className="nav-group-title">
                  <Award size={18} /> Financial Rules
                </div>
                <ChevronDown size={14} className={`nav-group-chevron ${openDropdowns.financialRules ? 'open' : ''}`} />
              </button>
              {openDropdowns.financialRules && (
                <div className="nav-sub-items">
                  <NavLink to="/fee-tiers" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Fee Tiers & Limits
                  </NavLink>
                  <NavLink to="/withdrawal-rules" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Withdrawal Rules
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* 6. DERIVATIVES & RISK (Dropdown) */}
          {(hasRole('config_admin') || hasRole('superadmin') || hasRole('risk')) && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-header ${location.pathname.startsWith('/derivatives') || location.pathname.startsWith('/policies') ? 'active' : ''}`}
                onClick={() => toggleDropdown('derivativesRisk')}
              >
                <div className="nav-group-title">
                  <TrendingUp size={18} /> Derivatives & Risk
                </div>
                <ChevronDown size={14} className={`nav-group-chevron ${openDropdowns.derivativesRisk ? 'open' : ''}`} />
              </button>
              {openDropdowns.derivativesRisk && (
                <div className="nav-sub-items">
                  <NavLink to="/derivatives" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Futures & Margin Specs
                  </NavLink>
                  <NavLink to="/policies" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Emergency Controls
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* 7. ANALYTICS & REPORTS (Dropdown) */}
          {(hasRole('support') || hasRole('superadmin')) && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-header ${location.pathname.startsWith('/orders') || location.pathname.startsWith('/reports') ? 'active' : ''}`}
                onClick={() => toggleDropdown('analytics')}
              >
                <div className="nav-group-title">
                  <BarChart3 size={18} /> Analytics & Reports
                </div>
                <ChevronDown size={14} className={`nav-group-chevron ${openDropdowns.analytics ? 'open' : ''}`} />
              </button>
              {openDropdowns.analytics && (
                <div className="nav-sub-items">
                  <NavLink to="/orders" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Orders Explorer
                  </NavLink>
                  <NavLink to="/reports" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Financial Reports
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* 8. COMPLIANCE & SUPPORT (Dropdown) */}
          {(hasRole('support') || hasRole('superadmin')) && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-header ${location.pathname.startsWith('/kyc-queue') || location.pathname.startsWith('/support-tickets') ? 'active' : ''}`}
                onClick={() => toggleDropdown('complianceSupport')}
              >
                <div className="nav-group-title">
                  <UserCheck size={18} /> Compliance & Support
                </div>
                <ChevronDown size={14} className={`nav-group-chevron ${openDropdowns.complianceSupport ? 'open' : ''}`} />
              </button>
              {openDropdowns.complianceSupport && (
                <div className="nav-sub-items">
                  <NavLink to="/kyc-queue" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    KYC Queue
                  </NavLink>
                  <NavLink to="/support-tickets" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Support Tickets
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* 9. STAFF ADMINISTRATION (Dropdown) */}
          {(hasRole('superadmin') || hasRole('support')) && (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-group-header ${location.pathname.startsWith('/roles') || location.pathname.startsWith('/audit') ? 'active' : ''}`}
                onClick={() => toggleDropdown('staffAdmin')}
              >
                <div className="nav-group-title">
                  <Shield size={18} /> Staff Administration
                </div>
                <ChevronDown size={14} className={`nav-group-chevron ${openDropdowns.staffAdmin ? 'open' : ''}`} />
              </button>
              {openDropdowns.staffAdmin && (
                <div className="nav-sub-items">
                  {hasRole('superadmin') && (
                    <NavLink to="/roles" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                      Operator Accounts
                    </NavLink>
                  )}
                  <NavLink to="/audit" className={({ isActive }) => (isActive ? 'nav-sub-item active' : 'nav-sub-item')}>
                    Audit Logs
                  </NavLink>
                </div>
              )}
            </div>
          )}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
         
            <div className="user-email">{user?.email}</div>
            <div className="user-roles">
              {roles.length > 0 ? roles.join(', ') : 'Operator'}
            </div>
        
          <div className={envBadge.className}>{envBadge.label}</div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
