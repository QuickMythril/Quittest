import { useCallback, useEffect, useRef, useState } from 'react';
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
  const requestIdRef = useRef(0);

  const fetchRecentProfiles = useCallback(async () => {
    if (!identifierOperations?.createSingleIdentifier) return;

    setIsLoading(true);
    setError(null);
    const requestId = ++requestIdRef.current;

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

      // Fetch post counts for these users
      const withCounts = await Promise.all(
        names.map(async (user) => {
          try {
            const res = await fetch(
              `/arbitrary/resources/search?service=DOCUMENT&identifier=&name=${encodeURIComponent(user.name)}&prefix=false&limit=0&reverse=false&mode=ALL`
            );
            if (res?.ok) {
              const resources = await res.json();
              const postCount = Array.isArray(resources)
                ? resources.length
                : undefined;
              return { ...user, postCount };
            }
          } catch (err) {
            console.error('Failed to fetch post count for', user.name, err);
          }
          return user;
        })
      );

      if (requestId === requestIdRef.current) {
        setResults(withCounts);
      }
    } catch (err) {
      console.error('Error fetching recent profiles:', err);
      setError(err instanceof Error ? err : new Error('Failed to load profiles'));
      setResults([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
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
