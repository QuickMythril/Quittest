import { useState, useEffect } from 'react';
import { useGlobal, EnumCollisionStrength } from 'qapp-core';

export interface Follower {
  userName: string;
  followIdentifier: string;
  timestamp: number;
}

/**
 * Hook to fetch the list of users following a specific user
 * @param targetUserName - The name of the user whose followers we want to fetch
 * @returns Object containing followers array, loading state, and error
 */
export function useFollowersList(targetUserName: string): {
  followers: Follower[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { identifierOperations, lists } = useGlobal();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowers = async () => {
    try {
      if (!targetUserName || !identifierOperations) {
        setFollowers([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Get the follow identifier by hashing separately and concatenating
      const followHash = await identifierOperations.hashString(
        'follow',
        EnumCollisionStrength.HIGH
      );
      const userHash = await identifierOperations.hashString(
        targetUserName,
        EnumCollisionStrength.HIGH
      );

      if (!followHash || !userHash) {
        throw new Error('Failed to create follow identifier');
      }

      const followIdentifier = followHash + userHash;

      // Search for all users who have published this follow identifier
      // This returns all users following the targetUserName
      const followResources = await lists.fetchResourcesResultsOnly({
        identifier: followIdentifier,
        service: 'DOCUMENT',
        limit: 0,
      });

      // Extract follower information
      const followersList: Follower[] = [];

      for (const resource of followResources) {
        try {
          if (resource && resource.name) {
            followersList.push({
              userName: resource.name,
              followIdentifier: resource.identifier,
              timestamp: resource.updated || resource.created,
            });
          }
        } catch (parseError) {
          console.error(
            'Error parsing follower resource:',
            parseError,
            resource
          );
        }
      }

      // Sort by most recent first
      followersList.sort((a, b) => b.timestamp - a.timestamp);

      setFollowers(followersList);
    } catch (err) {
      console.error('Error fetching followers:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch followers'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, [targetUserName, identifierOperations]);

  return {
    followers,
    isLoading,
    error,
    refetch: fetchFollowers,
  };
}
