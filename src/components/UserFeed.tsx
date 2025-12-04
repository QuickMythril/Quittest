import { styled } from '@mui/system';
import {
  Typography,
  IconButton,
  Avatar,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ShareIcon from '@mui/icons-material/Share';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  QortalMetadata,
  QortalSearchParams,
  ResourceListDisplay,
  useGlobal,
  LoaderListStatus,
} from 'qapp-core';
import { PostData } from './Post';
import { PostWrapper } from './PostWrapper';
import { ENTITY_POST, ENTITY_ROOT, ENTITY_REPLY } from '../constants/qdn';
import { useIsFollowing } from '../hooks/useIsFollowing';
import { useFollowerCount } from '../hooks/useFollowerCount';
import { LoaderState, LoaderItem } from './LoaderState';
import { FollowersList } from './FollowersList';
import { UserFollowingList } from './UserFollowingList';
import { useFollowingList } from '../hooks/useFollowingList';
import { useFetchProfile } from '../hooks/useFetchProfile';
import { CreateProfile } from './CreateProfile';
import { copyToClipboard } from '../utils/clipboard';
import { showError, showSuccess } from 'qapp-core';

const PageContainer = styled('div')({
  width: '100%',
  minHeight: '100vh',
  position: 'relative',
});

const PageHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(21, 32, 43, 0.85)'
      : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 1px 0 rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.08)',
}));

const BackButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: '50%',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.15)'
        : 'rgba(29, 155, 240, 0.1)',
    transform: 'scale(1.1)',
  },
}));

const UserInfo = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const UserInfoContent = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: 1,
});

const FollowButton = styled(Button)(({ theme }) => ({
  borderRadius: '20px',
  textTransform: 'none',
  fontWeight: 700,
  padding: theme.spacing(1, 2.5),
  minWidth: '120px',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const ActionColumn = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  minWidth: 140,
}));

const TabsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  borderBottom: `1px solid ${theme.palette.divider}`,
  position: 'sticky',
  top: 69,
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(21, 32, 43, 0.85)'
      : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  zIndex: 9,
}));

const Tab = styled('button')<{ active?: boolean }>(({ theme, active }) => ({
  flex: 1,
  padding: theme.spacing(2),
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '15px',
  fontWeight: active ? 700 : 400,
  color: active ? theme.palette.text.primary : theme.palette.text.secondary,
  position: 'relative',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(0, 0, 0, 0.03)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: active
      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
      : 'transparent',
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.2s ease',
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  border: `3px solid ${theme.palette.primary.main}`,
}));

const PostsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2, 0),
  overflowAnchor: 'auto', // CSS scroll anchoring to prevent jumps during content loading
}));

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
}));

