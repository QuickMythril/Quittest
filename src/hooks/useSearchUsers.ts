import { useState, useCallback, useRef, useEffect } from 'react';
import { useGlobal } from 'qapp-core';
import { ENTITY_POST, ENTITY_ROOT } from '../constants/qdn';

export interface UserSearchResult {
  name: string;
  postCount?: number;
}

/**
 * Hook to search for users on Qortal with debouncing
 */
export function useSearchUsers() {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const { identifierOperations } = useGlobal();

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const requestId = ++requestIdRef.current;

    try {
      const postPrefix = identifierOperations?.buildSearchPrefix
        ? await identifierOperations.buildSearchPrefix(
            ENTITY_POST,
            ENTITY_ROOT
          )
        : null;

      const response = await qortalRequest({
        action: 'SEARCH_NAMES',
        query: query,
        limit: 20,
      });

      let users: UserSearchResult[] = [];

      if (response && Array.isArray(response)) {
        response.forEach((nameData: any) => {
          const name = nameData.name || nameData;
          if (name) {
            users.push({ name });
          }
        });
      }

      let usersWithCounts = users;

      if (postPrefix) {
        usersWithCounts = await Promise.all(
          users.map(async (user) => {
            try {
              const countRes = await qortalRequest({
                action: 'SEARCH_QDN_RESOURCES',
                service: 'DOCUMENT',
                name: user.name,
                identifier: postPrefix,
                limit: 1000,
                prefix: true,
                reverse: false,
              });

              const postCount = Array.isArray(countRes)
                ? countRes.length
                : undefined;
              return { ...user, postCount };
            } catch (err) {
              console.error('Error fetching post count for user', user.name, err);
              return user;
            }
          })
        );
      }

      if (requestId === requestIdRef.current) {
        setResults(usersWithCounts);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to search users')
      );
      setResults([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    searchUsers,
  };
}
