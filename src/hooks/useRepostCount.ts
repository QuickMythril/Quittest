import { useState, useEffect } from 'react';
import { useGlobal } from 'qapp-core';
import { ENTITY_REPOST } from '../constants/qdn';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to fetch and track repost count for a specific post
 * @param postId - The identifier of the post
 * @param originalAuthor - The name of the original post author
 * @returns The count of reposts for the post
 */
export function useRepostCount(postId: string, originalAuthor: string): number {
  const [repostCount, setRepostCount] = useState<number>(0);
  const { identifierOperations, lists } = useGlobal();
  useEffect(() => {
    let isMounted = true;

    const fetchRepostCount = async () => {
      try {
        if (!postId || !originalAuthor) return;

        const repostIdentifier = await identifierOperations.buildSearchPrefix(
          ENTITY_REPOST,
          postId
        );

        const response = await lists.fetchResourcesResultsOnly({
          service: 'DOCUMENT',
          identifier: repostIdentifier,
          limit: 1,
          prefix: true,
        });

        if (isMounted && Array.isArray(response)) {
          // Count unique names that are not the original author
          const uniqueReposters = new Set<string>();
          response.forEach((resource: any) => {
            if (resource.name && resource.name !== originalAuthor) {
              uniqueReposters.add(resource.name);
            }
          });
          setRepostCount(uniqueReposters.size);
        }
      } catch (error) {
        console.error('Error fetching repost count:', error);
        if (isMounted) {
          setRepostCount(0);
        }
      }
    };

    fetchRepostCount();

    return () => {
      isMounted = false;
    };
  }, [postId, originalAuthor]);

  return repostCount;
}
