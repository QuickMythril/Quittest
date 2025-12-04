import { useEffect, useRef, useCallback } from 'react';
import { useGlobal, EnumCollisionStrength } from 'qapp-core';
import { useAtom } from 'jotai';
import {
  notificationsAtom,
  notificationsUserNameAtom,
  isLoadingNotificationsAtom,
  notificationsErrorAtom,
  Notification,
} from '../state/global/notifications';
import { useFollowedNamesDB } from './useFollowingListDB';
import { ENTITY_POST, ENTITY_ROOT } from '../constants/qdn';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to fetch and track notifications for the authenticated user
 * Automatically fetches when the user's name becomes available
 * Polls every 80 seconds for new notifications
 * Stores data in Jotai atoms for app-wide access
 * Clears notifications when user name changes
 */
export function useNotifications(): {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { identifierOperations, auth, lists } = useGlobal();
  const [notifications, setNotifications] = useAtom(notificationsAtom);
  const [, setNotificationsUserName] = useAtom(notificationsUserNameAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingNotificationsAtom);
  const [error, setError] = useAtom(notificationsErrorAtom);
  const fetchFollowedNames = useFollowedNamesDB();

  const intervalRef = useRef<number | null>(null);
  const previousNameRef = useRef<string | undefined>(auth?.name);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!auth?.name || !identifierOperations) {
        setNotifications([]);
        setNotificationsUserName(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Get current notifications to preserve unread status
      const currentNotifications = notifications;
      const existingNotificationsMap = new Map<string, Notification>();
      currentNotifications.forEach((n) => {
        existingNotificationsMap.set(n.id, n);
      });

      const allNotifications: Notification[] = [];

      // 1. Fetch new followers
      try {
        const followHash = await identifierOperations.hashString(
          'follow',
          EnumCollisionStrength.HIGH
        );
        const userHash = await identifierOperations.hashString(
          auth.name,
          EnumCollisionStrength.HIGH
        );

        if (followHash && userHash) {
          const followIdentifier = followHash + userHash;

          const followResources = await lists.fetchResourcesResultsOnly({
            identifier: followIdentifier,
            service: 'DOCUMENT',
            limit: 0,
            prefix: true,
            reverse: true,
          });
          for (const resource of followResources) {
            if (resource && resource.name) {
              const notificationId = `follower-${resource.name}-${resource.identifier}`;
              const existingNotification =
                existingNotificationsMap.get(notificationId);

              // Always add the notification, but preserve unread status if it already exists
              allNotifications.push({
                id: notificationId,
                type: 'follower',
                userName: resource.name,
                message: 'started following you',
                timestamp: resource.updated || resource.created,
                unread: existingNotification
                  ? existingNotification.unread
                  : true, // New notifications are unread
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching followers:', err);
      }
      const prefix = await identifierOperations.buildSearchPrefix(
        ENTITY_POST,
        ENTITY_ROOT
      );
      const followedUsers = await fetchFollowedNames();
      const hashedName = await identifierOperations.hashString(
        auth.name,
        EnumCollisionStrength.HIGH
      );

      // 2. Fetch mentions from followed users
      if (followedUsers.length > 0) {
        const followedNames = followedUsers;

        try {
          // Fetch mentions using description field
          const mentions = await lists.fetchResourcesResultsOnly({
            service: 'DOCUMENT',
            identifier: prefix,
            names: followedNames,
            exactMatchNames: true,
            prefix: true,
            description: encodeURIComponent(`~@${hashedName}~`),
            limit: 20,
            reverse: true,
          });

          // Process mentions
          for (const mention of mentions) {
            if (mention && mention.name) {
              const notificationId = `mention-${mention.identifier}`;
              const existingNotification =
                existingNotificationsMap.get(notificationId);

              // Always add the notification, but preserve unread status if it already exists
              allNotifications.push({
                id: notificationId,
                type: 'mention',
                userName: mention.name,
                message: 'mentioned you in a post',
                timestamp: mention.updated || mention.created,
                unread: existingNotification
                  ? existingNotification.unread
                  : true, // New notifications are unread
                postId: mention.identifier,
                postName: mention.name,
              });
            }
          }
        } catch (err) {
          console.error('Error fetching mentions:', err);
        }
      }

      // 3. Fetch replies to user's posts from followed users
      if (followedUsers.length > 0) {
        const followedNames = followedUsers;

        try {
          // Fetch replies using description field
          const replies = await lists.fetchResourcesResultsOnly({
            service: 'DOCUMENT',
            identifier: '',
            names: followedNames,
            exactMatchNames: true,
            description: encodeURIComponent(`~rply${hashedName}~`),
            limit: 20,
            reverse: true,
          });

          // Process replies
          for (const reply of replies) {
            if (reply && reply.name) {
              const notificationId = `reply-${reply.identifier}`;
              const existingNotification =
                existingNotificationsMap.get(notificationId);

              // Always add the notification, but preserve unread status if it already exists
              allNotifications.push({
                id: notificationId,
                type: 'reply',
                userName: reply.name,
                message: 'replied to your post',
                timestamp: reply.updated || reply.created,
                unread: existingNotification
                  ? existingNotification.unread
                  : true, // New notifications are unread
                postId: reply.identifier,
                postName: reply.name,
              });
            }
          }
        } catch (err) {
          console.error('Error fetching replies:', err);
        }
      }

      // Create a map of all fetched notifications by ID to handle duplicates
      const fetchedNotificationsMap = new Map<string, Notification>();
      allNotifications.forEach((n) => {
        // If we have multiple notifications with the same ID, keep the one with the latest timestamp
        const existing = fetchedNotificationsMap.get(n.id);
        if (!existing || n.timestamp > existing.timestamp) {
          fetchedNotificationsMap.set(n.id, n);
        }
      });

      // Keep existing notifications that weren't fetched (in case they're no longer relevant)
      // But for now, we'll replace all with the fetched ones
      const finalNotifications = Array.from(fetchedNotificationsMap.values());

      // Sort by timestamp (newest first)
      finalNotifications.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(finalNotifications);
      setNotificationsUserName(auth.name);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch notifications'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    auth?.name,
    identifierOperations,
    lists,
    setNotifications,
    setNotificationsUserName,
    setIsLoading,
    setError,
    fetchFollowedNames,
  ]);

  // Clear notifications when user name changes
  useEffect(() => {
    // If there was a previous name and it's different from current, clear everything
    if (previousNameRef.current && previousNameRef.current !== auth?.name) {
      setNotifications([]);
      setNotificationsUserName(null);
      setIsLoading(false);
      setError(null);
    }
    previousNameRef.current = auth?.name;
  }, [
    auth?.name,
    setNotifications,
    setNotificationsUserName,
    setIsLoading,
    setError,
  ]);

  // Fetch notifications when user's name becomes available
  useEffect(() => {
    if (auth?.name && identifierOperations) {
      // Initial fetch
      fetchNotifications();

      // Set up polling every 80 seconds
      intervalRef.current = setInterval(() => {
        fetchNotifications();
      }, 80000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Clear notifications if no auth
      setNotifications([]);
      setNotificationsUserName(null);
    }
  }, [
    auth?.name,
    identifierOperations,
    fetchNotifications,
    setNotifications,
    setNotificationsUserName,
  ]);

  return {
    notifications,
    isLoading,
    error,
    refetch: fetchNotifications,
  };
}

