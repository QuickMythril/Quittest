import localforage from 'localforage';

// Configure localforage for following data
const followingDB = localforage.createInstance({
  name: 'Quitter-App',
  storeName: 'following',
  description: 'Stores followed user names and identifiers',
});

export interface FollowedUser {
  name: string; // The actual followed user's name (from data.followedName)
  identifier: string; // The resource identifier
  lastValidated: number; // Timestamp of last validation
}

/**
 * Gets the storage key for a specific user's following list
 */
export function getFollowingStorageKey(userName: string): string {
  return `following_${userName}`;
}

/**
 * Loads the following list for a user from IndexedDB
 * @param userName - The authenticated user's name
 * @returns Array of followed users
 */
export async function loadFollowingList(
  userName: string
): Promise<FollowedUser[]> {
  try {
    const key = getFollowingStorageKey(userName);
    const data = await followingDB.getItem<FollowedUser[]>(key);
    return data || [];
  } catch (error) {
    console.error('Error loading following list from IndexedDB:', error);
    return [];
  }
}

/**
 * Saves the following list for a user to IndexedDB
 * @param userName - The authenticated user's name
 * @param followedUsers - Array of followed users to save
 */
export async function saveFollowingList(
  userName: string,
  followedUsers: FollowedUser[]
): Promise<void> {
  try {
    const key = getFollowingStorageKey(userName);
    await followingDB.setItem(key, followedUsers);
  } catch (error) {
    console.error('Error saving following list to IndexedDB:', error);
    throw error;
  }
}

/**
 * Adds a followed user to the list
 * @param userName - The authenticated user's name
 * @param followedUser - The user to add
 */
export async function addFollowedUser(
  userName: string,
  followedUser: FollowedUser
): Promise<void> {
  try {
    const currentList = await loadFollowingList(userName);

    // Check if already exists
    const exists = currentList.some(
      (user) => user.identifier === followedUser.identifier
    );

    if (!exists) {
      currentList.push(followedUser);
      await saveFollowingList(userName, currentList);
    }
  } catch (error) {
    console.error('Error adding followed user:', error);
    throw error;
  }
}

/**
 * Removes a followed user from the list by identifier
 * @param userName - The authenticated user's name
 * @param identifier - The identifier of the user to remove
 */
export async function removeFollowedUser(
  userName: string,
  identifier: string
): Promise<void> {
  try {
    const currentList = await loadFollowingList(userName);
    const filteredList = currentList.filter(
      (user) => user.identifier !== identifier
    );
    await saveFollowingList(userName, filteredList);
  } catch (error) {
    console.error('Error removing followed user:', error);
    throw error;
  }
}

/**
 * Removes a followed user from the list by name
 * @param userName - The authenticated user's name
 * @param followedName - The name of the user to remove
 */
export async function removeFollowedUserByName(
  userName: string,
  followedName: string
): Promise<void> {
  try {
    const currentList = await loadFollowingList(userName);
    const filteredList = currentList.filter(
      (user) => user.name !== followedName
    );
    await saveFollowingList(userName, filteredList);
  } catch (error) {
    console.error('Error removing followed user by name:', error);
    throw error;
  }
}

/**
 * Checks if a user is in the following list
 * @param userName - The authenticated user's name
 * @param followedName - The name to check
 * @returns True if the user is followed
 */
export async function isUserFollowed(
  userName: string,
  followedName: string
): Promise<boolean> {
  try {
    const currentList = await loadFollowingList(userName);
    return currentList.some((user) => user.name === followedName);
  } catch (error) {
    console.error('Error checking if user is followed:', error);
    return false;
  }
}

/**
 * Gets a followed user by identifier
 * @param userName - The authenticated user's name
 * @param identifier - The identifier to search for
 * @returns The followed user or null if not found
 */
export async function getFollowedUserByIdentifier(
  userName: string,
  identifier: string
): Promise<FollowedUser | null> {
  try {
    const currentList = await loadFollowingList(userName);
    return currentList.find((user) => user.identifier === identifier) || null;
  } catch (error) {
    console.error('Error getting followed user by identifier:', error);
    return null;
  }
}

/**
 * Clears all following data for a user
 * @param userName - The authenticated user's name
 */
export async function clearFollowingList(userName: string): Promise<void> {
  try {
    const key = getFollowingStorageKey(userName);
    await followingDB.removeItem(key);
  } catch (error) {
    console.error('Error clearing following list:', error);
    throw error;
  }
}

export default followingDB;
