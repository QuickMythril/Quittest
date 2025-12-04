import { useState, useEffect } from 'react';
import { useGlobal, EnumCollisionStrength } from 'qapp-core';

export interface Following {
  userName: string;
  followIdentifier: string;
  timestamp: number;
}

/**
 * Hook to fetch the count of users that a specific user is following
 * @param userName - The name of the user whose following count we want to fetch
 * @returns Object containing following count, loading state, and error
 */
export function useFollowingList(userName: string): {
  followingCount: number;
  followHashIdentifier: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { identifierOperations, lists } = useGlobal();
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followHashIdentifier, setFollowHashIdentifier] = useState<
    string | null
  >(null);
  const fetchFollowing = async () => {
    try {
      if (!userName || !identifierOperations) {
        setFollowingCount(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Get the follow hash prefix
      const followHash = await identifierOperations.hashString(
        'follow',
        EnumCollisionStrength.HIGH
      );

      if (!followHash) {
        throw new Error('Failed to create follow hash');
      }
      const followIdentifier = followHash;
      setFollowHashIdentifier(followIdentifier);

      // Fetch count only - limit: 0 gets all resources for accurate count
      const followResources = await lists.fetchResourcesResultsOnly({
        identifier: followIdentifier,
        service: 'DOCUMENT',
        limit: 0,
        name: userName,
      });

      // The count is the total number of resources
      setFollowingCount(followResources.length);
    } catch (err) {
      console.error('Error fetching following count:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch following count'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userName || !identifierOperations) return;
    fetchFollowing();
  }, [userName, identifierOperations]);

  return {
    followingCount,
    followHashIdentifier,
    isLoading,
    error,
    refetch: fetchFollowing,
  };
}
