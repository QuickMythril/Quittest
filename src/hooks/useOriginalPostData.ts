import { useState, useEffect } from 'react';

import { usePublish } from 'qapp-core';
import { PostData } from '../components/Post';

// Declare qortalRequest as a global function
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Hook to fetch the original post data when viewing a repost
 * @param post - The post that might be a repost
 * @returns The original post data if this is a repost, otherwise the post itself
 */
export function useOriginalPostData(post: PostData): PostData | null {
  const [originalPostData, setOriginalPostData] = useState<PostData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { fetchPublish } = usePublish();

  useEffect(() => {
    let isMounted = true;

    const fetchOriginalPost = async () => {
      try {
        // Check if this post has repostMetadata (meaning it's a repost)
        const isRepost = !!post.data?.repostMetadata;

        if (!isRepost) {
          // Not a repost, just use the post as-is

          return;
        }

        // This is a repost, fetch the original post data
        const {
          originalPostName,
          originalPostIdentifier,
          originalPostService,
        } = post.data.repostMetadata!;

        setIsLoading(true);

        const response = await fetchPublish({
          name: originalPostName,
          service: originalPostService,
          identifier: originalPostIdentifier,
        });

        if (isMounted && response.hasResource && response?.resource?.data) {
          // Parse the response data

          // Create the original post data structure
          const originalPost: PostData = {
            qortalMetadata: {
              name: originalPostName,
              identifier: originalPostIdentifier,
              service: originalPostService,
              created: response.resource.qortalMetadata?.created || Date.now(),
            },
            data: response?.resource?.data,
          };

          setOriginalPostData(originalPost);
        }
      } catch (error) {
        console.error('Error fetching original post data:', error);
        // error
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOriginalPost();
  }, [
    post.data?.repostMetadata?.originalPostIdentifier,
    post.data?.repostMetadata?.originalPostName,
    post.data?.repostMetadata?.originalPostService,
  ]);

  return !post?.data?.repostMetadata ? post : originalPostData;
}
