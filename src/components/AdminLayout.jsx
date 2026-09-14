import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Settings, LogOut, ArrowRightLeft, Landmark, FileText, Activity } from 'lucide-react';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Limiance Logo" className="logo-icon" style={{ height: '32px', objectFit: 'contain' }} />
          <h2>Limiance Ops</h2>
        </div>
        <div className="user-info">
          <div className="user-email">{user?.email}</div>
          <div className="user-roles">
            {roles.length > 0 ? roles.join(', ') : 'No roles assigned'}
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Activity size={18} /> Dashboard
          </NavLink>
          <div className="nav-section-title">Operations</div>
          <NavLink to="/kyc-queue" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Users size={18} /> KYC Queue
          </NavLink>
          <NavLink to="/deposits-queue" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Landmark size={18} /> Deposit Exceptions
          </NavLink>
          <NavLink to="/withdrawals-queue" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <ArrowRightLeft size={18} /> Withdrawals Queue
          </NavLink>
          <div className="nav-section-title">Configuration</div>
          <NavLink to="/policies" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Settings size={18} /> Policies & Controls
          </NavLink>
          <NavLink to="/roles" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <ShieldAlert size={18} /> Role Management
          </NavLink>
          <div className="nav-section-title">Audit</div>
          <NavLink to="/audit" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <FileText size={18} /> Audit & Reconcile
          </NavLink>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <h1>Limiance Internal Console</h1>
          <div className="env-badge">Production Environment</div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
