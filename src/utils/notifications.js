/**
 * Notification system for game events
 */

let notificationCallback = null;
let notificationHistory = [];

export function setNotificationCallback(callback) {
  notificationCallback = callback;
}

export function getNotificationHistory() {
  return [...notificationHistory];
}

export function clearNotificationHistory() {
  notificationHistory = [];
}

export function showNotification(message, type = 'info', duration = 5000) {
  // Add to history
  const notification = {
    id: Date.now(),
    message,
    type,
    timestamp: new Date().toISOString(),
  };
  notificationHistory.push(notification);
  
  // Keep only last 100 notifications
  if (notificationHistory.length > 100) {
    notificationHistory = notificationHistory.slice(-100);
  }
  
  if (notificationCallback) {
    notificationCallback({ message, type, duration });
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

export function showSuccess(message, duration = 3000) {
  showNotification(message, 'success', duration);
}

export function showError(message, duration = 4000) {
  showNotification(message, 'error', duration);
}

export function showWarning(message, duration = 3500) {
  showNotification(message, 'warning', duration);
}

export function showInfo(message, duration = 3000) {
  showNotification(message, 'info', duration);
}

