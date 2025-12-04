import { atom } from 'jotai';

/**
 * Interface for cached name validation data
 */
export interface NameValidationData {
  name: string;
  reducedName: string;
  owner: string;
  data: string;
  registered: number;
  isForSale: boolean;
}

/**
 * Interface for cached name validation entry with expiry
 */
interface CachedNameValidation {
  exists: boolean;
  data: NameValidationData | null;
  timestamp: number;
  error?: string;
}

/**
 * Cache expiry time: 20 minutes in milliseconds
 */
export const NAME_CACHE_EXPIRY_MS = 20 * 60 * 1000;

/**
 * Atom to store name validation cache
 * Key: Qortal name
 * Value: Cached validation result with timestamp
 */
export const nameValidationCacheAtom = atom<Map<string, CachedNameValidation>>(
  new Map()
);

