/**
 * EXAMPLE FILE - Shows how to use the IndexedDB Following Storage System
 *
 * This file demonstrates the proper usage of the following storage hooks and utilities.
 * DO NOT import this file in production code - it's for reference only.
 */

import { useEffect, useState } from 'react';
import { useGlobal } from 'qapp-core';
import { useFollowingStorage } from './useFollowingStorage';
import {
  useFollowingListDB,
  useFollowingCountDB,
  useIsFollowingDB,
  useFollowedNamesDB,
} from './useFollowingListDB';
import {
  handleFollowUser,
  handleUnfollowUser,
} from '../utils/followingHelpers';
import { followUser, unfollowUser } from '../utils/postQdn';

/**
 * STEP 1: App-wide initialization
 *
 * Add this hook at the top level of your app (e.g., in App.tsx or main feed page)
 * This hook will automatically sync the following list in the background
 */
export function AppWithFollowingSync() {
  // Initialize the background sync - does not cause re-renders
  useFollowingStorage();

  return <div>{/* Your app content */}</div>;
}

/**
 * STEP 2: Reading the following list
 *
 * Use these hooks to get functions that fetch data when you need it
 */
export function FollowingListExample() {
  const [followedUsers, setFollowedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get the fetch functions from hooks
  const fetchFollowedUsers = useFollowingListDB();
  const fetchFollowingCount = useFollowingCountDB();
  const checkIsFollowingAlice = useIsFollowingDB('Alice');
  const fetchFollowedNames = useFollowedNamesDB();

  // Manually fetch data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const users = await fetchFollowedUsers();
      setFollowedUsers(users);
      setIsLoading(false);
    };
    loadData();
  }, [fetchFollowedUsers]);

  const handleRefresh = async () => {
    setIsLoading(true);

    // Fetch different types of data
    const users = await fetchFollowedUsers();
    const count = await fetchFollowingCount();
    const isFollowingAlice = await checkIsFollowingAlice();
    const names = await fetchFollowedNames();

    setFollowedUsers(users);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div>Loading following list...</div>;
  }

  return (
    <div>
      <h2>Following {followedUsers.length} users</h2>
      <ul>
        {followedUsers.map((user) => (
          <li key={user.identifier}>
            {user.name}
            <small>
              {' '}
              (Last validated: {new Date(user.lastValidated).toLocaleString()})
            </small>
          </li>
        ))}
      </ul>
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
}

/**
 * STEP 3: Following a user
 *
 * When the user clicks "Follow", call followUser and then update IndexedDB
 */
export function FollowButtonExample({
  targetUserName,
}: {
  targetUserName: string;
}) {
  const { auth, identifierOperations } = useGlobal();
  const [isFollowing, setIsFollowing] = useState(false);
  const checkIsFollowing = useIsFollowingDB(targetUserName);

  // Check if following on mount
  useEffect(() => {
    const check = async () => {
      const following = await checkIsFollowing();
      setIsFollowing(following);
    };
    check();
  }, [checkIsFollowing]);

  const handleFollow = async () => {
    if (!auth?.name || !identifierOperations) return;

    try {
      // 1. Publish the follow resource to the blockchain
      await followUser(
        targetUserName,
        identifierOperations,
        auth.name,
        () => {} // addNewResources function from your app
      );

      // 2. Add to IndexedDB immediately for instant UI update
      await handleFollowUser(auth.name, targetUserName, identifierOperations);

      // 3. Update local state
      setIsFollowing(true);
    } catch (error) {
      console.error('Error following user:', error);
      alert('Failed to follow user');
    }
  };

  const handleUnfollow = async () => {
    if (!auth?.name || !identifierOperations) return;

    try {
      // 1. Delete the follow resource from the blockchain
      await unfollowUser(
        targetUserName,
        identifierOperations,
        auth.name,
        async () => true // deleteResourceFn from your app
      );

      // 2. Remove from IndexedDB immediately for instant UI update
      await handleUnfollowUser(auth.name, targetUserName);

      // 3. Update local state
      setIsFollowing(false);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      alert('Failed to unfollow user');
    }
  };

  return (
    <button onClick={isFollowing ? handleUnfollow : handleFollow}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
}

/**
 * STEP 4: Main Feed - Load following list once
 *
 * In your main feed page, you can grab the data once and use it
 */
export function MainFeedExample() {
  const [followedNames, setFollowedNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchFollowedNames = useFollowedNamesDB();

  useEffect(() => {
    // Fetch the following list when feed loads
    const loadFollowing = async () => {
      setIsLoading(true);
      const names = await fetchFollowedNames();
      setFollowedNames(names);
      setIsLoading(false);
    };

    loadFollowing();
  }, [fetchFollowedNames]);

  if (isLoading) {
    return <div>Loading feed...</div>;
  }

  return (
    <div>
      <h1>Feed</h1>
      <p>Showing posts from {followedNames.length} followed users</p>
      {/* Your feed content - filter posts by followedNames */}
    </div>
  );
}

/**
 * COMPLETE INTEGRATION EXAMPLE
 *
 * Here's how to integrate everything in your App.tsx:
 */
export function CompleteAppExample() {
  const { auth } = useGlobal();

  // Initialize the background sync (do this once at the app level)
  useFollowingStorage();

  if (!auth?.name) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <header>
        <h1>Qortal Social</h1>
        <p>Welcome, {auth.name}</p>
      </header>
      <MainFeedExample />
    </div>
  );
}

/**
 * PERFORMANCE NOTES:
 *
 * 1. useFollowingStorage() runs in the background and does NOT cause re-renders
 * 2. All hooks return fetch functions - YOU control when to fetch data
 * 3. Data is fetched in batches of 5 every 3 minutes by background sync
 * 4. Validation runs every 30 minutes to remove stale data
 * 5. IndexedDB can handle large datasets (millions of records)
 *
 * BEST PRACTICES:
 *
 * 1. Call useFollowingStorage() only once at the app level
 * 2. All hooks return functions - call them when you need the data
 * 3. Use useIsFollowingDB() for checking single users (more efficient)
 * 4. Use useFollowingCountDB() if you only need the count
 * 5. Use useFollowedNamesDB() for filtering posts (most efficient)
 * 6. Call handleFollowUser/handleUnfollowUser after publishing to blockchain
 * 7. The storage key includes the username, so multiple users can use the same browser
 * 8. Manage loading states in your components
 */
