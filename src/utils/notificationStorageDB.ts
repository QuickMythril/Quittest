import localforage from 'localforage';

// Configure localforage for notification tracking
const notificationDB = localforage.createInstance({
  name: 'Quitter-App',
  storeName: 'notifications',
  description: 'Stores shown notification IDs with timestamps',
});

export interface ShownNotification {
  id: string; // The notification ID
  timestamp: number; // When it was shown
}

const STORAGE_KEY_PREFIX = 'shown_notifications_';
const SNACKBAR_ENABLED_KEY = 'snackbar_enabled';
const SOUND_ENABLED_KEY = 'notification_sound_enabled';
const STALE_THRESHOLD = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

/**
 * Gets the storage key for a specific user's shown notifications
 */
export function getShownNotificationsKey(userName: string): string {
  return `${STORAGE_KEY_PREFIX}${userName}`;
}

/**
 * Loads the shown notifications list for a user from IndexedDB
 * Automatically cleans up entries older than 48 hours
 * @param userName - The authenticated user's name
 * @returns Array of shown notification IDs
 */
export async function loadShownNotifications(
  userName: string
): Promise<string[]> {
  try {
    const key = getShownNotificationsKey(userName);
    const data = await notificationDB.getItem<ShownNotification[]>(key);
    
    if (!data || data.length === 0) {
      return [];
    }

    // Clean up stale entries (older than 48 hours)
    const now = Date.now();
    const validNotifications = data.filter(
      (item) => now - item.timestamp < STALE_THRESHOLD
    );

    // If we cleaned up any entries, save the cleaned list
    if (validNotifications.length !== data.length) {
      await saveShownNotifications(userName, validNotifications.map(n => n.id));
    }

    return validNotifications.map((item) => item.id);
  } catch (error) {
    console.error('Error loading shown notifications from IndexedDB:', error);
    return [];
  }
}

/**
 * Saves the shown notifications list for a user to IndexedDB
 * @param userName - The authenticated user's name
 * @param notificationIds - Array of notification IDs to save
 */
export async function saveShownNotifications(
  userName: string,
  notificationIds: string[]
): Promise<void> {
  try {
    const key = getShownNotificationsKey(userName);
    const now = Date.now();
    
    // Convert IDs to ShownNotification objects with timestamps
    const shownNotifications: ShownNotification[] = notificationIds.map((id) => ({
      id,
      timestamp: now,
    }));

    await notificationDB.setItem(key, shownNotifications);
  } catch (error) {
    console.error('Error saving shown notifications to IndexedDB:', error);
    throw error;
  }
}

/**
 * Adds notification IDs to the shown list
 * @param userName - The authenticated user's name
 * @param notificationIds - The notification IDs to add
 */
export async function addShownNotifications(
  userName: string,
  notificationIds: string[]
): Promise<void> {
  try {
    const currentIds = await loadShownNotifications(userName);
    
    // Filter out IDs that already exist
    const newIds = notificationIds.filter((id) => !currentIds.includes(id));
    
    if (newIds.length > 0) {
      const allIds = [...currentIds, ...newIds];
      await saveShownNotifications(userName, allIds);
    }
  } catch (error) {
    console.error('Error adding shown notifications:', error);
    throw error;
  }
}

/**
 * Clears all shown notifications for a user
 * @param userName - The authenticated user's name
 */
export async function clearShownNotifications(userName: string): Promise<void> {
  try {
    const key = getShownNotificationsKey(userName);
    await notificationDB.removeItem(key);
  } catch (error) {
    console.error('Error clearing shown notifications:', error);
    throw error;
  }
}

/**
 * Loads the snackbar enabled preference
 * @returns True if snackbar is enabled, defaults to true
 */
export async function loadSnackbarEnabled(): Promise<boolean> {
  try {
    const enabled = await notificationDB.getItem<boolean>(SNACKBAR_ENABLED_KEY);
    return enabled !== null ? enabled : true; // Default to enabled
  } catch (error) {
    console.error('Error loading snackbar preference:', error);
    return true;
  }
}

/**
 * Saves the snackbar enabled preference
 * @param enabled - Whether the snackbar is enabled
 */
export async function saveSnackbarEnabled(enabled: boolean): Promise<void> {
  try {
    await notificationDB.setItem(SNACKBAR_ENABLED_KEY, enabled);
  } catch (error) {
    console.error('Error saving snackbar preference:', error);
    throw error;
  }
}

/**
 * Loads the notification sound enabled preference
 * @returns True if sound is enabled, defaults to true
 */
export async function loadSoundEnabled(): Promise<boolean> {
  try {
    const enabled = await notificationDB.getItem<boolean>(SOUND_ENABLED_KEY);
    return enabled !== null ? enabled : true; // Default to enabled
  } catch (error) {
    console.error('Error loading sound preference:', error);
    return true;
  }
}

/**
 * Saves the notification sound enabled preference
 * @param enabled - Whether the sound is enabled
 */
export async function saveSoundEnabled(enabled: boolean): Promise<void> {
  try {
    await notificationDB.setItem(SOUND_ENABLED_KEY, enabled);
  } catch (error) {
    console.error('Error saving sound preference:', error);
    throw error;
  }
}

/**
 * Manually cleanup stale notification entries for a user
 * Called automatically by loadShownNotifications, but can be called manually if needed
 * @param userName - The authenticated user's name
 * @returns Number of entries cleaned up
 */
export async function cleanupStaleNotifications(
  userName: string
): Promise<number> {
  try {
    const key = getShownNotificationsKey(userName);
    const data = await notificationDB.getItem<ShownNotification[]>(key);
    
    if (!data || data.length === 0) {
      return 0;
    }

    const now = Date.now();
    const validNotifications = data.filter(
      (item) => now - item.timestamp < STALE_THRESHOLD
    );

    const cleanedCount = data.length - validNotifications.length;

    if (cleanedCount > 0) {
      await notificationDB.setItem(key, validNotifications);
    }

    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up stale notifications:', error);
    return 0;
  }
}

export default notificationDB;