interface UserFeedProps {
  userName: string;
  onBack?: () => void;
  onLike?: (postId: string, isLiked: boolean) => void;
  onRetweet?: (postId: string, post: PostData) => void;
  onReply?: (postId: string, postName: string) => void;
  onShare?: (postId: string, postName: string) => void;
  onForward?: (postId: string, postName: string, text?: string) => void;
  onEdit?: (postId: string, post: PostData) => void;
  onDelete?: (post: PostData) => void;
  onPin?: (postId: string) => void;
  onPostClick?: (postId: string, postName: string) => void;
  onUserClick?: (userName: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  pinnedPostIds?: Set<string>;
  onFollow?: (targetUserName: string) => void;
  onUnfollow?: (targetUserName: string) => void;
}

export function UserFeed({
  userName,
  onBack = () => {},
  onLike = () => {},
  onRetweet = () => {},
  onReply = () => {},
  onShare = () => {},
  onForward = () => {},
  onEdit,
  onDelete,
  onPin,
  onPostClick = () => {},
  onUserClick,
  onHashtagClick,
  pinnedPostIds = new Set(),
  onFollow,
  onUnfollow,
}: UserFeedProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [replyIdentifierPrefix, setReplyIdentifierPrefix] =
    useState<string>('');
  const { identifierOperations, auth } = useGlobal();

  // Follow hooks
  const { isFollowing, isLoading: isFollowLoading } = useIsFollowing(userName);
  const followerCount = useFollowerCount(userName);
  const { followingCount } = useFollowingList(userName);
  
  // Fetch user profile for bio
  const { profile } = useFetchProfile(userName);

  // Check if viewing own profile
  const isOwnProfile = auth?.name === userName;

  const handleFollowClick = () => {
    if (isFollowLoading) return;
    if (isFollowing && onUnfollow) {
      onUnfollow(userName);
    } else if (!isFollowing && onFollow) {
      onFollow(userName);
    }
  };

  const handleCopyProfileLink = useCallback(async () => {
    try {
      const url = `qortal://APP/Quittest/user/${encodeURIComponent(userName)}`;
      await copyToClipboard(url);
      showSuccess('Profile link copied');
    } catch (error) {
      console.error('Failed to copy profile link:', error);
      showError('Failed to copy profile link. Please try again.');
    }
  }, [userName]);

  // Determine active tab from route
  const getActiveTab = () => {
    if (location.pathname.endsWith('/replies')) return 'replies';
    if (location.pathname.endsWith('/followers')) return 'followers';
    if (location.pathname.endsWith('/following')) return 'following';
    return 'posts';
  };

  const activeTab = getActiveTab();

  // Build the reply identifier prefix
  useEffect(() => {
    const buildReplyPrefix = async () => {
      try {
        if (!identifierOperations) return;

        const prefix = await identifierOperations.buildSearchPrefix(
          ENTITY_REPLY,
          ''
        );

        if (prefix) {
          setReplyIdentifierPrefix(prefix);
        }
      } catch (error) {
        console.error('Error building reply identifier prefix:', error);
      }
    };

    buildReplyPrefix();
  }, [identifierOperations]);

  const loaderItem = useCallback(() => {
    return <LoaderItem />;
  }, []);

  const loaderList = useCallback(
    (status: LoaderListStatus) => {
      return (
        <LoaderState
          status={status}
          emptyIcon="📭"
          emptyTitle={`No ${activeTab === 'replies' ? 'replies' : 'posts'} yet`}
          emptyMessage={
            activeTab === 'replies'
              ? `${userName} hasn't replied to any posts yet.`
              : `${userName} hasn't posted anything yet.`
          }
        />
      );
    },
    [activeTab, userName]
  );

  // Search for posts by this specific user
  const userPostsSearch = useMemo((): QortalSearchParams => {
    return {
      service: 'DOCUMENT',
      name: userName,
      exactMatchNames: true,
      identifier: '',
      limit: 20,
      reverse: true,
    };
  }, [userName]);

  // Search for replies by this specific user
  const userRepliesSearch = useMemo((): QortalSearchParams => {
    return {
      service: 'DOCUMENT',
      name: userName,
      identifier: replyIdentifierPrefix,
      prefix: true,
      limit: 20,
      reverse: true,
    };
  }, [userName, replyIdentifierPrefix]);

  const renderPost = useCallback(
    (item: { qortalMetadata: QortalMetadata; data: any }, _index: number) => {
      return (
        <PostWrapper
          post={item}
          onLike={onLike}
          onRetweet={onRetweet}
          onReply={onReply}
          onShare={onShare}
          onForward={onForward}
          onEdit={onEdit}
          onDelete={onDelete}
          onPin={onPin}
          onClick={onPostClick}
          onUserClick={onUserClick}
          onHashtagClick={onHashtagClick}
          isPinned={pinnedPostIds.has(item.qortalMetadata.identifier)}
        />
      );
    },
    [
      onLike,
      onRetweet,
      onReply,
      onShare,
      onForward,
      onEdit,
      onDelete,
      onPin,
      onPostClick,
      onUserClick,
      pinnedPostIds,
    ]
  );

  return (
    <PageContainer>
      <PageHeader>
        <BackButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </BackButton>
        <div>
          <Typography variant="h6" fontWeight={700}>
            {userName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activeTab === 'posts' ? 'Posts' : 'Replies'}
          </Typography>
        </div>
      </PageHeader>

      <UserInfo>
        <UserInfoContent>
          <UserAvatar
            src={`/arbitrary/THUMBNAIL/${userName}/qortal_avatar?async=true`}
            alt={`${userName} avatar`}
          >
            {userName[0]}
          </UserAvatar>
          <div style={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              {userName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{userName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}
            >
              {followerCount} {followerCount === 1 ? 'Follower' : 'Followers'} ·{' '}
              {followingCount} Following
            </Typography>
            {profile?.bio && (
              <Typography
                variant="body2"
                sx={{ mt: 1.5, wordBreak: 'break-word' }}
              >
                {profile.bio}
              </Typography>
            )}
          </div>
        </UserInfoContent>
        <ActionColumn>
          {!isOwnProfile && (
            <FollowButton
              variant={isFollowing ? 'outlined' : 'contained'}
              color="primary"
              startIcon={
                isFollowLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : isFollowing ? (
                  <PersonRemoveIcon />
                ) : (
                  <PersonAddIcon />
                )
              }
              onClick={handleFollowClick}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
            </FollowButton>
          )}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ShareIcon />}
            onClick={handleCopyProfileLink}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '20px',
            }}
          >
            Copy Link
          </Button>
        </ActionColumn>
      </UserInfo>

      <TabsContainer>
        <Tab
          active={activeTab === 'posts'}
          onClick={() => navigate(`/user/${userName}`)}
        >
          Posts
        </Tab>
        <Tab
          active={activeTab === 'replies'}
          onClick={() => navigate(`/user/${userName}/replies`)}
        >
          Replies
        </Tab>
        <Tab
          active={activeTab === 'followers'}
          onClick={() => navigate(`/user/${userName}/followers`)}
        >
          Followers
        </Tab>
        <Tab
          active={activeTab === 'following'}
          onClick={() => navigate(`/user/${userName}/following`)}
        >
          Following
        </Tab>
      </TabsContainer>

      {isOwnProfile && !profile && (
        <Box sx={{ px: 2, py: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              No profile yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your profile so others can see your bio.
            </Typography>
          </Box>
          <CreateProfile embedded />
        </Box>
      )}

      <PostsContainer>
        {activeTab === 'posts' && (
          <ResourceListDisplay
            styles={{
              gap: 20,
            }}
            retryAttempts={3}
            listName={`user-posts-${userName}`}
            direction="VERTICAL"
            disableVirtualization
            returnType="JSON"
            loaderList={loaderList}
            entityParams={{
              entityType: ENTITY_POST,
              parentId: ENTITY_ROOT,
            }}
            search={userPostsSearch}
            listItem={renderPost}
            loaderItem={loaderItem}
          />
        )}

        {activeTab === 'replies' && (
          <ResourceListDisplay
            styles={{
              gap: 20,
            }}
            retryAttempts={3}
            listName={`user-replies-${userName}`}
            direction="VERTICAL"
            disableVirtualization
            returnType="JSON"
            loaderList={loaderList}
            search={userRepliesSearch}
            listItem={renderPost}
            loaderItem={loaderItem}
          />
        )}

        {activeTab === 'followers' && (
          <FollowersList userName={userName} onUserClick={onUserClick} />
        )}

        {activeTab === 'following' && (
          <UserFollowingList userName={userName} onUserClick={onUserClick} />
        )}
      </PostsContainer>
    </PageContainer>
  );
}
