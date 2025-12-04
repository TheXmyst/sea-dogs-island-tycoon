import React, { useState, useEffect, useRef } from 'react';
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
  const audioRef = useRef(null);
  const hasStartedMusicRef = useRef(false);

  // Démarrer la musique au premier clic/interaction sur toute la page
  const startMusic = () => {
    if (hasStartedMusicRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    
    hasStartedMusicRef.current = true;
    audio.volume = 0.7;
    audio.loop = true;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Erreur lecture musique:', error);
        hasStartedMusicRef.current = false; // Réessayer au prochain clic
      });
    }
  };

  // Démarrer la musique automatiquement ou au premier clic/interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Configurer la musique
    audio.volume = 0.7;
    audio.loop = true;
    
    // Essayer de jouer automatiquement
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        hasStartedMusicRef.current = true;
      }).catch(error => {
        // La lecture automatique a été bloquée, démarrer au premier clic/interaction
        console.log('Lecture automatique bloquée, attente interaction:', error);
        
        // Écouter les interactions sur toute la page (pas seulement le modal)
        const handleInteraction = () => {
          startMusic();
          // Retirer les listeners après le premier démarrage
          document.removeEventListener('click', handleInteraction);
          document.removeEventListener('mousemove', handleInteraction);
          document.removeEventListener('keydown', handleInteraction);
          document.removeEventListener('touchstart', handleInteraction);
        };
        
        document.addEventListener('click', handleInteraction, { once: true });
        document.addEventListener('mousemove', handleInteraction, { once: true });
        document.addEventListener('keydown', handleInteraction, { once: true });
        document.addEventListener('touchstart', handleInteraction, { once: true });
      });
    }
    
    // Arrêter la musique quand le composant se démonte
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

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
    <div className={`auth-modal-overlay ${!isLogin ? 'auth-modal-register' : ''}`} onClick={canClose ? onClose : undefined}>
      <audio
        ref={audioRef}
        src="/music/title.mp3"
        preload="auto"
        loop
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

