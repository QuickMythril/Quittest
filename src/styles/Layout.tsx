import { Outlet } from 'react-router-dom';
import { atom, useAtom, useSetAtom } from 'jotai';
import { Box, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
import { useIframe } from '../hooks/useIframeListener';
import { useInitializeProfile } from '../hooks/useInitializeProfile';
import { useInitializeName } from '../hooks/useInitializeName';
import {
  hasProfileAtom,
  isLoadingProfileAtom,
  profileNameAtom,
} from '../state/global/profile';
import { CreateProfile } from '../components/CreateProfile';
import { RefObject, useEffect, useRef } from 'react';
import { useGlobal } from 'qapp-core';
import { useFollowingStorage } from '../hooks/useFollowingStorage';
import { useNotificationStorage } from '../hooks/useNotificationStorage';

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));
export const scrollRefAtom = atom<RefObject<HTMLElement> | null>(null);

const Layout = () => {
  useIframe();
  const { auth } = useGlobal();
  const setScrollRef = useSetAtom(scrollRefAtom);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    // Attach scrollRef to the body element where scrolling happens
    scrollRef.current = document.body;
    setScrollRef(scrollRef);
  }, [setScrollRef]);

  // Initialize profile from IndexedDB cache on mount
  useInitializeProfile();

  // Check for preferred name and auto-switch before loading the app
  const { isCheckingName } = useInitializeName();

  // Initialize following storage background sync
  useFollowingStorage();

  // Initialize notification storage background sync
  useNotificationStorage();

  const [hasProfile] = useAtom(hasProfileAtom);
  const [isLoadingProfile] = useAtom(isLoadingProfileAtom);
  const [profileName] = useAtom(profileNameAtom);

  // Show loading indicator while checking for profile or name
  // Also show loading if profile name doesn't match current auth name (prevents stale data flash)
  if (
    isLoadingProfile ||
    isCheckingName ||
    (hasProfile && profileName !== auth?.name)
  ) {
    return (
      <LoadingContainer>
        <CircularProgress size={48} />
      </LoadingContainer>
    );
  }

  // If user doesn't have a profile, show the CreateProfile component
  // This blocks access to all routes until profile is created
  if (!hasProfile) {
    return <CreateProfile />;
  }

  return (
    <>
      {/* Add Header here */}
      <main>
        <Outlet /> {/* This is where page content will be rendered */}
      </main>
      {/* Add Footer here */}
    </>
  );
};

export default Layout;
