import { styled } from '@mui/system';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { useSearchUsers } from '../../hooks/useSearchUsers';
import { useFetchProfile } from '../../hooks/useFetchProfile';
import { useGlobal } from 'qapp-core';

const ResultsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const UserResultItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.02)',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.1)'
        : 'rgba(29, 155, 240, 0.05)',
    borderColor: theme.palette.primary.main,
    transform: 'translateX(4px)',
  },
}));

const UserInfo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const EmptyState = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
  gap: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(4),
}));

interface UserSearchResultsProps {
  onUserClick?: (userName: string) => void;
}

export function UserSearchResults({ onUserClick }: UserSearchResultsProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { auth } = useGlobal();

  const [searchQuery, setSearchQuery] = useState('');

  const { results: userResults, isLoading, searchUsers } = useSearchUsers();

  // Initialize from URL params and trigger search when query changes
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
    if (query) {
      searchUsers(query);
    }
  }, [searchParams, searchUsers]);

  const handleUserItemClick = (userName: string) => {
    if (onUserClick) {
      onUserClick(userName);
    } else {
      navigate(`/user/${userName}`);
    }
  };

  const hasResults = userResults.length > 0;

  if (isLoading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  if (!searchQuery) {
    return (
      <EmptyState>
        <PersonIcon sx={{ fontSize: 64, opacity: 0.3 }} />
        <Typography variant="h6">Search for users</Typography>
        <Typography variant="body2" color="text.secondary">
          Find people on Qortal
        </Typography>
      </EmptyState>
    );
  }

  if (!hasResults) {
    return (
      <EmptyState>
        <SearchIcon sx={{ fontSize: 64, opacity: 0.3 }} />
        <Typography variant="h6">No users found</Typography>
        <Typography variant="body2" color="text.secondary">
          Try searching for a different name
        </Typography>
      </EmptyState>
    );
  }

  return (
    <ResultsContainer>
      {userResults.map((user) => (
        <UserResultCard
          key={user.name}
          userName={user.name}
          currentUserName={auth?.name || undefined}
          onClick={() => handleUserItemClick(user.name)}
        />
      ))}
    </ResultsContainer>
  );
}

interface UserResultCardProps {
  userName: string;
  currentUserName?: string;
  onClick: () => void;
}

function UserResultCard({
  userName,
  currentUserName,
  onClick,
}: UserResultCardProps) {
  const { profile } = useFetchProfile(userName);

  return (
    <UserResultItem onClick={onClick}>
      <UserInfo>
        <Avatar
          src={
            profile?.avatar
              ? `qortal://THUMBNAIL/${profile.avatar}/tiny`
              : undefined
          }
          sx={{ width: 48, height: 48 }}
        >
          {userName[0].toUpperCase()}
        </Avatar>
        <div>
          <Typography variant="body1" fontWeight={700}>
            {userName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{userName}
          </Typography>
          {profile?.bio && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {profile.bio}
            </Typography>
          )}
        </div>
      </UserInfo>
      {currentUserName === userName && (
        <Typography
          variant="caption"
          sx={{
            backgroundColor: (theme) => theme.palette.primary.main,
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: 600,
          }}
        >
          You
        </Typography>
      )}
    </UserResultItem>
  );
}

