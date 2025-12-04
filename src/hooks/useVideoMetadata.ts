import { useState, useEffect, useMemo } from 'react';
import { usePublish } from 'qapp-core';

export interface VideoMetadataDocument {
  title: string;
  version: number;
  fullDescription: string;
  htmlDescription: string;
  videoImage?: string;
  videoReference: {
    name: string;
    identifier: string;
    service: string;
  };
  extracts?: string[];
  commentsId?: string;
  category: number;
  subcategory?: number;
  code?: string;
  videoType: string;
  filename: string;
  fileSize: number;
  duration: number;
}

export interface VideoWithMetadata {
  videoUrl: string;
  metadata: VideoMetadataDocument;
  metadataIdentifier: string;
  metadataName: string;
}

/**
 * Hook to fetch video metadata documents and return video URLs with metadata
 * Works similar to useOriginalPostData for reposts
 * @param videos - Array of video references with metadata identifiers
 * @returns Array of videos with fetched metadata
 */
export function useVideoMetadata(
  videos:
    | Array<{ identifier: string; name: string; service: string }>
    | undefined
): { videosWithMetadata: VideoWithMetadata[]; isLoading: boolean } {
  const [videosWithMetadata, setVideosWithMetadata] = useState<
    VideoWithMetadata[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchPublish } = usePublish();

  // Create stable identifiers string for dependency array (similar to useOriginalPostData pattern)
  const videoIdentifiers = useMemo(
    () =>
      videos?.map((v) => `${v.name}-${v.identifier}-${v.service}`).join('|') ||
      '',
    [videos]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchMetadata = async () => {
      try {
        // No videos to fetch
        if (!videos || videos.length === 0) {
          if (isMounted) {
            setVideosWithMetadata([]);
          }
          return;
        }

        setIsLoading(true);
        const results: VideoWithMetadata[] = [];

        for (const video of videos) {
          try {
            // Fetch the metadata document
            const response = await fetchPublish({
              name: video.name,
              service: video.service as any, // Should be 'DOCUMENT'
              identifier: video.identifier,
            });

            if (isMounted && response.hasResource && response?.resource?.data) {
              // Parse the metadata document
              const metadata = response.resource.data as VideoMetadataDocument;

              // Construct the video URL from the videoReference
              const videoUrl = `/arbitrary/${metadata.videoReference.service}/${metadata.videoReference.name}/${metadata.videoReference.identifier}`;

              results.push({
                videoUrl,
                metadata,
                metadataIdentifier: video.identifier,
                metadataName: video.name,
              });
            } else {
              console.warn(
                'useVideoMetadata: No resource found or invalid response:',
                response
              );
            }
          } catch (error) {
            console.error('Error fetching video metadata:', error);
            // Continue fetching other videos even if one fails
          }
        }

        if (isMounted) {
          setVideosWithMetadata(results);
        }
      } catch (error) {
        console.error('Error in video metadata fetch:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMetadata();

    return () => {
      isMounted = false;
    };
  }, [videoIdentifiers]); // Added fetchPublish to dependency array

  return { videosWithMetadata, isLoading };
}
