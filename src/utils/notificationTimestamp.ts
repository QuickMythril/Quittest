// Utility functions for managing last viewed notifications timestamp
const LAST_VIEWED_KEY = 'notifications_last_viewed';

export function getLastViewedTimestamp(userName: string): number {
  const key = `${LAST_VIEWED_KEY}_${userName}`;
  const stored = localStorage.getItem(key);
  return stored ? parseInt(stored, 10) : 0;
}

export function setLastViewedNotificationsTimestamp(userName: string): void {
  const key = `${LAST_VIEWED_KEY}_${userName}`;
  localStorage.setItem(key, Date.now().toString());
}
