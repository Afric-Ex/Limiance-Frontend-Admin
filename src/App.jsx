import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RolesPage from './pages/RolesPage';
import PoliciesPage from './pages/PoliciesPage';
import KycQueuePage from './pages/KycQueuePage';
import KycDetailPage from './pages/KycDetailPage';
import DepositsQueuePage from './pages/DepositsQueuePage';
import DepositDetailPage from './pages/DepositDetailPage';
import WithdrawalsQueuePage from './pages/WithdrawalsQueuePage';
import WithdrawalDetailPage from './pages/WithdrawalDetailPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import WalletsPage from './pages/WalletsPage';
import TransactionsPage from './pages/TransactionsPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import SupportTicketsPage from './pages/SupportTicketsPage';
import SupportTicketDetailPage from './pages/SupportTicketDetailPage';
import TokensPage from './pages/TokensPage';
import PairsPage from './pages/PairsPage';
import NetworksPage from './pages/NetworksPage';
import FeeTiersPage from './pages/FeeTiersPage';
import WithdrawalRulesPage from './pages/WithdrawalRulesPage';
import DerivativesPage from './pages/DerivativesPage';
import OrdersPage from './pages/OrdersPage';
import ReportsPage from './pages/ReportsPage';
import AuditPage from './pages/AuditPage';
import MarketOverviewPage from './pages/MarketOverviewPage';
import OrderbookPage from './pages/OrderbookPage';

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            {/* Transactions & Treasury */}
            <Route
              path="transactions"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="transactions/:id"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <TransactionDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="kyc-queue"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <KycQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="kyc-queue/:id"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <KycDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="withdrawals-queue"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <WithdrawalsQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="withdrawals-queue/:id"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <WithdrawalDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="deposits-queue"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <DepositsQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="deposits-queue/:id"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <DepositDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="wallets"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <WalletsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="support-tickets"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <SupportTicketsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="support-tickets/:id"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <SupportTicketDetailPage />
                </ProtectedRoute>
              }
            />

            {/* User Accounts */}
            <Route
              path="users"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/:id"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <UserDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Markets & Listings */}
            <Route
              path="markets/overview"
              element={
                <ProtectedRoute requiredRoles={['config_admin', 'support', 'superadmin']}>
                  <MarketOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="markets/orderbook"
              element={
                <ProtectedRoute requiredRoles={['config_admin', 'support', 'superadmin']}>
                  <OrderbookPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="markets"
              element={<Navigate to="/markets/overview" replace />}
            />
            <Route
              path="tokens"
              element={
                <ProtectedRoute requiredRoles={['config_admin', 'superadmin']}>
                  <TokensPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="pairs"
              element={
                <ProtectedRoute requiredRoles={['config_admin', 'superadmin']}>
                  <PairsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="networks"
              element={
                <ProtectedRoute requiredRoles={['config_admin', 'superadmin']}>
                  <NetworksPage />
                </ProtectedRoute>
              }
            />

            {/* Financial Rules */}
            <Route
              path="fee-tiers"
              element={
                <ProtectedRoute requiredRoles={['config_admin', 'superadmin']}>
                  <FeeTiersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="withdrawal-rules"
              element={
                <ProtectedRoute requiredRoles={['config_admin', 'superadmin']}>
                  <WithdrawalRulesPage />
                </ProtectedRoute>
              }
            />

            {/* Derivatives & Risk */}
            <Route
              path="derivatives"
              element={
                <ProtectedRoute requiredRoles={['config_admin', 'risk', 'superadmin']}>
                  <DerivativesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="policies"
              element={
                <ProtectedRoute requiredRoles={['risk', 'superadmin']}>
                  <PoliciesPage />
                </ProtectedRoute>
              }
            />

            {/* Analytics */}
            <Route
              path="orders"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Staff Administration */}
            <Route
              path="roles"
              element={
                <ProtectedRoute requiredRoles={['superadmin']}>
                  <RolesPage />
                </ProtectedRoute>
              }
            />

            {/* Audit Trail */}
            <Route
              path="audit"
              element={
                <ProtectedRoute requiredRoles={['support', 'superadmin']}>
                  <AuditPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
