import { styled } from '@mui/system';
import { useFollowersList } from '../hooks/useFollowersList';
import { CircularProgress, Typography, Avatar, Box } from '@mui/material';

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

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
}));

interface FollowersListProps {
  userName: string;
  onUserClick?: (userName: string) => void;
}

/**
 * Component to display the list of users following a specific user
 */
export function FollowersList({ userName, onUserClick }: FollowersListProps) {
  const { followers, isLoading, error } = useFollowersList(userName);

  if (isLoading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <Container>
        <EmptyState>
          <Typography variant="h6" gutterBottom>
            Unable to load followers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please try again in a moment.
          </Typography>
        </EmptyState>
      </Container>
    );
  }

  if (followers.length === 0) {
    return (
      <Container>
        <EmptyState>
          <Typography variant="h6" gutterBottom>
            No followers yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When people follow @{userName}, they'll appear here
          </Typography>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      {followers.map((follower) => (
        <UserItem
          key={follower.followIdentifier}
          onClick={() => onUserClick?.(follower.userName)}
        >
          <UserAvatar
            src={`/arbitrary/THUMBNAIL/${follower.userName}/qortal_avatar?async=true`}
            alt={`${follower.userName} avatar`}
          >
            {follower.userName[0]}
          </UserAvatar>
          <UserInfo>
            <Typography variant="body1" fontWeight={600}>
              {follower.userName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{follower.userName}
            </Typography>
          </UserInfo>
        </UserItem>
      ))}
    </Container>
  );
}
