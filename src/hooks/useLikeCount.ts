import { useState, useEffect } from 'react';
import { useGlobal, EnumCollisionStrength, useListReturn } from 'qapp-core';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to fetch and track like count for a specific post
 * @param postIdentifier - The identifier of the post
 * @returns The count of likes for the post
 */
export function useLikeCount(postIdentifier: string): number {
  const { identifierOperations, lists } = useGlobal();
  const [likeIdentifier, setLikeIdentifier] = useState<string | null>(null);
  const listReturn = useListReturn(likeIdentifier || null);
  useEffect(() => {
    const fetchLikeCount = async () => {
      try {
        if (!postIdentifier || !identifierOperations) return;

        // Get the like identifier by hashing separately and concatenating
        const likeHash = await identifierOperations.hashString(
          'like',
          EnumCollisionStrength.HIGH
        );
        const postHash = await identifierOperations.hashString(
          postIdentifier,
          EnumCollisionStrength.HIGH
        );

        if (!likeHash || !postHash) {
          console.error('Failed to create like identifier');
          return;
        }

        const likeIdentifier = likeHash + postHash;
        setLikeIdentifier(likeIdentifier);

        // Search for all users who have published this like identifier
        const res = await lists.fetchResourcesResultsOnly({
          identifier: likeIdentifier,
          service: 'DOCUMENT',
          limit: 0,
        });
        lists.addList(likeIdentifier, res);
      } catch (error) {
        console.error('Error fetching like count:', error);
      }
    };

    fetchLikeCount();
  }, [postIdentifier, identifierOperations]);

  return listReturn?.length || 0;
}
