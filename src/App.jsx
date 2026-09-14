import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
// Stubs for future pages
import DashboardPage from './pages/DashboardPage';
import RolesPage from './pages/RolesPage';
import PoliciesPage from './pages/PoliciesPage';
import KycQueuePage from './pages/KycQueuePage';
import DepositsQueuePage from './pages/DepositsQueuePage';
import WithdrawalsQueuePage from './pages/WithdrawalsQueuePage';
import AuditPage from './pages/AuditPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="kyc-queue" element={<ProtectedRoute requiredRoles={['compliance']}><KycQueuePage /></ProtectedRoute>} />
            <Route path="deposits-queue" element={<ProtectedRoute requiredRoles={['compliance', 'treasury_operator']}><DepositsQueuePage /></ProtectedRoute>} />
            <Route path="withdrawals-queue" element={<ProtectedRoute requiredRoles={['compliance', 'treasury_operator', 'treasury_approver']}><WithdrawalsQueuePage /></ProtectedRoute>} />
            <Route path="policies" element={<ProtectedRoute requiredRoles={['platform_administrator']}><PoliciesPage /></ProtectedRoute>} />
            <Route path="roles" element={<ProtectedRoute requiredRoles={['platform_administrator']}><RolesPage /></ProtectedRoute>} />
            <Route path="audit" element={<ProtectedRoute requiredRoles={['auditor', 'platform_administrator']}><AuditPage /></ProtectedRoute>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
