import { useEffect } from 'react';
import { useGlobal, EnumCollisionStrength } from 'qapp-core';
import { useAtom } from 'jotai';
import {
  followedUsersAtom,
  isLoadingFollowsAtom,
  followsErrorAtom,
  FollowedUser,
} from '../state/global/follows';

// Re-export the type for convenience
export type { FollowedUser } from '../state/global/follows';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to fetch and track the list of users that the authenticated user is following
 * Automatically fetches when the user's name becomes available
 * Stores data in Jotai atoms for app-wide access
 * @returns Array of users that the current user follows, loading state, and refetch function
 */
export function useFollowsList(): {
  followedUsers: FollowedUser[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { identifierOperations, auth, lists } = useGlobal();
  const [followedUsers, setFollowedUsers] = useAtom(followedUsersAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingFollowsAtom);
  const [error, setError] = useAtom(followsErrorAtom);

  const fetchFollows = async () => {
    try {
      if (!auth?.name || !identifierOperations) {
        setFollowedUsers([]);
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

      // Search for all resources published by the current user that start with the follow hash
      // This will return all the follow resources the user has created
      const followResources = await lists.fetchResourcesResultsOnly({
        identifier: followHash, // This will match resources starting with followHash
        service: 'DOCUMENT',
        name: auth.name,
        limit: 0, // Adjust limit as needed
      });

      // Extract the user names from the follow data
      const users: FollowedUser[] = [];

      for (const resource of followResources) {
        try {
          // The data should contain the targetUserName
          if (resource) {
            users.push({
              userName: resource.name,
              followIdentifier: resource.identifier,
              timestamp: resource.updated || resource.created,
            });
          }
        } catch (parseError) {
          console.error('Error parsing follow resource:', parseError, resource);
        }
      }

      setFollowedUsers(users);
    } catch (err) {
      console.error('Error fetching follows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch follows');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch follows when the user's name becomes available
  useEffect(() => {
    fetchFollows();
  }, [auth?.name, identifierOperations]);

  return {
    followedUsers,
    isLoading,
    error,
    refetch: fetchFollows,
  };
}
