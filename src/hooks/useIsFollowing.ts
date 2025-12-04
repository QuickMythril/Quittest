import { useState, useEffect } from 'react';
import { useGlobal, EnumCollisionStrength, useListReturn } from 'qapp-core';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to check if the current user is following a specific user
 * @param targetUserName - The name of the user to check
 * @returns Object containing isFollowing boolean and isLoading boolean
 */
export function useIsFollowing(targetUserName: string): { isFollowing: boolean; isLoading: boolean } {
  const { identifierOperations, auth, lists } = useGlobal();
  const [followIdentifier, setFollowIdentifier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const listReturn = useListReturn(followIdentifier || null);

  useEffect(() => {
    const checkIfFollowing = async () => {
      try {
        setIsLoading(true);
        if (!targetUserName || !identifierOperations || !auth?.name) {
          setIsLoading(false);
          return;
        }

        // Don't check if user is trying to follow themselves
        if (targetUserName === auth.name) {
          setIsLoading(false);
          return;
        }

        // Create the follow identifier by hashing separately and concatenating
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
          setIsLoading(false);
          return;
        }

        const followIdentifier = followHash + userHash;
        setFollowIdentifier(`${followIdentifier}-${auth.name}`);

        // Try to fetch the follow resource
        const res = await lists.fetchResourcesResultsOnly({
          identifier: followIdentifier,
          service: 'DOCUMENT',
          name: auth.name,
          limit: 0,
        });
        lists.addList(`${followIdentifier}-${auth.name}`, res);
      } catch (error) {
        // Silent error handling
      } finally {
        setIsLoading(false);
      }
    };

    checkIfFollowing();
  }, [targetUserName, identifierOperations, auth?.name]);

  return { isFollowing: listReturn?.length > 0, isLoading };
}

