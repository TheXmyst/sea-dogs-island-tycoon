import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [showClickMessage, setShowClickMessage] = useState(false);
  const [progressBarVisible, setProgressBarVisible] = useState(true);

  useEffect(() => {
    // Animation de progression plus lente
    const duration = 4000; // 4 secondes
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(interval);
        // Faire disparaître la barre de progression
        setTimeout(() => {
          setProgressBarVisible(false);
          // Afficher le message "Cliquez pour continuer" après la disparition
          setTimeout(() => {
            setShowClickMessage(true);
          }, 500);
        }, 500);
      }
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (showClickMessage) {
      onComplete();
    }
  };

  return (
    <div className="splash-screen" onClick={handleClick}>
      <div className="splash-content">
        <div className="splash-logo">
          <h1>🏴‍☠️ Sea Dogs</h1>
          <h2>Island Tycoon</h2>
        </div>
        
        {progressBarVisible && (
          <div className="splash-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="progress-text">{Math.round(progress)}%</p>
          </div>
        )}
        
        {showClickMessage && (
          <div className="click-message">
            <p className="click-hint">Cliquez pour continuer</p>
            <p className="click-hint-en">Click to continue</p>
          </div>
        )}
      </div>
    </div>
  );
}

