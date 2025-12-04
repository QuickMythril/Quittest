import { styled } from '@mui/system';
import { Typography, IconButton, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Post, PostData } from './Post';
import { PostWrapper } from './PostWrapper';
import { NewPostInput, PostContent } from './NewPostInput';
import { useCallback, useMemo, useState } from 'react';
import {
  QortalMetadata,
  QortalSearchParams,
  ResourceListDisplay,
  useGlobal,
  usePublish,
} from 'qapp-core';
import { ENTITY_POST, ENTITY_REPLY } from '../constants/qdn';
import { LoaderState, LoaderItem } from './LoaderState';

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

const MainPostContainer = styled('div')(({ theme }) => ({
  padding: theme.spacing(3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ReplyInputContainer = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const RepliesContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2, 0),
  overflowAnchor: 'auto', // CSS scroll anchoring to prevent jumps during content loading
}));

const PostNotFoundContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(8, 4),
  gap: theme.spacing(2),
  minHeight: '400px',
}));

const NotFoundIcon = styled('div')(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '64px',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))'
      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.03))',
  border: `2px solid ${
    theme.palette.mode === 'dark'
      ? 'rgba(239, 68, 68, 0.2)'
      : 'rgba(239, 68, 68, 0.15)'
  }`,
  animation: 'fadeIn 0.5s ease-out',
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'scale(0.8)',
    },
    to: {
      opacity: 1,
      transform: 'scale(1)',
    },
  },
}));

const NotFoundContent = styled('div')(({ theme }) => ({
  textAlign: 'center',
  maxWidth: 400,
  animation: 'slideUp 0.5s ease-out 0.2s both',
  '@keyframes slideUp': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

const FetchErrorIcon = styled('div')(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '64px',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.05))'
      : 'linear-gradient(135deg, rgba(251, 146, 60, 0.08), rgba(249, 115, 22, 0.03))',
  border: `2px solid ${
    theme.palette.mode === 'dark'
      ? 'rgba(251, 146, 60, 0.2)'
      : 'rgba(251, 146, 60, 0.15)'
  }`,
  animation: 'fadeIn 0.5s ease-out',
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'scale(0.8)',
    },
    to: {
      opacity: 1,
      transform: 'scale(1)',
    },
  },
}));

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
}));

interface PostPageProps {
  postId: string;
  postName: string;
  onBack?: () => void;
  onNewReply?: (
    postId: string,
    postName: string,
    content: PostContent
  ) => void | Promise<void>;
  onLike?: (postId: string, isLiked: boolean) => void;
  onRetweet?: (postId: string, post: PostData) => void;
  onReply?: (postId: string, postName: string) => void;
  onShare?: (postId: string, postName: string) => void;
  onForward?: (postId: string, postName: string) => void;
  onEdit?: (postId: string, post: PostData) => void;
  onDelete?: (post: PostData) => void;
  onPin?: (postId: string) => void;
  onPostClick?: (postId: string, postName: string) => void;
  onUserClick?: (userName: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  userAvatar?: string;
  userName?: string;
  isPublishing?: boolean;
  isPinned?: boolean;
}

export function PostPage({
  postId,
  postName,
  onBack = () => {},
  onNewReply = () => {},
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
  userAvatar,
  userName = 'User',
  isPublishing = false,
  isPinned = false,
}: PostPageProps) {
  const { auth } = useGlobal();
  const { resource, isLoading, hasResource } = usePublish(2, 'JSON', {
    service: 'DOCUMENT',
    name: postName,
    identifier: postId,
  });

  const currentPost = resource?.data;

  const loaderItem = useCallback(() => {
    return <LoaderItem />;
  }, []);

  const loaderList = useCallback((status, context) => {
    // Check if this is for the main post or replies based on context
    const isMainPost = context?.listName?.includes('post-');

    return (
      <LoaderState
        status={status}
        emptyIcon={isMainPost ? '🔍' : '💬'}
        emptyTitle={isMainPost ? 'Post not found' : 'No replies yet'}
        emptyMessage={
          status === 'ERROR'
            ? 'Unable to load content right now.'
            : isMainPost
              ? 'This post may have been deleted or is not available.'
              : 'Be the first to reply to this post!'
        }
      />
    );
  }, []);

  // Search for replies to this post
  const repliesSearch = useMemo((): QortalSearchParams => {
    return {
      service: 'DOCUMENT',
      identifier: ``,
      limit: 20,
      reverse: true,
      // Search for replies by using a prefix that matches REPLY identifiers
      // The buildIdentifier function creates identifiers like: REPLY_<replyToPostIdentifier>_<uniqueId>
    };
  }, [postId]);

  const handleReplySubmit = useCallback(
    async (content: PostContent) => {
      if (!resource) {
        console.error('Cannot reply: post data not available');
        return;
      }

      await onNewReply(
        resource.qortalMetadata.identifier,
        resource.qortalMetadata.name,
        content
      );
    },
    [resource, onNewReply]
  );

  const renderReply = useCallback(
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
          onClick={onPostClick}
          onUserClick={onUserClick}
          onHashtagClick={onHashtagClick}
          isReplyInThread={true}
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
      onPostClick,
      onUserClick,
    ]
  );

  return (
    <PageContainer>
      <PageHeader>
        <BackButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </BackButton>
        <Typography variant="h6" fontWeight={700}>
          Post
        </Typography>
      </PageHeader>

      <MainPostContainer>
        {isLoading ? (
          <LoaderItem />
        ) : resource ? (
          <PostWrapper
            post={resource}
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
            isPinned={isPinned}
          />
        ) : hasResource === false ? (
          <PostNotFoundContainer>
            <NotFoundIcon>🔍</NotFoundIcon>
            <NotFoundContent>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                Post Not Found
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                This post may have been deleted, or the link you followed is
                incorrect.
              </Typography>
            </NotFoundContent>
          </PostNotFoundContainer>
        ) : (
          <PostNotFoundContainer>
            <FetchErrorIcon>⚠️</FetchErrorIcon>
            <NotFoundContent>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                Couldn't Fetch Post
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                We're having trouble loading this post. Please try again later
                or check your connection.
              </Typography>
            </NotFoundContent>
          </PostNotFoundContainer>
        )}
      </MainPostContainer>

      {auth?.name && (
        <ReplyInputContainer>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Reply to this post
          </Typography>
          <NewPostInput
            onPost={handleReplySubmit}
            userAvatar={userAvatar}
            userName={userName}
            isPublishing={isPublishing}
            placeholder="Post your reply..."
            showAuthHint={!auth?.address || !auth?.name}
          />
        </ReplyInputContainer>
      )}

      <Divider />

      <RepliesContainer>
        <Typography variant="h6" fontWeight={700} sx={{ px: 2, mb: 2 }}>
          Replies
        </Typography>
        <ResourceListDisplay
          styles={{
            gap: 20,
          }}
          retryAttempts={3}
          listName={`replies-${postId}`}
          direction="VERTICAL"
          disableVirtualization
          disablePagination
          returnType="JSON"
          loaderList={loaderList}
          entityParams={{
            entityType: ENTITY_REPLY,
            parentId: postId,
          }}
          search={repliesSearch}
          listItem={renderReply}
          loaderItem={loaderItem}
        />
      </RepliesContainer>
    </PageContainer>
  );
}
