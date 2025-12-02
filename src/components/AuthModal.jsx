import React, { useState } from 'react';
import { showSuccess, showError } from '../utils/notifications';
import './AuthModal.css';

export default function AuthModal({ onLogin, onRegister, onClose, canClose = true }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin({ username, password });
      } else {
        // Validate password confirmation
        if (password !== confirmPassword) {
          showError('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }
        // Email is now required for registration
        if (!email || email.trim().length === 0) {
          showError('L\'email est obligatoire');
          setLoading(false);
          return;
        }
        await onRegister({ username, password, email });
      }
    } catch (error) {
      // Show more detailed error message
      const errorMessage = error.message || 'Authentication failed';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Cannot connect')) {
        const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';
        if (isProd) {
          showError('Cannot connect to backend server. Please check that VITE_API_URL is configured in Vercel and backend is deployed on Railway.');
        } else {
          showError('Cannot connect to server. Please make sure the backend is running: cd backend && npm run dev');
        }
      } else {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={canClose ? onClose : undefined}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {canClose && <button className="auth-modal-close" onClick={onClose}>×</button>}
        
        <h2>{isLogin ? '🏴‍☠️ Login' : '🏴‍☠️ Register'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              placeholder="Enter your username"
            />
          </div>

          {!isLogin && (
            <div className="auth-form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>
          )}

          <div className="auth-form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div className="auth-form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Confirm your password"
              />
              {confirmPassword && password !== confirmPassword && (
                <span className="auth-error-text" style={{ color: '#ff4444', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                  Les mots de passe ne correspondent pas
                </span>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={loading || !username || !password || (!isLogin && (!email || password !== confirmPassword))}
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              className="auth-switch-button"
              onClick={() => {
                setIsLogin(!isLogin);
                setUsername('');
                setPassword('');
                setConfirmPassword('');
                setEmail('');
              }}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

