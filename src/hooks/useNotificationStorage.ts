import { useEffect, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { useGlobal } from 'qapp-core';
import {
  notificationSnackbarEnabledAtom,
  notificationSoundEnabledAtom,
  shownNotificationIdsAtom,
} from '../state/global/notifications';
import {
  loadShownNotifications,
  addShownNotifications,
  loadSnackbarEnabled,
  saveSnackbarEnabled,
  loadSoundEnabled,
  saveSoundEnabled,
} from '../utils/notificationStorageDB';

/**
 * Hook to manage notification storage synchronization with IndexedDB
 * - Loads shown notification IDs and snackbar preference on mount
 * - Saves shown notification IDs to IndexedDB when they change
 * - Saves snackbar preference to IndexedDB when it changes
 * - Automatically cleans up stale entries (older than 48 hours)
 * - Clears data when user changes
 */
export function useNotificationStorage(): void {
  const { auth } = useGlobal();
  const [shownNotificationIds, setShownNotificationIds] = useAtom(
    shownNotificationIdsAtom
  );
  const [snackbarEnabled, setSnackbarEnabled] = useAtom(
    notificationSnackbarEnabledAtom
  );
  const [soundEnabled, setSoundEnabled] = useAtom(
    notificationSoundEnabledAtom
  );
  
  const previousNameRef = useRef<string | undefined>(auth?.name);
  const isInitializedRef = useRef(false);
  const isSavingRef = useRef(false);

  // Load data from IndexedDB on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      if (!auth?.name) {
        // Clear data if no user is authenticated
        setShownNotificationIds([]);
        setSnackbarEnabled(true);
        setSoundEnabled(true);
        isInitializedRef.current = false;
        return;
      }

      // If user changed, clear current data before loading new user's data
      if (previousNameRef.current && previousNameRef.current !== auth.name) {
        setShownNotificationIds([]);
        isInitializedRef.current = false;
      }

      try {
        // Load shown notifications (automatically cleans up stale entries)
        const ids = await loadShownNotifications(auth.name);
        setShownNotificationIds(ids);

        // Load snackbar preference
        const snackbarPref = await loadSnackbarEnabled();
        setSnackbarEnabled(snackbarPref);

        // Load sound preference
        const soundPref = await loadSoundEnabled();
        setSoundEnabled(soundPref);

        isInitializedRef.current = true;
      } catch (error) {
        console.error('Error loading notification storage:', error);
      }
    };

    // Load on mount or when user changes
    if (!auth?.name || previousNameRef.current !== auth.name) {
      loadData();
      previousNameRef.current = auth?.name;
    }
  }, [auth?.name, setShownNotificationIds, setSnackbarEnabled, setSoundEnabled]);

  // Save shown notification IDs to IndexedDB when they change
  useEffect(() => {
    const saveIds = async () => {
      if (!auth?.name || !isInitializedRef.current || isSavingRef.current) {
        return;
      }

      try {
        isSavingRef.current = true;
        
        // Only save the new IDs (ones not already in IndexedDB)
        const currentStoredIds = await loadShownNotifications(auth.name);
        const newIds = shownNotificationIds.filter(
          (id) => !currentStoredIds.includes(id)
        );

        if (newIds.length > 0) {
          await addShownNotifications(auth.name, newIds);
        }
      } catch (error) {
        console.error('Error saving shown notification IDs:', error);
      } finally {
        isSavingRef.current = false;
      }
    };

    saveIds();
  }, [auth?.name, shownNotificationIds]);

  // Save snackbar preference to IndexedDB when it changes
  useEffect(() => {
    const savePreference = async () => {
      if (!isInitializedRef.current) {
        return;
      }

      try {
        await saveSnackbarEnabled(snackbarEnabled);
      } catch (error) {
        console.error('Error saving snackbar preference:', error);
      }
    };

    savePreference();
  }, [snackbarEnabled]);

  // Save sound preference to IndexedDB when it changes
  useEffect(() => {
    const savePreference = async () => {
      if (!isInitializedRef.current) {
        return;
      }

      try {
        await saveSoundEnabled(soundEnabled);
      } catch (error) {
        console.error('Error saving sound preference:', error);
      }
    };

    savePreference();
  }, [soundEnabled]);
}

