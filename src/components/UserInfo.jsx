import React from 'react';
import './UserInfo.css';

export default function UserInfo({ username, isSyncing, onLogout }) {
  if (!username) return null;
  
  return (
    <div className="user-info-container">
      <div className="user-info-content">
        <span className="username">👤 {username}</span>
        {isSyncing && <span className="sync-indicator" title="Synchronisation...">🔄</span>}
        <button className="logout-button" onClick={onLogout} title="Déconnexion">
          🚪 Déconnexion
        </button>
      </div>
    </div>
  );
}

