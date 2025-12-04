import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { checkNameExists } from '../utils/nameValidation';
import {
  nameValidationCacheAtom,
  NAME_CACHE_EXPIRY_MS,
  NameValidationData,
} from '../state/global/nameValidation';

interface UseNameExistsReturn {
  nameExists: boolean;
  isChecking: boolean;
  error: string | null;
  nameData: NameValidationData | null;
}

/**
 * Hook to check if a Qortal name exists on the blockchain
 * Uses cached results with 20-minute expiry to avoid repeated API calls
 * @param name - The Qortal name to check
 * @returns Object containing nameExists boolean, isChecking boolean, error, and nameData
 */
export function useNameExists(name: string): UseNameExistsReturn {
  const [cache, setCache] = useAtom(nameValidationCacheAtom);
  const [nameExists, setNameExists] = useState(true); // Assume exists by default
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameData, setNameData] = useState<NameValidationData | null>(null);

  useEffect(() => {
    const checkName = async () => {
      if (!name) {
        setIsChecking(false);
        setNameExists(false);
        setNameData(null);
        setError('No name provided');
        return;
      }

      // Check cache first
      const cached = cache.get(name);
      const now = Date.now();

      if (cached && now - cached.timestamp < NAME_CACHE_EXPIRY_MS) {
        // Cache hit and not expired
        setNameExists(cached.exists);
        setNameData(cached.data);
        setError(cached.error || null);
        setIsChecking(false);
        return;
      }

      // Cache miss or expired - fetch from API
      setIsChecking(true);
      setError(null);

      try {
        const result = await checkNameExists(name);
        
        // Update cache with new result
        const newCache = new Map(cache);
        newCache.set(name, {
          exists: result.exists,
          data: result.data,
          timestamp: now,
          error: result.error,
        });
        setCache(newCache);

        // Update state
        setNameExists(result.exists);
        setNameData(result.data);
        setError(result.error || null);
      } catch (err) {
        console.error('Error checking name existence:', err);
        const errorMessage = 'Failed to verify name existence';
        setError(errorMessage);
        // In case of error, assume name exists to avoid blocking
        setNameExists(true);
        setNameData(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkName();
  }, [name, cache, setCache]);

  return { nameExists, isChecking, error, nameData };
}

