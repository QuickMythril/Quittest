import { useAtomValue } from 'jotai';
import {
  followedUsersAtom,
  isLoadingFollowsAtom,
  followsErrorAtom,
  FollowedUser,
} from '../state/global/follows';

// Re-export the type for convenience
export type { FollowedUser } from '../state/global/follows';

/**
 * Hook to access the authenticated user's follows list from app-wide state
 * Does NOT trigger a fetch - use useFollowsList() to fetch the data
 * @returns The current follows state (users, loading, error)
 */
export function useFollows(): {
  followedUsers: FollowedUser[];
  isLoading: boolean;
  error: string | null;
} {
  const followedUsers = useAtomValue(followedUsersAtom);
  const isLoading = useAtomValue(isLoadingFollowsAtom);
  const error = useAtomValue(followsErrorAtom);

  return {
    followedUsers,
    isLoading,
    error,
  };
}

/**
 * Hook to check if the authenticated user is following a specific user
 * @param targetUserName - The username to check
 * @returns Boolean indicating if the user is in the follows list
 */
export function useIsFollowingFromList(targetUserName: string): boolean {
  const followedUsers = useAtomValue(followedUsersAtom);
  return followedUsers.some((user) => user.userName === targetUserName);
}
