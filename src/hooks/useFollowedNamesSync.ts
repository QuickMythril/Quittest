import { useEffect, useRef, useCallback } from 'react';
import { useGlobal, EnumCollisionStrength } from 'qapp-core';

// Storage key prefix for localStorage
const STORAGE_KEY_PREFIX = 'followed_names_';

// Configuration
const BATCH_SIZE = 3; // Number of names to fetch at a time
const FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const VALIDATION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export interface StoredFollowedName {
  name: string; // The actual followed user's name (from data.followedName)
  identifier: string; // The resource identifier
  lastValidated: number; // Timestamp of last validation
}

/**
 * Gets the storage key for a specific user
 */
export function getFollowedNamesStorageKey(userName: string): string {
  return `${STORAGE_KEY_PREFIX}${userName}`;
}

/**
 * Loads stored names from localStorage
 */
export function loadStoredFollowedNames(
  userName: string
): StoredFollowedName[] {
  try {
    const stored = localStorage.getItem(getFollowedNamesStorageKey(userName));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading stored followed names:', error);
  }
  return [];
}

/**
 * Saves names to localStorage
 */
function saveStoredNames(userName: string, names: StoredFollowedName[]): void {
  try {
    localStorage.setItem(
      getFollowedNamesStorageKey(userName),
      JSON.stringify(names)
    );
  } catch (error) {
    console.error('Error saving followed names:', error);
  }
}

/**
 * Hook to progressively sync followed user names in the background.
 *
 * This hook runs background sync operations and DOES NOT return any reactive state.
 * It will not cause re-renders in the component that uses it.
 *
 * Use `useFollowedNames` hook to read the synced names.
 *
 * Features:
 * - Fetches the real followed user names from resource data (not just metadata)
 * - Fetches 3 names at a time every 5 minutes
 * - Validates identifiers still exist every hour
 * - Persists data in localStorage keyed by authenticated user's name
 */
export function useFollowedNamesSync(): void {
  const { auth, identifierOperations, lists } = useGlobal();

  // Refs for managing intervals and tracking state (no reactive state)
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingIdentifiersRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);
  const currentUserRef = useRef<string | null>(null);

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
          `/arbitrary/DOCUMENT/${publisherName}/${identifier}?encoding=base64`
        );

        if (!response.ok) return null;

        const base64Data = await response.text();
        const jsonString = atob(base64Data);
        const data = JSON.parse(jsonString);

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
      if (!isMountedRef.current) return;

      // Get the next batch of identifiers to process
      const pendingArray = Array.from(pendingIdentifiersRef.current);
      if (pendingArray.length === 0) return;

      const batch = pendingArray.slice(0, BATCH_SIZE);

      try {
        const currentNames = loadStoredFollowedNames(userName);
        const newNames: StoredFollowedName[] = [...currentNames];
        const existingIdentifiers = new Set(
          currentNames.map((n) => n.identifier)
        );

        for (const identifier of batch) {
          // Skip if we already have this identifier
          if (existingIdentifiers.has(identifier)) {
            pendingIdentifiersRef.current.delete(identifier);
            continue;
          }

          // Fetch the actual data
          const data = await fetchResourceData(identifier, userName);

          if (data?.followedName && isMountedRef.current) {
            newNames.push({
              name: data.followedName,
              identifier,
              lastValidated: Date.now(),
            });
            existingIdentifiers.add(identifier);
          }

          // Remove from pending
          pendingIdentifiersRef.current.delete(identifier);
        }

        // Save updated names
        if (isMountedRef.current) {
          saveStoredNames(userName, newNames);
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
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

        const storedNames = loadStoredFollowedNames(userName);
        const validNames = storedNames.filter((stored) =>
          currentIdentifiers.has(stored.identifier)
        );

        // Update lastValidated for valid names
        const updatedNames = validNames.map((n) => ({
          ...n,
          lastValidated: Date.now(),
        }));

        if (isMountedRef.current) {
          saveStoredNames(userName, updatedNames);
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
        // Load existing stored names
        const storedNames = loadStoredFollowedNames(userName);

        // Fetch current follow resources
        const resources = await fetchFollowResources(userName);
        const resourceIdentifiers = new Set(
          resources.map((r: any) => r.identifier)
        );

        // Find identifiers we haven't fetched yet
        const storedIdentifiers = new Set(storedNames.map((n) => n.identifier));
        const newIdentifiers = Array.from(resourceIdentifiers).filter(
          (id) => !storedIdentifiers.has(id as string)
        ) as string[];

        // Add new identifiers to pending queue
        pendingIdentifiersRef.current = new Set(newIdentifiers);

        // Filter out stored names for identifiers that no longer exist
        const validStoredNames = storedNames.filter((n) =>
          resourceIdentifiers.has(n.identifier)
        );

        if (isMountedRef.current) {
          saveStoredNames(userName, validStoredNames);

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

  // Set up fetch interval (every 5 minutes)
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

  // Set up validation interval (every hour)
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
