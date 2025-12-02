import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import './UserInfo.css';

export default function UserInfo({ username, isSyncing, onLogout }) {
  const { t } = useTranslation();
  if (!username) return null;
  
  return (
    <div className="user-info-container">
      <div className="user-info-content">
        <LanguageSelector />
        <span className="username">👤 {username}</span>
        {isSyncing && <span className="sync-indicator" title={t('user.syncing')}>🔄</span>}
        <button className="logout-button" onClick={onLogout} title={t('auth.logout')}>
          🚪 {t('auth.logout')}
        </button>
      </div>
    </div>
  );
}

