import React, { useState } from 'react';
import { showSuccess, showError } from '../utils/notifications';
import './AuthModal.css';

export default function AuthModal({ onLogin, onRegister, onClose, canClose = true }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin({ username, password });
      } else {
        // Email is optional for registration
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
              <label>Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              minLength={4}
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={loading || !username || !password}
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

