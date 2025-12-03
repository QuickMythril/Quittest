import { useState, useEffect } from 'react';
import { useGlobal, EnumCollisionStrength, useListReturn } from 'qapp-core';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to check if the current user is following a specific user
 * @param targetUserName - The name of the user to check
 * @returns Boolean indicating whether the current user is following the target user
 */
export function useIsFollowing(targetUserName: string): boolean {
  const { identifierOperations, auth, lists } = useGlobal();
  const [followIdentifier, setFollowIdentifier] = useState<string | null>(null);
  const listReturn = useListReturn(followIdentifier || null);

  useEffect(() => {
    const checkIfFollowing = async () => {
      try {
        if (!targetUserName || !identifierOperations || !auth?.name) return;

        // Don't check if user is trying to follow themselves
        if (targetUserName === auth.name) return;

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
      } catch (error) {}
    };

    checkIfFollowing();
  }, [targetUserName, identifierOperations, auth?.name]);

  return listReturn?.length > 0;
}

