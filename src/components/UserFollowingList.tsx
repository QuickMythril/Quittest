import { styled } from '@mui/system';
import { useFollowingList } from '../hooks/useFollowingList';
import { Typography, Avatar, Box, Skeleton } from '@mui/material';
import { useCallback, useMemo } from 'react';
import {
  QortalMetadata,
  QortalSearchParams,
  ResourceListDisplay,
  LoaderListStatus,
} from 'qapp-core';

const Container = styled('div')(({ theme }) => ({
  padding: theme.spacing(2, 0),
}));

const UserItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  border: `2px solid ${theme.palette.primary.main}`,
}));

const UserInfo = styled('div')({
  flex: 1,
});

const EmptyState = styled('div')(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(8, 4),
  color: theme.palette.text.secondary,
}));

const SkeletonUserContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  width: '100%',
  animation: 'pulse 1.5s ease-in-out infinite',
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.85,
    },
  },
}));

interface UserFollowingListProps {
  userName: string;
  onUserClick?: (userName: string) => void;
}

/**
 * Component to display the list of users that a specific user is following
 */
export function UserFollowingList({
  userName,
  onUserClick,
}: UserFollowingListProps) {
  const { followHashIdentifier, error } = useFollowingList(userName);

  // Search configuration for following users
  const followingSearch = useMemo((): QortalSearchParams | null => {
    if (!followHashIdentifier) return null;

    return {
      service: 'DOCUMENT',
      name: userName,
      identifier: followHashIdentifier,
      limit: 20,
      reverse: true,
    };
  }, [userName, followHashIdentifier]);

  // Render each user item
  const renderUser = useCallback(
    (item: { qortalMetadata: QortalMetadata; data: any }, _index: number) => {
      // The followedName is stored in the data
      const followedUserName = item.data?.followedName;

      if (!followedUserName) {
        return null;
      }

      return (
        <UserItem
          key={item.qortalMetadata.identifier}
          onClick={() => onUserClick?.(followedUserName)}
          sx={{
            width: '100%',
          }}
        >
          <UserAvatar
            src={`/arbitrary/THUMBNAIL/${followedUserName}/qortal_avatar?async=true`}
            alt={`${followedUserName} avatar`}
          >
            {followedUserName[0].toUpperCase()}
          </UserAvatar>
          <UserInfo>
            <Typography variant="body1" fontWeight={600}>
              {followedUserName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{followedUserName}
            </Typography>
          </UserInfo>
        </UserItem>
      );
    },
    [onUserClick]
  );

  // Loader item for loading state - shows skeleton user item
  const loaderItem = useCallback(() => {
    return (
      <SkeletonUserContainer>
        {/* Avatar skeleton */}
        <Box sx={{ flexShrink: 0 }}>
          <Skeleton
            variant="circular"
            width={48}
            height={48}
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.11)'
                  : 'rgba(0, 0, 0, 0.11)',
            }}
          />
        </Box>

        {/* User info skeleton */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton
            variant="text"
            width="40%"
            height={24}
            sx={{
              mb: 0.5,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.11)'
                  : 'rgba(0, 0, 0, 0.11)',
            }}
          />
          <Skeleton
            variant="text"
            width="30%"
            height={20}
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)',
            }}
          />
        </Box>
      </SkeletonUserContainer>
    );
  }, []);

  // Loader list for different states
  const loaderList = useCallback(
    (status: LoaderListStatus) => {
      if (status === 'NO_RESULTS') {
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                fontSize: '40px',
              }}
            >
              👥
            </Box>
            <Box
              sx={{
                textAlign: 'center',
                maxWidth: 400,
              }}
            >
              <Box
                sx={{
                  fontSize: '20px',
                  fontWeight: 600,
                  mb: 1,
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                Not following anyone yet
              </Box>
              <Box
                sx={{
                  fontSize: '15px',
                  color: (theme) => theme.palette.text.secondary,
                  lineHeight: 1.5,
                }}
              >
                When @{userName} follows people, they'll appear here
              </Box>
            </Box>
          </Box>
        );
      }

      // Loading state
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 4,
          }}
        >
          {/* Show multiple skeleton items while loading */}
          <Box sx={{ width: '100%' }}>
            {[1, 2, 3].map((i) => (
              <Box key={i}>{loaderItem()}</Box>
            ))}
          </Box>
        </Box>
      );
    },
    [userName, loaderItem]
  );

  if (error) {
    return (
      <Container>
        <EmptyState>
          <Typography color="error">{error}</Typography>
        </EmptyState>
      </Container>
    );
  }

  if (!followingSearch) {
    return (
      <Box sx={{ width: '100%' }}>
        {[1, 2, 3].map((i) => (
          <Box key={i}>{loaderItem()}</Box>
        ))}
      </Box>
    );
  }

  return (
    <Container>
      <ResourceListDisplay
        styles={{
          gap: 0,
        }}
        retryAttempts={3}
        listName={`user-following-${userName}`}
        direction="VERTICAL"
        disableVirtualization
        returnType="JSON"
        search={followingSearch}
        listItem={renderUser}
        loaderItem={loaderItem}
        loaderList={loaderList}
      />
    </Container>
  );
}
