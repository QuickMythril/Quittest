import { useEffect, useRef, useCallback } from 'react';
import { useGlobal, EnumCollisionStrength } from 'qapp-core';
import {
  loadFollowingList,
  saveFollowingList,
  addFollowedUser,
  getFollowedUserByIdentifier,
  FollowedUser,
} from '../utils/followingStorageDB';

// Configuration
const BATCH_SIZE = 5; // Number of names to fetch at a time
const FETCH_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const VALIDATION_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to progressively sync followed user names in the background using IndexedDB.
 *
 * This hook runs background sync operations and DOES NOT return any reactive state.
 * It will not cause re-renders in the component that uses it.
 *
 * Use `useFollowingListDB` hook to read the synced names.
 *
 * Features:
 * - Fetches the real followed user names from resource data (not just metadata)
 * - Fetches 5 names at a time every 3 minutes
 * - Validates identifiers still exist every 30 minutes
 * - Persists data in IndexedDB keyed by authenticated user's name
 * - Automatically initializes on mount
 */
export function useFollowingStorage(): void {
  const { auth, identifierOperations, lists } = useGlobal();

  // Refs for managing intervals and tracking state (no reactive state)
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingIdentifiersRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);
  const currentUserRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  /**
   * Fetches the follow resources list (metadata only)
   */
  const fetchFollowResources = useCallback(
    async (userName: string) => {
      if (!identifierOperations || !lists) return [];

      try {
        const followHash = await identifierOperations.hashString(
          'follow',
          EnumCollisionStrength.HIGH
        );

        if (!followHash) return [];

        const resources = await lists.fetchResourcesResultsOnly({
          identifier: followHash,
          service: 'DOCUMENT',
          name: userName,
          limit: 0,
        });

        return resources || [];
      } catch (error) {
        console.error('Error fetching follow resources:', error);
        return [];
      }
    },
    [identifierOperations, lists]
  );

  /**
   * Fetches the actual data for a resource to get the followed name
   */
  const fetchResourceData = useCallback(
    async (
      identifier: string,
      publisherName: string
    ): Promise<{ followedName: string } | null> => {
      try {
        const response = await fetch(
          `/arbitrary/DOCUMENT/${publisherName}/${identifier}`
        );

        if (!response.ok) {
          console.warn(
            `Failed to fetch resource data: ${response.status} ${response.statusText}`
          );
          return null;
        }

        const data = await response.json();

        if (!data.followedName) {
          console.warn('Resource data missing followedName:', data);
          return null;
        }

        return data;
      } catch (error) {
        console.error('Error fetching resource data:', error);
        return null;
      }
    },
    []
  );

  /**
   * Fetches a batch of names from pending identifiers
   */
  const fetchBatch = useCallback(
    async (userName: string) => {
      if (!isMountedRef.current || isFetchingRef.current) return;

      // Get the next batch of identifiers to process
      const pendingArray = Array.from(pendingIdentifiersRef.current);
      if (pendingArray.length === 0) return;

      isFetchingRef.current = true;

      try {
        const batch = pendingArray.slice(0, BATCH_SIZE);

        for (const identifier of batch) {
          if (!isMountedRef.current) break;

          // Check if we already have this identifier
          const existing = await getFollowedUserByIdentifier(
            userName,
            identifier
          );

          if (existing) {
            pendingIdentifiersRef.current.delete(identifier);
            continue;
          }

          // Fetch the actual data
          const data = await fetchResourceData(identifier, userName);

          if (data?.followedName && isMountedRef.current) {
            await addFollowedUser(userName, {
              name: data.followedName,
              identifier,
              lastValidated: Date.now(),
            });
          }

          // Remove from pending
          pendingIdentifiersRef.current.delete(identifier);
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [fetchResourceData]
  );

  /**
   * Validates that stored identifiers still exist in the current resources
   */
  const validateIdentifiers = useCallback(
    async (userName: string) => {
      if (!isMountedRef.current) return;

      try {
        const resources = await fetchFollowResources(userName);
        const currentIdentifiers = new Set(
          resources.map((r: any) => r.identifier)
        );

        const storedUsers = await loadFollowingList(userName);
        const validUsers = storedUsers.filter((stored) =>
          currentIdentifiers.has(stored.identifier)
        );

        // Update lastValidated for valid users
        const updatedUsers = validUsers.map((u) => ({
          ...u,
          lastValidated: Date.now(),
        }));

        if (isMountedRef.current) {
          await saveFollowingList(userName, updatedUsers);
        }
      } catch (error) {
        console.error('Error validating identifiers:', error);
      }
    },
    [fetchFollowResources]
  );

  /**
   * Initializes the sync process
   */
  const initializeSync = useCallback(
    async (userName: string) => {
      if (!isMountedRef.current) return;

      try {
        // Load existing stored users
        const storedUsers = await loadFollowingList(userName);

        // Fetch current follow resources
        const resources = await fetchFollowResources(userName);
        const resourceIdentifiers = new Set(
          resources.map((r: any) => r.identifier)
        );

        // Find identifiers we haven't fetched yet
        const storedIdentifiers = new Set(storedUsers.map((u) => u.identifier));
        const newIdentifiers = Array.from(resourceIdentifiers).filter(
          (id) => !storedIdentifiers.has(id as string)
        ) as string[];

        // Add new identifiers to pending queue
        pendingIdentifiersRef.current = new Set(newIdentifiers);

        // Filter out stored users for identifiers that no longer exist
        const validStoredUsers = storedUsers.filter((u) =>
          resourceIdentifiers.has(u.identifier)
        );

        if (isMountedRef.current) {
          await saveFollowingList(userName, validStoredUsers);

          // Start fetching first batch immediately if there are pending
          if (pendingIdentifiersRef.current.size > 0) {
            fetchBatch(userName);
          }
        }
      } catch (error) {
        console.error('Error initializing sync:', error);
      }
    },
    [fetchFollowResources, fetchBatch]
  );

  // Initialize when user changes
  useEffect(() => {
    const userName = auth?.name;

    if (!userName) {
      currentUserRef.current = null;
      isInitializedRef.current = false;
      return;
    }

    // Only initialize once per user
    if (currentUserRef.current === userName && isInitializedRef.current) {
      return;
    }

    currentUserRef.current = userName;
    isInitializedRef.current = true;
    initializeSync(userName);
  }, [auth?.name, initializeSync]);

  // Set up fetch interval (every 3 minutes)
  useEffect(() => {
    const userName = auth?.name;
    if (!userName) return;

    fetchIntervalRef.current = setInterval(() => {
      if (pendingIdentifiersRef.current.size > 0) {
        fetchBatch(userName);
      } else {
        // If no pending, check for new resources
        initializeSync(userName);
      }
    }, FETCH_INTERVAL_MS);

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [auth?.name, fetchBatch, initializeSync]);

  // Set up validation interval (every 30 minutes)
  useEffect(() => {
    const userName = auth?.name;
    if (!userName) return;

    validationIntervalRef.current = setInterval(() => {
      validateIdentifiers(userName);
    }, VALIDATION_INTERVAL_MS);

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, [auth?.name, validateIdentifiers]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, []);

  // This hook returns nothing - it only runs background sync
}
