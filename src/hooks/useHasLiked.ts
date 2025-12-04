import { useState, useEffect } from 'react';
import { useGlobal, EnumCollisionStrength, useListReturn } from 'qapp-core';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to check if the current user has liked a specific post
 * @param postIdentifier - The identifier of the post
 * @returns Object with hasLiked (boolean) and isLoading (boolean)
 */
export function useHasLiked(postIdentifier: string): {
  hasLiked: boolean;
  isLoading: boolean;
} {
  const { identifierOperations, auth, lists } = useGlobal();
  const [likeIdentifier, setLikeIdentifier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const listReturn = useListReturn(likeIdentifier || null);

  useEffect(() => {
    const checkIfLiked = async () => {
      try {
        setIsLoading(true);
        if (!postIdentifier || !identifierOperations || !auth?.name) {
          setIsLoading(false);
          return;
        }

        // Create the like identifier by hashing separately and concatenating
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
          setIsLoading(false);
          return;
        }

        const likeIdentifier = likeHash + postHash;
        setLikeIdentifier(`${likeIdentifier}-${auth.name}`);

        // Try to fetch the like resource
        const res = await lists.fetchResourcesResultsOnly({
          identifier: likeIdentifier,
          service: 'DOCUMENT',
          name: auth.name,
          limit: 0,
        });
        lists.addList(`${likeIdentifier}-${auth.name}`, res);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    checkIfLiked();
  }, [postIdentifier, identifierOperations, auth?.name]);

  return { hasLiked: listReturn?.length > 0, isLoading };
}
