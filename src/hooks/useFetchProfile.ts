import { useState, useEffect, useCallback } from 'react';
import { useGlobal } from 'qapp-core';
import { fetchProfileFromQdn } from '../utils/profileQdn';

interface Profile {
  bio: string;
  qortalName?: string;
  avatar?: string;
}

interface UseFetchProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a user's profile from QDN
 * @param qortalName - The Qortal name of the user whose profile to fetch
 * @param options - Configuration options
 * @returns Profile data, loading state, error state, and refetch function
 */
export const useFetchProfile = (
  qortalName?: string,
  options?: {
    fetchOnMount?: boolean;
  }
): UseFetchProfileReturn => {
  const { identifierOperations } = useGlobal();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnMount = options?.fetchOnMount ?? true;

  const fetchProfile = useCallback(async () => {
    if (!qortalName) {
      setProfile(null);
      setError('No Qortal name provided');
      return;
    }

    if (!identifierOperations) {
      setError('Identifier operations not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchProfileFromQdn(qortalName, identifierOperations);
      
      if (result.error) {
        setError(result.error);
        setProfile(null);
      } else {
        setProfile(result.profile);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [qortalName, identifierOperations]);

  useEffect(() => {
    if (fetchOnMount && qortalName && identifierOperations) {
      fetchProfile();
    }
  }, [fetchOnMount, qortalName, identifierOperations, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
};

