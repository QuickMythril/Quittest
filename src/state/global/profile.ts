import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Atom to track if the user has a profile
// This will be updated after checking the cache
export const hasProfileAtom = atom<boolean>(false);

// Atom to store profile data (can be expanded as needed)
export const profileDataAtom = atom<{
  bio: string;
  qortalName?: string;
  avatar?: string;
} | null>(null);

// Atom to track if profile is being fetched/initialized
export const isLoadingProfileAtom = atom<boolean>(true);

// Atom to track which name the current profile data is for
// This prevents showing stale profile data when name changes
export const profileNameAtom = atom<string | null>(null);

// Store map of address -> preferred name for multi-account support
// This allows each address to remember which name they prefer to use
export const preferredNamesMapAtom = atomWithStorage<Record<string, string>>(
  'preferred_qortal_names_by_address',
  {}
);

