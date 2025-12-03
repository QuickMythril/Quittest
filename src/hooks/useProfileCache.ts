import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { hasProfileAtom } from '../state/global/profile';
import { clearProfileCache, loadProfileFromCache } from '../utils/profileCache';

/**
 * Hook to automatically manage profile cache
 * Checks for expired cache periodically and provides cleanup function
 * This should be called once the profile is confirmed on the blockchain
 * or when the app determines the cached data is no longer needed
 */
export const useProfileCache = () => {
  const [hasProfile] = useAtom(hasProfileAtom);

  useEffect(() => {
    if (!hasProfile) {
      return;
    }

    // Set up a timer to check and clear expired cache
    // This runs every minute to clean up if cache has expired
    const intervalId = setInterval(async () => {
      // Check if cache is still valid
      const cached = await loadProfileFromCache();
      if (!cached) {
        // Cache has expired or been cleared
        // You might want to handle this case (e.g., fetch from blockchain)
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [hasProfile]);

  return {
    clearCache: clearProfileCache,
  };
};
