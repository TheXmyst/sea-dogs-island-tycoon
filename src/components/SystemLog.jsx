import React from 'react';
import { getNotificationHistory, clearNotificationHistory } from '../utils/notifications';
import { showInfo } from '../utils/notifications';
import './SystemLog.css';

export default function SystemLog() {
  const [notifications, setNotifications] = React.useState([]);
  const [filter, setFilter] = React.useState('all'); // 'all', 'success', 'error', 'warning', 'info'

  React.useEffect(() => {
    // Load notifications on mount and refresh periodically
    const loadNotifications = () => {
      setNotifications(getNotificationHistory());
    };
    
    loadNotifications();
    const interval = setInterval(loadNotifications, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    clearNotificationHistory();
    setNotifications([]);
    showInfo('System log cleared');
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="system-log">
      <div className="system-log-header">
        <h2>📋 System Log</h2>
        <p>View all system notifications and messages</p>
        <div className="system-log-controls">
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button 
              className={filter === 'success' ? 'active' : ''}
              onClick={() => setFilter('success')}
            >
              ✅ Success ({notifications.filter(n => n.type === 'success').length})
            </button>
            <button 
              className={filter === 'error' ? 'active' : ''}
              onClick={() => setFilter('error')}
            >
              ❌ Errors ({notifications.filter(n => n.type === 'error').length})
            </button>
            <button 
              className={filter === 'warning' ? 'active' : ''}
              onClick={() => setFilter('warning')}
            >
              ⚠️ Warnings ({notifications.filter(n => n.type === 'warning').length})
            </button>
            <button 
              className={filter === 'info' ? 'active' : ''}
              onClick={() => setFilter('info')}
            >
              ℹ️ Info ({notifications.filter(n => n.type === 'info').length})
            </button>
          </div>
          <button className="clear-button" onClick={handleClear}>
            🗑️ Clear Log
          </button>
        </div>
      </div>

      <div className="system-log-content">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications yet</p>
            <p className="sub-text">System messages will appear here</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.slice().reverse().map(notif => (
              <div key={notif.id} className={`notification-item notification-${notif.type}`}>
                <span className="notification-icon">{getIcon(notif.type)}</span>
                <div className="notification-content">
                  <p className="notification-message">{notif.message}</p>
                  <span className="notification-time">{formatTime(notif.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

