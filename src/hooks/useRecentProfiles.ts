import { useCallback, useEffect, useState } from 'react';
import { useGlobal } from 'qapp-core';
import { UserSearchResult } from './useSearchUsers';

/**
 * Fetches the most recently published Quitter profiles.
 * Profiles are METADATA resources with the identifier created via createSingleIdentifier('profile').
 */
export function useRecentProfiles(limit = 20) {
  const { identifierOperations } = useGlobal();
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecentProfiles = useCallback(async () => {
    if (!identifierOperations?.createSingleIdentifier) return;

    setIsLoading(true);
    setError(null);

    try {
      const profileId =
        (await identifierOperations.createSingleIdentifier('profile')) || '';
      if (!profileId) {
        throw new Error('Failed to build profile identifier');
      }

      const res = await fetch(
        `/arbitrary/resources/search?service=METADATA&identifier=${encodeURIComponent(profileId)}&prefix=false&limit=${limit}&reverse=true&mode=ALL`
      );
      if (!res?.ok) {
        throw new Error('Failed to load recent profiles');
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response for recent profiles');
      }

      const seen = new Set<string>();
      const names: UserSearchResult[] = [];

      for (const item of data) {
        const name = item?.name;
        if (name && !seen.has(name)) {
          seen.add(name);
          names.push({ name });
          if (names.length >= limit) break;
        }
      }

      setResults(names);
    } catch (err) {
      console.error('Error fetching recent profiles:', err);
      setError(err instanceof Error ? err : new Error('Failed to load profiles'));
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [identifierOperations?.createSingleIdentifier, limit]);

  useEffect(() => {
    fetchRecentProfiles();
  }, [fetchRecentProfiles]);

  return {
    results,
    isLoading,
    error,
    refetch: fetchRecentProfiles,
  };
}
