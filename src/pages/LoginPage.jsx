import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, fetchSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.status === 'mfa_required') {
        setMfaToken(res.mfa_token);
      } else {
        navigate(location.state?.from || '/');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/v1/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mfa_token: mfaToken, code: totpCode })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      
      await fetchSession(); // Loads the user and roles
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="Limiance Logo" className="logo-icon" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <h1>Limiance Ops</h1>
          <p>Internal Operations Console</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        {!mfaToken ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label>Staff Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="staff@limiance.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotpSubmit} className="login-form">
            <div className="form-group">
              <label>Authenticator Code</label>
              <input 
                type="text" 
                value={totpCode} 
                onChange={e => setTotpCode(e.target.value)} 
                required 
                placeholder="000000"
                maxLength={6}
                pattern="\d{6}"
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
            <button type="button" className="text-btn" onClick={() => setMfaToken('')}>
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
