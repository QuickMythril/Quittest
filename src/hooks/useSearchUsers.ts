import { useState, useCallback, useRef, useEffect } from 'react';

export interface UserSearchResult {
  name: string;
  // Add more fields as needed
}

/**
 * Hook to search for users on Qortal with debouncing
 */
export function useSearchUsers() {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    try {
      const response = await qortalRequest({
        action: 'SEARCH_NAMES',
        query: query,
        limit: 20,
      });

      const users: UserSearchResult[] = [];

      if (response && Array.isArray(response)) {
        response.forEach((nameData: any) => {
          const name = nameData.name || nameData;
          if (name) {
            users.push({ name });
          }
        });
      }

      setResults(users);
    } catch (err) {
      console.error('Error searching users:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to search users')
      );
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    searchUsers,
  };
}
