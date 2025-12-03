import { useState, useEffect } from 'react';
import { usePublish } from 'qapp-core';
import { PostData } from '../utils/postQdn';

/**
 * Hook to fetch parent post data when viewing a reply
 * @param location - The location field from a reply post
 * @returns Parent post data, loading state, and resource availability
 */
export function useParentPost(location?: {
  name: string;
  identifier: string;
  service: string;
}) {
  const [parentPost, setParentPost] = useState<PostData | null>(null);
  const [isLoadingParent, setIsLoadingParent] = useState(false);
  const { fetchPublish } = usePublish();

  useEffect(() => {
    let isMounted = true;

    const fetchParentPost = async () => {
      // If no location, don't fetch anything
      if (!location) {
        setParentPost(null);
        return;
      }

      try {
        setIsLoadingParent(true);

        const response = await fetchPublish({
          name: location.name,
          service: location.service,
          identifier: location.identifier,
        });

        if (isMounted && response.hasResource && response?.resource?.data) {
          // Create the parent post data structure
          const parent: PostData = {
            qortalMetadata: {
              name: location.name,
              identifier: location.identifier,
              service: location.service,
              created: response.resource.qortalMetadata?.created || Date.now(),
            },
            data: response.resource.data,
          };

          setParentPost(parent);
        }
      } catch (error) {
        console.error('Error fetching parent post data:', error);
      } finally {
        if (isMounted) {
          setIsLoadingParent(false);
        }
      }
    };

    fetchParentPost();

    return () => {
      isMounted = false;
    };
  }, [location?.name, location?.identifier, location?.service, fetchPublish]);

  return {
    parentPost,
    isLoadingParent,
  };
}

