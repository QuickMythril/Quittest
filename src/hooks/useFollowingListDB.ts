import { useCallback } from 'react';
import { useGlobal } from 'qapp-core';
import { loadFollowingList, FollowedUser } from '../utils/followingStorageDB';

/**
 * Hook to manually fetch the followed users list from IndexedDB
 *
 * This hook provides a function to fetch the following list when you need it.
 * It does NOT automatically fetch or poll - you control when to fetch.
 *
 * @returns Function to fetch followed users that returns the array
 */
export function useFollowingListDB(): () => Promise<FollowedUser[]> {
  const { auth } = useGlobal();

  const fetchFollowedUsers = useCallback(async (): Promise<FollowedUser[]> => {
    const userName = auth?.name;
    if (!userName) {
      return [];
    }

    try {
      const users = await loadFollowingList(userName);
      return users;
    } catch (err) {
      console.error('Error loading followed users:', err);
      return [];
    }
  }, [auth?.name]);

  return fetchFollowedUsers;
}

/**
 * Hook to manually fetch just the count of followed users
 *
 * @returns Function to fetch the count
 */
export function useFollowingCountDB(): () => Promise<number> {
  const fetchFollowedUsers = useFollowingListDB();

  const fetchCount = useCallback(async (): Promise<number> => {
    const users = await fetchFollowedUsers();
    return users.length;
  }, [fetchFollowedUsers]);

  return fetchCount;
}

/**
 * Hook to manually check if a specific user is followed
 * @param targetUserName - The name of the user to check
 * @returns Function to fetch whether the user is followed
 */
export function useIsFollowingDB(
  targetUserName: string | null
): () => Promise<boolean> {
  const fetchFollowedUsers = useFollowingListDB();

  const checkIsFollowing = useCallback(async (): Promise<boolean> => {
    if (!targetUserName) return false;

    const users = await fetchFollowedUsers();
    return users.some((user) => user.name === targetUserName);
  }, [fetchFollowedUsers, targetUserName]);

  return checkIsFollowing;
}

/**
 * Hook to manually fetch the list of followed user names only (without identifiers)
 * Useful when you only need the names
 *
 * @returns Function to fetch array of followed user names
 */
export function useFollowedNamesDB(): () => Promise<string[]> {
  const fetchFollowedUsers = useFollowingListDB();

  const fetchNames = useCallback(async (): Promise<string[]> => {
    const users = await fetchFollowedUsers();
    return users.map((user) => user.name);
  }, [fetchFollowedUsers]);

  return fetchNames;
}
