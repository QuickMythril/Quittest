import { EnumCollisionStrength } from 'qapp-core';
import {
  addFollowedUser,
  removeFollowedUserByName,
  FollowedUser,
} from './followingStorageDB';

/**
 * Adds a user to the following list in IndexedDB when following them
 * This should be called after successfully publishing the follow resource
 *
 * @param currentUserName - The authenticated user's name
 * @param targetUserName - The name of the user being followed
 * @param identifierOperations - The identifier operations from qapp-core
 */
export async function handleFollowUser(
  currentUserName: string,
  targetUserName: string,
  identifierOperations: any
): Promise<void> {
  try {
    if (!currentUserName || !targetUserName) {
      throw new Error('Both user names are required');
    }

    // Create the follow identifier (same logic as in followUser function)
    const followHash = await identifierOperations.hashString(
      'follow',
      EnumCollisionStrength.HIGH
    );
    const userHash = await identifierOperations.hashString(
      targetUserName,
      EnumCollisionStrength.HIGH
    );

    if (!followHash || !userHash) {
      throw new Error('Failed to create follow identifier');
    }

    const followIdentifier = followHash + userHash;

    // Add to IndexedDB
    const followedUser: FollowedUser = {
      name: targetUserName,
      identifier: followIdentifier,
      lastValidated: Date.now(),
    };

    await addFollowedUser(currentUserName, followedUser);
  } catch (error) {
    console.error('Error handling follow user in IndexedDB:', error);
    throw error;
  }
}

/**
 * Removes a user from the following list in IndexedDB when unfollowing them
 * This should be called after successfully deleting the follow resource
 *
 * @param currentUserName - The authenticated user's name
 * @param targetUserName - The name of the user being unfollowed
 */
export async function handleUnfollowUser(
  currentUserName: string,
  targetUserName: string
): Promise<void> {
  try {
    if (!currentUserName || !targetUserName) {
      throw new Error('Both user names are required');
    }

    // Remove from IndexedDB by name
    await removeFollowedUserByName(currentUserName, targetUserName);
  } catch (error) {
    console.error('Error handling unfollow user in IndexedDB:', error);
    throw error;
  }
}
