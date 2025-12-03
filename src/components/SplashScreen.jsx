import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Animation de progression
    const duration = 2000; // 2 secondes
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);
      
      if (newProgress >= 50) {
        setCanSkip(true); // Permettre de passer après 50%
      }
      
      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    if (canSkip) {
      onComplete();
    }
  };

  return (
    <div className="splash-screen" onClick={handleSkip}>
      <div className="splash-content">
        <div className="splash-logo">
          <h1>🏴‍☠️ Sea Dogs</h1>
          <h2>Island Tycoon</h2>
        </div>
        
        <div className="splash-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="progress-text">{Math.round(progress)}%</p>
        </div>
        
        {canSkip && (
          <p className="skip-hint">Click to continue</p>
        )}
      </div>
    </div>
  );
}

