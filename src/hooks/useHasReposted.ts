import { useState, useEffect } from 'react';
import { useGlobal } from 'qapp-core';
import { ENTITY_REPOST } from '../constants/qdn';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to check if the current user has reposted a specific post
 * @param postId - The identifier of the original post
 * @param originalAuthor - The name of the original post author
 * @returns Object with hasReposted (boolean) and isLoading (boolean)
 */
export function useHasReposted(
  postId: string,
  originalAuthor: string
): { hasReposted: boolean; isLoading: boolean } {
  const [hasReposted, setHasReposted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { auth, identifierOperations, lists } = useGlobal();

  useEffect(() => {
    let isMounted = true;

    const checkHasReposted = async () => {
      try {
        setIsLoading(true);
        if (!postId || !auth?.name || !originalAuthor) {
          setHasReposted(false);
          setIsLoading(false);
          return;
        }

        // Don't check if viewing your own original post
        if (auth.name === originalAuthor) {
          setHasReposted(false);
          setIsLoading(false);
          return;
        }

        const repostIdentifier = await identifierOperations.buildSearchPrefix(
          ENTITY_REPOST,
          postId
        );
        const response = await lists.fetchResourcesResultsOnly({
          service: 'DOCUMENT',
          identifier: repostIdentifier,
          name: auth.name, // Search only for resources published by current user
          limit: 1,
          prefix: true,
        });

        if (isMounted && Array.isArray(response)) {
          // If we find a resource with this identifier under the current user's name,
          // they have reposted it
          setHasReposted(response.length > 0);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking if user has reposted:', error);
        if (isMounted) {
          setHasReposted(false);
          setIsLoading(false);
        }
      }
    };

    checkHasReposted();

    return () => {
      isMounted = false;
    };
  }, [postId, auth?.name, originalAuthor]);

  return { hasReposted, isLoading };
}
