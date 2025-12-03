import { useState, useEffect } from 'react';
import { useGlobal, EnumCollisionStrength, useListReturn } from 'qapp-core';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to fetch and track follower count for a specific user
 * @param targetUserName - The name of the user
 * @returns The count of followers for the user
 */
export function useFollowerCount(targetUserName: string): number {
  const { identifierOperations, lists } = useGlobal();
  const [followIdentifier, setFollowIdentifier] = useState<string | null>(null);
  const listReturn = useListReturn(followIdentifier || null);

  useEffect(() => {
    const fetchFollowerCount = async () => {
      try {
        if (!targetUserName || !identifierOperations) return;

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
          console.error('Failed to create follow identifier');
          return;
        }

        const followIdentifier = followHash + userHash;
        setFollowIdentifier(followIdentifier);

        // Search for all users who have published this follow identifier
        const res = await lists.fetchResourcesResultsOnly({
          identifier: followIdentifier,
          service: 'DOCUMENT',
          limit: 0,
        });
        lists.addList(followIdentifier, res);
      } catch (error) {
        console.error('Error fetching follower count:', error);
      }
    };

    fetchFollowerCount();
  }, [targetUserName, identifierOperations]);

  return listReturn?.length || 0;
}

