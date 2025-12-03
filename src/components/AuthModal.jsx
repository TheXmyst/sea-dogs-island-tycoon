import React, { useState, useEffect, useRef, useCallback } from 'react';
import { showSuccess, showError } from '../utils/notifications';
import { useTranslation } from '../i18n/LanguageContext';
import './AuthModal.css';

export default function AuthModal({ onLogin, onRegister, onClose, canClose = true }) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const audioRef = useRef(null);

  // Fonction pour démarrer la musique
  const startMusic = useCallback(() => {
    if (audioRef.current && !musicStarted) {
      audioRef.current.play().then(() => {
        setMusicStarted(true);
        console.log('Musique démarrée avec succès');
      }).catch(error => {
        console.log('Erreur lors du démarrage de la musique:', error);
      });
    }
  }, [musicStarted]);

  // Démarrer la musique en boucle quand le composant se monte
  useEffect(() => {
    // Essayer de démarrer immédiatement
    const timer = setTimeout(() => {
      startMusic();
    }, 100);

    // Démarrer la musique au premier clic/interaction
    const handleUserInteraction = () => {
      startMusic();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    // Arrêter la musique quand le composant se démonte
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [startMusic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin({ username, password });
      } else {
        // Validate password confirmation
        if (password !== confirmPassword) {
          showError(t('auth.passwordsDoNotMatch'));
          setLoading(false);
          return;
        }
        // Email is now required for registration
        if (!email || email.trim().length === 0) {
          showError(t('auth.emailRequired'));
          setLoading(false);
          return;
        }
        await onRegister({ username, password, email });
      }
    } catch (error) {
      // Show more detailed error message
      const errorMessage = error.message || t('auth.authenticationFailed');
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Cannot connect')) {
        const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost';
        if (isProd) {
          showError(t('auth.cannotConnectProduction'));
        } else {
          showError(t('auth.cannotConnect'));
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
      <audio
        ref={audioRef}
        src="/music/title.mp3"
        loop
        preload="auto"
        volume={0.7}
        onLoadedData={() => {
          console.log('Fichier audio chargé:', audioRef.current?.src);
          // Essayer de démarrer après le chargement
          if (!musicStarted) {
            startMusic();
          }
        }}
        onError={(e) => {
          console.error('Erreur de chargement audio:', e);
        }}
      />
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {canClose && <button className="auth-modal-close" onClick={onClose}>×</button>}
        
        <h2>{isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>{t('auth.username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              placeholder={t('auth.enterUsername')}
            />
          </div>

          {!isLogin && (
            <div className="auth-form-group">
              <label>{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('auth.enterEmail')}
              />
            </div>
          )}

          <div className="auth-form-group">
            <label>{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder={t('auth.enterPassword')}
            />
          </div>

          {!isLogin && (
            <div className="auth-form-group">
              <label>{t('auth.confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder={t('auth.confirmPassword')}
              />
              {confirmPassword && password !== confirmPassword && (
                <span className="auth-error-text" style={{ color: '#ff4444', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
                  {t('auth.passwordsDoNotMatch')}
                </span>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-button"
            disabled={loading || !username || !password || (!isLogin && (!email || password !== confirmPassword))}
          >
            {loading ? t('common.loading') : (isLogin ? t('auth.login') : t('auth.register'))}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
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
              {isLogin ? t('auth.register') : t('auth.login')}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

