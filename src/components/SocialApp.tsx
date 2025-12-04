import { styled } from '@mui/system';
import {
  useState,
  useCallback,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Fab, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Feed } from './Feed';
import { PostPage } from './PostPage';
import { UserFeed } from './UserFeed';
import { SearchPage } from './SearchPage';
import { Sidebar, RightSidebar } from './Sidebar';
import { PostContent } from './NewPostInput';
import {
  useGlobal,
  showError,
  showSuccess,
  showLoading,
  dismissToast,
  usePublish,
} from 'qapp-core';
import { copyToClipboard } from '../utils/clipboard';

// Lazy load the NewPostModal component (includes rich text editor)
const NewPostModal = lazy(() =>
  import('./NewPostModal').then((module) => ({
    default: module.NewPostModal,
  }))
);
import {
  publishPost,
  publishReply,
  publishRepost,
  deletePost,
  updatePost,
  likePost,
  unlikePost,
  followUser,
  unfollowUser,
} from '../utils/postQdn';
import { PostData } from './Post';
import { useFollowsList } from '../hooks/useFollowsList';
import { useSetAtom } from 'jotai';
import { followedUsersAtom } from '../state/global/follows';
import { ConfirmDialog } from './ConfirmDialog';
import {
  handleFollowUser,
  handleUnfollowUser,
} from '../utils/followingHelpers';

// Declare qortalRequest as a global function (provided by Qortal runtime)
declare global {
  function qortalRequest(params: any): Promise<any>;
}

/**
 * Convert PostImage objects to MediaAttachment format for editing
 */
function postImageToMediaAttachment(
  image: { src: string },
  index: number
): {
  type: 'image';
  file: File;
  preview: string;
} {
  const base64 = image.src;
  // Create data URL from base64
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  // Convert base64 to blob
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: 'image/jpeg' });

  // Convert blob to file
  const file = new File([blob], `image-${index}.jpg`, { type: 'image/jpeg' });

  return {
    type: 'image',
    file,
    preview: dataUrl,
  };
}

/**
 * Convert PostVideo references to MediaAttachment format for editing
 * Note: For existing videos, we create a placeholder MediaAttachment
 * since we don't have the actual video file
 */
function postVideoToMediaAttachment(video: {
  identifier: string;
  name: string;
  service: string;
}): {
  type: 'video';
  file: File;
  preview: string;
  existingVideo: {
    identifier: string;
    name: string;
    service: string;
  };
} {
  // Create a placeholder file since we don't have the actual video file
  const placeholderBlob = new Blob([''], { type: 'video/mp4' });
  const placeholderFile = new File([placeholderBlob], 'existing-video.mp4', {
    type: 'video/mp4',
  });

  return {
    type: 'video',
    file: placeholderFile,
    preview: '', // Will be loaded from metadata
    existingVideo: video,
  };
}

const AppContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #15202b 0%, #192734 100%)'
      : 'linear-gradient(135deg, #f7f9fc 0%, #e9f2f9 100%)',
  color: theme.palette.text.primary,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      theme.palette.mode === 'dark'
        ? 'radial-gradient(circle at 20% 50%, rgba(29, 155, 240, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 86, 255, 0.05) 0%, transparent 50%)'
        : 'radial-gradient(circle at 20% 50%, rgba(29, 155, 240, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 86, 255, 0.03) 0%, transparent 50%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
}));

const MainContent = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: 1,
  maxWidth: '1280px',
  margin: '0 auto',
  width: '100%',
  position: 'relative',
  zIndex: 1,
  borderLeft: `1px solid ${theme.palette.divider}`,
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(21, 32, 43, 0.4)'
      : 'rgba(255, 255, 255, 0.4)',
  backdropFilter: 'blur(10px)',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 0 40px rgba(0, 0, 0, 0.3)'
      : '0 0 40px rgba(0, 0, 0, 0.06)',
}));

const LeftSection = styled('div')(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(21, 32, 43, 0.6)'
      : 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(10px)',
  [theme.breakpoints.down('lg')]: {
    display: 'none',
  },
}));

const CenterSection = styled('div')({
  flex: 1,
  minWidth: 0,
});

