import { useCallback } from 'react';
import { useGlobal } from 'qapp-core';
import {
  StoredFollowedName,
  loadStoredFollowedNames,
} from './useFollowedNamesSync';

export type { StoredFollowedName } from './useFollowedNamesSync';

/**
 * Hook to read followed names from persistent storage.
 *
 * This hook has NO side effects - it only returns a function to fetch names.
 * Call the returned function whenever you need the current list from storage.
 *
 * @returns fetchNames function
 */
export function useFollowedNames(): () => {
  names: StoredFollowedName[];
  nameStrings: string[];
} | null {
  const { auth } = useGlobal();

  const fetchNames = useCallback(() => {
    if (!auth?.name) {
      return null;
    }

    const names = loadStoredFollowedNames(auth.name);
    return {
      names,
      nameStrings: names.map((n) => n.name),
    };
  }, [auth?.name]);

  return fetchNames;
}
