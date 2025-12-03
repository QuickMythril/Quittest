import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { useGlobal } from 'qapp-core';
import { hasProfileAtom, profileDataAtom, isLoadingProfileAtom, profileNameAtom } from '../state/global/profile';
import { loadProfileFromCache, saveProfileToCache } from '../utils/profileCache';
import { fetchProfileFromQdn } from '../utils/profileQdn';

/**
 * Hook to initialize profile data from IndexedDB cache or QDN on app load
 * This should be called once at the app root level
 * 
 * Flow:
 * 1. Check IndexedDB cache first (fast)
 * 2. If not in cache, fetch from QDN (authoritative source)
 * 3. If found on QDN, cache it for faster subsequent loads
 * 4. Only if profile doesn't exist anywhere, user will see CreateProfile form
 */
export const useInitializeProfile = () => {
  const { auth, identifierOperations } = useGlobal();
  const [, setHasProfile] = useAtom(hasProfileAtom);
  const [, setProfileData] = useAtom(profileDataAtom);
  const [, setIsLoadingProfile] = useAtom(isLoadingProfileAtom);
  const [, setProfileName] = useAtom(profileNameAtom);
  const previousNameRef = useRef<string | null>(null);

  useEffect(() => {
    // Immediately set loading state; clear profile only when name changes
    // to avoid stale data flashes while keeping existing state when name is stable
    setIsLoadingProfile(true);

    if (previousNameRef.current !== auth?.name) {
      setHasProfile(false);
      setProfileData(null);
      setProfileName(null);
      previousNameRef.current = auth?.name ?? null;
    }

    const initializeProfile = async () => {
      // Only try to load if user is authenticated and has a name
      if (!auth?.name || !identifierOperations) {
        setIsLoadingProfile(false);
        setHasProfile(false);
        setProfileData(null);
        setProfileName(null);
        return;
      }

      try {
        // Step 1: Check cache first (fast)
        const cachedProfile = await loadProfileFromCache(auth.name);
        
        if (cachedProfile) {
          setProfileData(cachedProfile);
          setHasProfile(true);
          setProfileName(auth.name);
          setIsLoadingProfile(false);
          return;
        }

        // Step 2: Cache miss - fetch from QDN (authoritative source)
        const { profile, error } = await fetchProfileFromQdn(auth.name, identifierOperations);
        
        if (profile) {
          // Profile exists on QDN
          setProfileData(profile);
          setHasProfile(true);
          setProfileName(auth.name);
          
          // Cache it for future page loads (5 minute expiry)
          await saveProfileToCache(auth.name, profile);
        } else {
          // Profile doesn't exist - clear state and let user create profile
          setHasProfile(false);
          setProfileData(null);
          setProfileName(null);
        }
      } catch (error) {
        console.error('Error initializing profile:', error);
        // Error occurred - assume no profile and let user create one
        setHasProfile(false);
        setProfileData(null);
        setProfileName(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    initializeProfile();
  }, [auth?.name, identifierOperations, setHasProfile, setProfileData, setIsLoadingProfile, setProfileName]);
};
