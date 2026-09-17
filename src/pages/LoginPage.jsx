import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your operator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-badge">
            <span className="status-dot"></span>
            Limiance Protocol • Core Ops
          </div>
          <img src="/logo.png" alt="Limiance" className="logo-icon" />
          <h1>Admin Console</h1>
          <p>Sign in to access privileged exchange operations</p>
        </div>

        {error && (
          <div className="login-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="form-group">
            <label>OPERATOR EMAIL</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="operator@limiance.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>PASSWORD</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span>Authenticating...</span>
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="login-footer-note">
          Restricted access. All actions are cryptographically signed and permanently recorded in the immutable audit ledger.
        </div>
      </div>
    </div>
  );
}
