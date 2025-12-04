import { atom } from 'jotai';

export interface Notification {
  id: string;
  type: 'follower' | 'mention' | 'reply';
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: number;
  unread: boolean;
  postId?: string;
  postName?: string;
}

// Atom to store all notifications
export const notificationsAtom = atom<Notification[]>([]);

// Atom to track which name the current notifications are for
// This prevents showing stale notifications when name changes
export const notificationsUserNameAtom = atom<string | null>(null);

// Atom to track if notifications are currently being loaded
export const isLoadingNotificationsAtom = atom<boolean>(false);

// Atom to store any error that occurred while fetching notifications
export const notificationsErrorAtom = atom<string | null>(null);

// Atom to track user's preference for notification snackbar
// Stored in IndexedDB via hook
export const notificationSnackbarEnabledAtom = atom<boolean>(true);

// Atom to track user's preference for notification sound
// Stored in IndexedDB via hook
export const notificationSoundEnabledAtom = atom<boolean>(true);

// Atom to track which notification IDs have already been shown in a snackbar
// Stored in IndexedDB via hook, automatically cleaned up after 48 hours
export const shownNotificationIdsAtom = atom<string[]>([]);

// Atom to track if there are unread notifications (for badge indicator)
// Updated by Sidebar useEffect and cleared when notifications are viewed
export const hasUnreadNotificationsAtom = atom<boolean>(false);

