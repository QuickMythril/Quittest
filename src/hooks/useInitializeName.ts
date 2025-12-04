import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { useGlobal, useAuth } from 'qapp-core';
import { preferredNamesMapAtom } from '../state/global/profile';

/**
 * Hook to initialize the user's name from persistent storage before the app loads
 * This checks if there's a preferred name and switches to it if:
 * 1. The preferred name exists in localStorage (keyed by address)
 * 2. The preferred name is in the user's list of registered names
 * 3. The current auth.name is different from the preferred name
 */
export const useInitializeName = () => {
  const { auth } = useGlobal();
  const { switchName } = useAuth();
  const [preferredNamesMap, setPreferredNamesMap] = useAtom(
    preferredNamesMapAtom
  );
  const [isCheckingName, setIsCheckingName] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  // Get preferred name for current address
  const preferredName = auth?.address
    ? preferredNamesMap[auth.address]
    : undefined;

  useEffect(() => {
    const checkAndSwitchName = async () => {
      // Don't check if we already have or if no auth
      if (hasChecked || !auth?.address) {
        setIsCheckingName(false);
        return;
      }

      // If no preferred name is stored, just mark as checked and continue
      if (!preferredName) {
        setHasChecked(true);
        setIsCheckingName(false);
        return;
      }

      // If already on the preferred name, no need to switch
      if (auth?.name === preferredName) {
        setHasChecked(true);
        setIsCheckingName(false);
        return;
      }

      try {
        // Fetch the user's registered names to validate the preferred name
        const response = await fetch(`/names/address/${auth.address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch names');
        }
        const data = await response.json();
        const userNames: string[] = data?.map((item: any) => item?.name) || [];

        // Check if the preferred name is in the user's list of names
        if (userNames.includes(preferredName) && switchName) {
          // Auto-switch to the preferred name

          await switchName(preferredName);
        } else if (!userNames.includes(preferredName)) {
          // Preferred name is no longer valid, clear it for this address

          const { [auth.address]: _, ...rest } = preferredNamesMap;
          setPreferredNamesMap(rest);
        }
      } catch (error) {
        console.error('Error checking preferred name:', error);
        // Don't block the app from loading if there's an error
        // Just clear the preference to be safe
        if (auth?.address) {
          const { [auth.address]: _, ...rest } = preferredNamesMap;
          setPreferredNamesMap(rest);
        }
      } finally {
        setHasChecked(true);
        setIsCheckingName(false);
      }
    };

    checkAndSwitchName();
  }, [
    auth?.address,
    auth?.name,
    preferredName,
    switchName,
    preferredNamesMap,
    setPreferredNamesMap,
    hasChecked,
  ]);

  return { isCheckingName };
};
