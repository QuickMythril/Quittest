import { useCallback, useEffect, useState } from 'react';
import { useGlobal } from 'qapp-core';
import { ENTITY_POST, ENTITY_ROOT } from '../constants/qdn';

export interface HashtagCount {
  tag: string;
  count: number;
}

/**
 * Fetch and parse recent hashtags from QDN posts.
 */
export function useTrendingHashtags(limit = 10) {
  const { identifierOperations } = useGlobal();
  const [tags, setTags] = useState<HashtagCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    if (!identifierOperations?.buildSearchPrefix) return;
    setIsLoading(true);
    setError(null);
    try {
      const prefix = await identifierOperations.buildSearchPrefix(
        ENTITY_POST,
        ENTITY_ROOT
      );

      const res = await fetch(
        `/arbitrary/resources/search?service=DOCUMENT&identifier=${prefix}&description=~%23&prefix=true&includemetadata=true&limit=100&reverse=true&mode=ALL`
      );
      if (!res?.ok) {
        throw new Error('Failed to load hashtags');
      }
      const response = await res.json();

      const topicCounts = new Map<string, number>();
      for (const resource of response) {
        const desc = resource?.metadata?.description;
        if (!desc || typeof desc !== 'string') continue;
        const regex = /~#(\w+)~/g;
        let match;
        while ((match = regex.exec(desc)) !== null) {
          const tag = `#${match[1].toLowerCase()}`;
          topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
        }
      }

      const sorted = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));

      setTags(sorted);
    } catch (err) {
      console.error('Error fetching trending hashtags:', err);
      setError('Failed to load hashtags');
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, [identifierOperations, limit]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { tags, isLoading, error, refetch: fetchTags };
}
