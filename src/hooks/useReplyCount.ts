import { useState, useEffect } from 'react';
import { useGlobal } from 'qapp-core';
import { ENTITY_REPLY } from '../constants/qdn';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to fetch and track reply count for a specific post
 * @param postId - The identifier of the post
 * @returns The count of replies for the post
 */
export function useReplyCount(postId: string): number {
  const [replyCount, setReplyCount] = useState<number>(0);
  const { identifierOperations, lists } = useGlobal();

  useEffect(() => {
    let isMounted = true;

    const fetchReplyCount = async () => {
      try {
        if (!postId || !identifierOperations) return;

        // Build the identifier prefix for replies to this post
        const replyIdentifierPrefix =
          await identifierOperations.buildSearchPrefix(ENTITY_REPLY, postId);

        if (!replyIdentifierPrefix) {
          console.error('Failed to build reply identifier');
          return;
        }

        const response = await lists.fetchResourcesResultsOnly({
          service: 'DOCUMENT',
          identifier: replyIdentifierPrefix,
          limit: 0,
          prefix: true,
        });

        if (isMounted && Array.isArray(response)) {
          setReplyCount(response.length);
        }
      } catch (error) {
        console.error('Error fetching reply count:', error);
        if (isMounted) {
          setReplyCount(0);
        }
      }
    };

    fetchReplyCount();

    return () => {
      isMounted = false;
    };
  }, [postId, identifierOperations]);

  return replyCount;
}