const RightSection = styled('div')(({ theme }) => ({
  borderLeft: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(21, 32, 43, 0.6)'
      : 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(10px)',
  [theme.breakpoints.down('lg')]: {
    display: 'none',
  },
}));

const ScrollToTopButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: 1000,
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'translateY(-4px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
  },
  '&:active': {
    transform: 'translateY(-2px)',
  },
}));

interface SocialAppProps {
  userName?: string;
  userAvatar?: string;
}

export function SocialApp({ userName = 'User', userAvatar }: SocialAppProps) {
  const { auth, identifierOperations, lists } = useGlobal();
  const { publishMultipleResources } = usePublish();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{
    name?: string;
    postId?: string;
    userName?: string;
  }>();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pinnedPostIds, setPinnedPostIds] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<{
    id: string;
    post: PostData;
  } | null>(null);
  const [replyingToPost, setReplyingToPost] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAuthenticatingAction, setIsAuthenticatingAction] = useState(false);

  // Track navigation history to determine if we came from another post
  const previousPathRef = useRef<string>('');

  // Fetch the authenticated user's follows when their name becomes available
  // This hook stores the data in Jotai atoms for app-wide access
  const {
    followedUsers,
    isLoading: isLoadingFollows,
    error: followsError,
    refetch: refetchFollows,
  } = useFollowsList();

  const setFollowedUsers = useSetAtom(followedUsersAtom);

  // Log follows data for debugging
  useEffect(() => {
    if (followsError) {
      console.error('Error loading follows:', followsError);
    }
  }, [followedUsers, followsError]);

  // Clear follows list when user logs out or switches names
  const previousNameRef = useRef<string | undefined>(auth?.name);
  useEffect(() => {
    if (previousNameRef.current && previousNameRef.current !== auth?.name) {
      setFollowedUsers([]);
    }
    previousNameRef.current = auth?.name;
  }, [auth?.name, setFollowedUsers]);

  useEffect(() => {
    // Update previous path when location changes
    return () => {
      previousPathRef.current = location.pathname;
    };
  }, [location.pathname]);

  // Scroll detection for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down more than 400px
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  // Determine which page we're on
  const isPostPage = !!params.postId && !!params.name;
  const isUserPage = !!params.userName && !params.postId;
  const isSearchPage = location.pathname.startsWith('/search');
  const authedName = auth?.name ?? '';
  const authedAddress = auth?.address ?? '';
  const isOwnProfile = isUserPage && params.userName === authedName;
  const isAuthenticated = !!authedAddress;

  const ensureAuthenticatedWithName = useCallback(async () => {
    if (authedAddress && authedName) {
      return true;
    }

    if (isAuthenticatingAction) {
      return false;
    }

    setIsAuthenticatingAction(true);
    try {
      const result = (await auth?.authenticateUser?.()) as
        | { address?: string; name?: string }
        | undefined;
      const address = result?.address ?? authedAddress;
      const name = result?.name ?? authedName;

      if (!address || !name) {
        showError('A Qortal name is required to perform this action.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    } finally {
      setIsAuthenticatingAction(false);
    }
  }, [authedAddress, authedName, auth, isAuthenticatingAction]);

  const handleProfileNavigate = useCallback(async () => {
    const authed = await ensureAuthenticatedWithName();
    if (!authed) return;
    if (authedName) {
      navigate(`/user/${authedName}`);
    } else {
      showError('A Qortal name is required to view your profile.');
    }
  }, [authedName, ensureAuthenticatedWithName, navigate]);

  const handleNavigate = useCallback(
    (page: string) => {
      if (page === 'home') {
        navigate('/');
      } else if (page === 'profile') {
        handleProfileNavigate();
      } else if (page === 'search') {
        navigate('/search/users');
      }
    },
    [handleProfileNavigate, navigate]
  );

  const handleBackToHome = useCallback(() => {
    // Check if the previous path was a post page, user page, search page, or any user tab page
    const postPagePattern = /^\/post\/[^/]+\/[^/]+$/;
    const userPagePattern = /^\/user\/[^/]+$/;
    const userRepliesPattern = /^\/user\/[^/]+\/replies$/;
    const userFollowersPattern = /^\/user\/[^/]+\/followers$/;
    const userFollowingPattern = /^\/user\/[^/]+\/following$/;
    const searchPagePattern = /^\/search\/(users|hashtags)/;
    const canGoBack =
      previousPathRef.current &&
      (postPagePattern.test(previousPathRef.current) ||
        userPagePattern.test(previousPathRef.current) ||
        userRepliesPattern.test(previousPathRef.current) ||
        userFollowersPattern.test(previousPathRef.current) ||
        userFollowingPattern.test(previousPathRef.current) ||
        searchPagePattern.test(previousPathRef.current));

    if (canGoBack) {
      // Go back in history if we came from another post, user page (any tab), or search page
      navigate(-1);
    } else {
      // Otherwise, go to home
      navigate('/');
    }
  }, [navigate]);

  const handleTweet = () => {
    setIsPostModalOpen(true);
  };

  const handleNewPost = async (content: PostContent) => {
    if (isPublishing) return; // Prevent duplicate submissions

    let loadId: string | undefined;

    try {
      const authed = await ensureAuthenticatedWithName();
      if (!authed) {
        throw new Error('Authentication required to publish');
      }

      // Check if we're replying to a post
      if (replyingToPost) {
        // Handle reply
        if (!content.text.trim() && content.media.length === 0) {
          showError('Reply must contain text or media');
          throw new Error('Reply must contain text or media');
        }

        setIsPublishing(true);
        loadId = showLoading('Publishing your reply...');

        await publishReply({
          text: content.text,
          media: content.media,
          identifierOperations,
          addNewResources: lists.addNewResources,
          userName: authedName,
          replyToPostIdentifier: replyingToPost.id,
          replyToPostName: replyingToPost.name,
          publishMultipleResources,
        });

        showSuccess('Reply published successfully!');
        setIsPostModalOpen(false);
        setReplyingToPost(null);
      } else if (editingPost) {
        // Handle edit
        if (!content.text.trim()) {
          showError('Post must contain text');
          throw new Error('Post must contain text');
        }

        setIsPublishing(true);
        loadId = showLoading('Updating your post...');

        await updatePost(
          authedName,
          editingPost.id,
          content.text,
          identifierOperations,
          lists.updateNewResources,
          editingPost.post,
          publishMultipleResources,
          content.media
        );

        showSuccess('Post updated successfully!');
        setIsPostModalOpen(false);
        setEditingPost(null);
      } else {
        // Handle new post
        if (!content.text.trim() && content.media.length === 0) {
          showError('Post must contain text or media');
          throw new Error('Post must contain text or media');
        }

        setIsPublishing(true);
        loadId = showLoading('Publishing your post...');

        const identifier = await publishPost({
          text: content.text,
          media: content.media,
          identifierOperations,
          addNewResources: lists.addNewResources,
          userName: authedName,
          publishMultipleResources,
          updateNewResources: lists.updateNewResources,
        });

        setIsPostModalOpen(false);
        showSuccess('Post published successfully!');
      }
    } catch (error) {
      console.error('Error with post:', error);
      showError(
        error instanceof Error
          ? error.message
          : 'Failed to process post. Please try again.'
      );
      // Re-throw the error so the form knows not to clear
      throw error;
    } finally {
      if (loadId) {
        dismissToast(loadId);
      }
      setIsPublishing(false);
    }
  };

  const handleLike = useCallback(
    async (postId: string, isLiked: boolean) => {
      const authed = await ensureAuthenticatedWithName();
      if (!authed) return;

      let loadId: string | undefined;

      try {
        if (isLiked) {
          // Unlike the post
          loadId = showLoading('Unliking post...');
          await unlikePost(
            postId,
            identifierOperations,
            authedName,
            lists.deleteResource
          );
          showSuccess('Post unliked');
        } else {
          // Like the post
          loadId = showLoading('Liking post...');
          await likePost(
            postId,
            identifierOperations,
            authedName,
            lists.addNewResources
          );
          showSuccess('Post liked');
        }
      } catch (error) {
        console.error('Error liking/unliking post:', error);
        showError(
          error instanceof Error
            ? error.message
            : 'Failed to like/unlike post. Please try again.'
        );
      } finally {
        if (loadId) {
          dismissToast(loadId);
        }
      }
    },
    [auth, ensureAuthenticatedWithName, identifierOperations, lists.deleteResource, lists.addNewResources]
  );

  const handleRetweet = useCallback(
    async (postId: string, post?: PostData) => {
      const authed = await ensureAuthenticatedWithName();
      if (!authed) return;

      if (!post) {
        console.error('Post data is required for reposting');
        return;
      }

      // Check if user is trying to repost their own content
      if (authedName === post.qortalMetadata.name) {
        showError('You cannot repost your own content');
        return;
      }

      // Confirm before reposting
      setConfirmDialog({
        open: true,
        title: 'Repost this post?',
        message: `This will repost @${post.qortalMetadata.name}'s post to your followers.`,
        confirmText: 'Repost',
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));

          let loadId: string | undefined;

          try {
            const confirmedAuth = await ensureAuthenticatedWithName();
            if (!confirmedAuth) {
              throw new Error('Authentication required to repost');
            }

            loadId = showLoading('Reposting...');

            await publishRepost({
              identifierOperations,
              addNewResources: lists.addNewResources,
              userName: authedName,
              originalPost: post,
            });

            showSuccess('Reposted successfully!');
          } catch (error) {
            console.error('Error reposting:', error);
            showError(
              error instanceof Error
                ? error.message
                : 'Failed to repost. Please try again.'
            );
          } finally {
            if (loadId) {
              dismissToast(loadId);
            }
          }
        },
      });
    },
    [auth?.name, ensureAuthenticatedWithName, identifierOperations, lists.addNewResources]
  );

  const handleReply = useCallback((postId: string, postName: string) => {
    // Open the reply modal
    setReplyingToPost({ id: postId, name: postName });
    setIsPostModalOpen(true);
  }, []);

  const handleNewReply = async (
    postId: string,
    postName: string,
    content: PostContent
  ) => {
    if (isPublishing) return; // Prevent duplicate submissions

    let loadId: string | undefined;

    try {
      const authed = await ensureAuthenticatedWithName();
      if (!authed) {
        throw new Error('Authentication required to publish');
      }

      if (!content.text.trim() && content.media.length === 0) {
        showError('Reply must contain text or media');
        throw new Error('Reply must contain text or media');
      }

      setIsPublishing(true);
      loadId = showLoading('Publishing your reply...');

      const identifier = await publishReply({
        text: content.text,
        media: content.media,
        identifierOperations,
        addNewResources: lists.addNewResources,
        userName: authedName,
        replyToPostIdentifier: postId,
        replyToPostName: postName,
        publishMultipleResources,
      });

      showSuccess('Reply published successfully!');
    } catch (error) {
      console.error('Error publishing reply:', error);
      showError(
        error instanceof Error
          ? error.message
          : 'Failed to publish reply. Please try again.'
      );
      // Re-throw the error so the form knows not to clear
      throw error;
    } finally {
      if (loadId) {
        dismissToast(loadId);
      }
      setIsPublishing(false);
    }
  };

  const handleShare = useCallback(async (postId: string, postName: string) => {
    try {
      if (!postId) {
        showError('Failed to copy link. Please try again. Missing post ID.');
        return;
      }
      if (!postName) {
        showError('Failed to copy link. Please try again. Missing post name.');
        return;
      }
      const postUrl = `qortal://APP/Quittest/post/${encodeURIComponent(postName)}/${encodeURIComponent(postId)}`;
      await copyToClipboard(postUrl);
      showSuccess('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showError('Failed to copy link. Please try again.');
    }
  }, []);

  const handleEdit = useCallback((postId: string, post: PostData) => {
    setEditingPost({ id: postId, post });
    setIsPostModalOpen(true);
    // TODO: Pre-fill the modal with the post content
  }, []);

  const handleDelete = useCallback(
    async (post: PostData) => {
      const authed = await ensureAuthenticatedWithName();
      if (!authed) return;

      // Check if post has videos
      const hasVideos = post.data?.videos && post.data.videos.length > 0;

      // Confirm before deleting
      setConfirmDialog({
        open: true,
        title: 'Delete this post?',
        message: hasVideos
          ? 'Are you sure you want to delete this post? This action cannot be undone.\n\nNote: Videos will not be deleted. To delete videos, please use the Q-Tube app.'
          : 'Are you sure you want to delete this post? This action cannot be undone.',
        confirmText: 'Delete',
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));

          let loadId: string | undefined;

          try {
            const confirmedAuth = await ensureAuthenticatedWithName();
            if (!confirmedAuth) {
              throw new Error('Authentication required to delete');
            }

            loadId = showLoading('Deleting post...');

            await deletePost(
              post.qortalMetadata,
              post.data,
              lists.deleteResource
            );

            showSuccess('Post deleted successfully!');

            // Remove from pinned posts if it was pinned
            if (pinnedPostIds.has(post.qortalMetadata.identifier)) {
              setPinnedPostIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(post.qortalMetadata.identifier);
                return newSet;
              });
            }

            // TODO: Refresh the feed or remove the post optimistically
          } catch (error) {
            console.error('Error deleting post:', error);
            showError(
              error instanceof Error
                ? error.message
                : 'Failed to delete post. Please try again.'
            );
          } finally {
            if (loadId) {
              dismissToast(loadId);
            }
          }
        },
      });
    },
    [ensureAuthenticatedWithName, pinnedPostIds, lists.deleteResource]
  );

  const handlePin = useCallback((postId: string) => {
    setPinnedPostIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        showSuccess('Post unpinned');
      } else {
        // Only allow one pinned post at a time
        newSet.clear();
        newSet.add(postId);
        showSuccess('Post pinned');
      }
      return newSet;
    });
    // TODO: Persist pinned post to local storage or user profile
  }, []);

  const handlePostClick = useCallback(
    (postId: string, postName: string) => {
      navigate(`/post/${postName}/${postId}`);
    },
    [navigate]
  );

  const handleUserClick = useCallback(
    (userName: string) => {
      navigate(`/user/${userName}`);
    },
    [navigate]
  );

  const handleTrendClick = (trend: string) => {
    // Navigate to hashtag search page with hashtag query
    const hashtag = trend.startsWith('#') ? trend.substring(1) : trend;
    navigate(`/search/hashtags?q=${encodeURIComponent(hashtag)}`);
  };

  const handleHashtagClick = useCallback(
    (hashtag: string) => {
      // Navigate to hashtag search page with hashtag query
      navigate(`/search/hashtags?q=${encodeURIComponent(hashtag)}`);
    },
    [navigate]
  );

  const handleFollow = useCallback(
    async (targetUserName: string) => {
      const authed = await ensureAuthenticatedWithName();
      if (!authed) return;

      let loadId: string | undefined;

      try {
        loadId = showLoading('Following user...');
        // 1. Publish to blockchain
        await followUser(
          targetUserName,
          identifierOperations,
          authedName,
          lists.addNewResources
        );
        // 2. Update IndexedDB immediately for instant UI feedback
        await handleFollowUser(authedName, targetUserName, identifierOperations);
        showSuccess(`You are now following @${targetUserName}`);
        // Refetch the follows list to update the UI
        await refetchFollows();
      } catch (error) {
        console.error('Error following user:', error);
        showError(
          error instanceof Error
            ? error.message
            : 'Failed to follow user. Please try again.'
        );
      } finally {
        if (loadId) {
          dismissToast(loadId);
        }
      }
    },
    [auth, ensureAuthenticatedWithName, identifierOperations, lists.addNewResources, refetchFollows]
  );

  const handleUnfollow = useCallback(
    async (targetUserName: string) => {
      const authed = await ensureAuthenticatedWithName();
      if (!authed) return;

      let loadId: string | undefined;

      try {
        loadId = showLoading('Unfollowing user...');
        // 1. Delete from blockchain
        await unfollowUser(
          targetUserName,
          identifierOperations,
          authedName,
          lists.deleteResource
        );
        // 2. Update IndexedDB immediately for instant UI feedback
        await handleUnfollowUser(authedName, targetUserName);
        showSuccess(`You unfollowed @${targetUserName}`);
        // Refetch the follows list to update the UI
        await refetchFollows();
      } catch (error) {
        console.error('Error unfollowing user:', error);
        showError(
          error instanceof Error
            ? error.message
            : 'Failed to unfollow user. Please try again.'
        );
      } finally {
        if (loadId) {
          dismissToast(loadId);
        }
      }
    },
    [auth, ensureAuthenticatedWithName, identifierOperations, lists.deleteResource, refetchFollows]
  );

  return (
    <AppContainer>
      <MainContent>
        <LeftSection>
          <Sidebar
            onNavigate={handleNavigate}
            onTweet={handleTweet}
            onProfileNavigate={handleProfileNavigate}
            profileLabel="Profile"
            activePage={
              isOwnProfile
                ? 'profile'
                : isSearchPage
                  ? 'search'
                  : !isPostPage && !isUserPage
                    ? 'home'
                    : undefined
            }
          />
        </LeftSection>

        <CenterSection>
          {isPostPage && params.postId && params.name ? (
            <PostPage
              postId={params.postId}
              postName={params.name}
              onBack={handleBackToHome}
              onNewReply={handleNewReply}
              onLike={handleLike}
              onRetweet={handleRetweet}
              onReply={handleReply}
              onShare={handleShare}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onPostClick={handlePostClick}
              onUserClick={handleUserClick}
              onHashtagClick={handleHashtagClick}
              userAvatar={userAvatar}
              userName={userName}
              isPublishing={isPublishing}
              isPinned={pinnedPostIds.has(params.postId)}
            />
          ) : isSearchPage ? (
            <SearchPage
              onBack={handleBackToHome}
              onUserClick={handleUserClick}
              onPostClick={handlePostClick}
              onLike={handleLike}
              onRetweet={handleRetweet}
              onReply={handleReply}
              onShare={handleShare}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              pinnedPostIds={pinnedPostIds}
            />
          ) : isUserPage && params.userName ? (
            <UserFeed
              userName={params.userName}
              onBack={handleBackToHome}
              onLike={handleLike}
              onRetweet={handleRetweet}
              onReply={handleReply}
              onShare={handleShare}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onPostClick={handlePostClick}
              onUserClick={handleUserClick}
              onHashtagClick={handleHashtagClick}
              pinnedPostIds={pinnedPostIds}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          ) : (
            <Feed
              onNewPost={handleNewPost}
              onLike={handleLike}
              onRetweet={handleRetweet}
              onReply={handleReply}
              onShare={handleShare}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onPostClick={handlePostClick}
              onUserClick={handleUserClick}
              onHashtagClick={handleHashtagClick}
              userAvatar={userAvatar}
              userName={userName}
              isPublishing={isPublishing}
              pinnedPostIds={pinnedPostIds}
              showAuthHint={!isAuthenticated}
            />
          )}
        </CenterSection>

        <RightSection>
          <RightSidebar onTrendClick={handleTrendClick} />
        </RightSection>
      </MainContent>

      {isPostModalOpen && (
        <Suspense
          fallback={
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
              }}
            >
              <CircularProgress size={48} />
            </Box>
          }
        >
          <NewPostModal
            open={isPostModalOpen}
            onClose={() => {
              setIsPostModalOpen(false);
              setEditingPost(null);
              setReplyingToPost(null);
            }}
            onPost={handleNewPost}
            userAvatar={userAvatar}
            userName={userName}
            isPublishing={isPublishing}
            initialText={editingPost?.post.data.text}
            initialMedia={[
              ...(editingPost?.post.data.images
                ? editingPost.post.data.images.map((image, index) =>
                    postImageToMediaAttachment(image, index)
                  )
                : []),
              ...(editingPost?.post.data.videos
                ? editingPost.post.data.videos.map((video) =>
                    postVideoToMediaAttachment(video)
                  )
                : []),
            ]}
            isEditing={!!editingPost}
            isReplying={!!replyingToPost}
            replyToUsername={replyingToPost?.name}
            showAuthHint={!isAuthenticated}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />

      {/* Scroll to top button */}
      <Zoom in={showScrollTop}>
        <ScrollToTopButton
          size="medium"
          onClick={handleScrollToTop}
          aria-label="scroll to top"
        >
          <KeyboardArrowUpIcon />
        </ScrollToTopButton>
      </Zoom>
    </AppContainer>
  );
}
