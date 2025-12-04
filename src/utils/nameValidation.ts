import { NameValidationData } from '../state/global/nameValidation';

/**
 * Utility functions for validating Qortal names
 */

/**
 * Check if a Qortal name exists on the blockchain
 * @param name - The Qortal name to check
 * @returns Object with exists boolean and data if it exists
 */
export async function checkNameExists(
  name: string
): Promise<{ exists: boolean; data: NameValidationData | null; error?: string }> {
  if (!name) {
    return { exists: false, data: null, error: 'No name provided' };
  }

  try {
    const response = await fetch(`/names/${name}`);

    if (!response.ok) {
      // 404 means name doesn't exist
      if (response.status === 404) {
        return { exists: false, data: null, error: `Name "${name}" is not registered on Qortal` };
      }
      throw new Error('Failed to check name existence');
    }

    const data = await response.json();

    // Validate the response structure
    if (data && data.name === name) {
      return { exists: true, data };
    }

    return { exists: false, data: null, error: 'Invalid response from server' };
  } catch (error) {
    console.error('Error checking name existence:', error);
    // In case of network error, return error but assume name exists to avoid blocking legitimate users
    return {
      exists: true,
      data: null,
      error: error instanceof Error ? error.message : 'Network error checking name',
    };
  }
}

