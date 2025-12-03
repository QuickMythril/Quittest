/**
 * Profile QDN Utilities
 * 
 * Handles fetching and managing user profiles from the Qortal Data Network (QDN)
 */

// Declare qortalRequest as a global function (provided by Qortal runtime)
declare global {
  function qortalRequest(params: any): Promise<any>;
}

interface Profile {
  bio: string;
  qortalName?: string;
  avatar?: string;
}

/**
 * Fetch a user's profile from QDN
 * @param qortalName - The Qortal name of the user whose profile to fetch
 * @param identifierOperations - The identifier operations from useGlobal()
 * @returns Profile data or null if not found
 */
export const fetchProfileFromQdn = async (
  qortalName: string,
  identifierOperations: {
    createSingleIdentifier: (partialIdentifier: string) => Promise<string>;
  }
): Promise<{ profile: Profile | null; error: string | null }> => {
  try {
    if (!qortalName) {
      return { profile: null, error: 'Qortal name is required' };
    }

    // Build the same identifier that was used when publishing
    const identifier = await identifierOperations.createSingleIdentifier("profile");
    
    if (!identifier) {
      return { profile: null, error: 'Failed to build profile identifier' };
    }

    // Fetch the resource from QDN
    const response = await qortalRequest({
      action: 'FETCH_QDN_RESOURCE',
      name: qortalName,
      service: 'METADATA',
      identifier: identifier,
    });
    if (!response) {
      return { profile: null, error: 'Profile not found' };
    }

    // // The response should be base64 encoded, decode it
    const profileData = response as Profile;

    return { profile: profileData, error: null };
  } catch (error) {
    console.error('Error fetching profile from QDN:', error);
    return {
      profile: null,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    };
  }
};

/**
 * Fetch multiple profiles from QDN
 * @param qortalNames - Array of Qortal names to fetch profiles for
 * @param identifierOperations - The identifier operations from useGlobal()
 * @returns Map of Qortal names to their profiles
 */
export const fetchMultipleProfilesFromQdn = async (
  qortalNames: string[],
  identifierOperations: {
    createSingleIdentifier: (partialIdentifier: string) => Promise<string>;
  }
): Promise<Map<string, Profile | null>> => {
  const results = new Map<string, Profile | null>();

  await Promise.all(
    qortalNames.map(async (name) => {
      const { profile } = await fetchProfileFromQdn(name, identifierOperations);
      results.set(name, profile);
    })
  );

  return results;
};

/**
 * Check if a user has a published profile on QDN
 * @param qortalName - The Qortal name to check
 * @param identifierOperations - The identifier operations from useGlobal()
 * @returns Boolean indicating if profile exists
 */
export const hasPublishedProfile = async (
  qortalName: string,
  identifierOperations: {
    createSingleIdentifier: (partialIdentifier: string) => Promise<string>;
  }
): Promise<boolean> => {
  try {
    const { profile } = await fetchProfileFromQdn(qortalName, identifierOperations);
    return profile !== null;
  } catch (error) {
    console.error('Error checking for published profile:', error);
    return false;
  }
};

