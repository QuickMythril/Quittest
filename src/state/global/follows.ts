import { atom } from 'jotai';

export interface FollowedUser {
  userName: string;
  followIdentifier: string;
  timestamp: number;
}

// Atom to store the list of users the authenticated user is following
export const followedUsersAtom = atom<FollowedUser[]>([]);

// Atom to track if follows are currently being loaded
export const isLoadingFollowsAtom = atom<boolean>(false);

// Atom to store any error that occurred while fetching follows
export const followsErrorAtom = atom<string | null>(null);
