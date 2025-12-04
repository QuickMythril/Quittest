import {
  Avatar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  Skeleton,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/system';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RepeatIcon from '@mui/icons-material/Repeat';
import ShareIcon from '@mui/icons-material/Share';
import SendIcon from '@mui/icons-material/Send';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import {
  formatTimestamp,
  QortalMetadata,
  useGlobal,
  VideoPlayer,
  Service,
} from 'qapp-core';
import { Post as PostType } from '../utils/postQdn';
import { copyToClipboard } from '../utils/clipboard';

// Declare qortalRequest as a global function (provided by Qortal runtime)
declare global {
  function qortalRequest(params: any): Promise<any>;
}
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useReplyCount } from '../hooks/useReplyCount';
import { useRepostCount } from '../hooks/useRepostCount';
import { useHasReposted } from '../hooks/useHasReposted';
import { useHasLiked } from '../hooks/useHasLiked';
import { useLikeCount } from '../hooks/useLikeCount';
import { useVideoMetadata } from '../hooks/useVideoMetadata';
import { useParentPost } from '../hooks/useParentPost';

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  transition: 'transform 0.2s ease',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
}));

const PostContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2.5),
  margin: theme.spacing(1.5),
  marginTop: 0,
  width: '100%',
  minHeight: '180px', // Prevent layout shift by reserving minimum space
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  cursor: 'pointer',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  position: 'relative',
  // Performance optimizations
  willChange: 'transform', // Hint browser to optimize for transform changes
  // Only transition transform for GPU acceleration - fast and snappy
  transition: 'transform 0.1s ease-out, box-shadow 0.15s ease-out',
  // Smooth fade-in animation when content loads
  '@keyframes fadeInUp': {
    from: {
      opacity: 0,
      transform: 'translateY(10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  animation: 'fadeInUp 0.3s ease-out',
  // Use pseudo-element for hover overlay (GPU-accelerated)
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.spacing(2),
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(0, 0, 0, 0.01)',
    opacity: 0,
    transition: 'opacity 0.1s ease-out',
    pointerEvents: 'none',
  },
  '&:hover': {
    // Use transform for GPU acceleration (much faster than box-shadow alone)
    transform: 'translateZ(0) scale(1.005)', // Subtle scale, translateZ forces GPU
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
        : '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  '&:hover::before': {
    opacity: 1,
  },
}));

const PostContent = styled('div')(({ theme }) => ({
  flex: 1,
  marginLeft: theme.spacing(1.5),
}));

const PostHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(0.5),
}));

const UserInfo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

const PostActions = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(1),
  maxWidth: '425px',
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
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

const ActionGroup = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

const MediaContainer = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.01)',
  },
}));

const MediaGrid = styled('div')<{ count: number }>(({ count }) => ({
  display: 'grid',
  gridTemplateColumns: count === 1 ? '1fr' : 'repeat(2, 1fr)',
  gap: '2px',
  maxHeight: count === 1 ? '500px' : count === 3 ? '450px' : '300px',
  gridAutoRows: count === 3 ? '200px' : 'auto',
}));

const MediaImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  cursor: 'pointer',
});

const VideoContainer = styled('div')({
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: '150px',
});

const VideoMetadataOverlay = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent)',
  padding: theme.spacing(1.5, 1.5, 1, 1.5),
  color: '#fff',
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const VideoTitle = styled('div')({
  fontSize: '14px',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const VideoPlayIconOverlay = styled('div')({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
  zIndex: 1,
});

const VideoSkeletonContainer = styled('div')({
  position: 'relative',
  width: '100%',
  paddingTop: '56.25%', // 16:9 aspect ratio
  backgroundColor: '#000',
  borderRadius: '8px',
  overflow: 'hidden',
});

const VideoSkeletonContent = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const ImageViewerDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    maxWidth: '100vw',
    maxHeight: '100vh',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    boxShadow: 'none',
    margin: 0,
    borderRadius: 0,
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
}));

const ImageViewerContent = styled('div')({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100vh',
});

const FullScreenImage = styled('img')({
  maxWidth: '90vw',
  maxHeight: '90vh',
  objectFit: 'contain',
  userSelect: 'none',
});

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  color: '#fff',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  zIndex: 1,
}));

const NavigationButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#fff',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  zIndex: 1,
  padding: theme.spacing(2),
}));

const PrevButton = styled(NavigationButton)(({ theme }) => ({
  left: theme.spacing(2),
}));

const NextButton = styled(NavigationButton)(({ theme }) => ({
  right: theme.spacing(2),
}));

const ImageCounter = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: '50%',
  transform: 'translateX(-50%)',
  color: '#fff',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(2),
  fontSize: '14px',
  fontWeight: 500,
  zIndex: 1,
}));

const PinnedIndicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  fontSize: '13px',
  marginBottom: theme.spacing(1),
  '& svg': {
    fontSize: '16px',
  },
}));

const ReplyingToIndicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  fontSize: '13px',
  marginBottom: theme.spacing(0.5),
  cursor: 'pointer',
  width: 'fit-content',
  padding: theme.spacing(0.5, 0),
  borderRadius: theme.spacing(0.5),
  transition: 'all 0.2s ease',
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.1)'
        : 'rgba(29, 155, 240, 0.05)',
  },
}));

const RepostedByIndicator = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  color: theme.palette.text.secondary,
  fontSize: '13px',
  fontWeight: 500,
  marginBottom: theme.spacing(0.75),
  paddingLeft: theme.spacing(0.5),
  '& svg': {
    fontSize: '18px',
    color: '#00ba7c',
  },
}));

const Hashtag = styled('span')(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.primary.dark,
  },
}));

const LinkText = styled('span')(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'underline',
  transition: 'all 0.2s ease',
  wordBreak: 'break-all',
  '&:hover': {
    color: theme.palette.primary.dark,
    opacity: 0.8,
  },
}));

const QortalLinkText = styled('span')({
  color: '#8ab4f8',
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'underline',
  transition: 'all 0.2s ease',
  wordBreak: 'break-all',
  '&:hover': {
    opacity: 0.8,
  },
});

const ShowMoreButton = styled('span')(({ theme }) => ({
  color: theme.palette.primary.main,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '15px',
  marginLeft: theme.spacing(0.5),
  transition: 'all 0.2s ease',
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.primary.dark,
  },
}));

const ParentPostContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
  marginTop: theme.spacing(0.5),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.02)'
      : 'rgba(0, 0, 0, 0.02)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '3px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.spacing(1.5, 0, 0, 1.5),
  },
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(0, 0, 0, 0.04)',
    borderColor: theme.palette.primary.main,
  },
}));

const ParentPostContent = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const ParentPostHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: theme.palette.text.secondary,
}));

const ParentPostText = styled('div')(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  wordBreak: 'break-word',
  lineHeight: 1.4,
}));

const ParentPostSkeleton = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
  marginTop: theme.spacing(0.5),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.02)'
      : 'rgba(0, 0, 0, 0.02)',
}));

// Helper function to extract components from qortal:// URLs
const extractQortalComponents = (url: string) => {
  if (!url || !url.startsWith('qortal://')) {
    return null;
  }

  // Skip links starting with "qortal://use-"
  if (url.startsWith('qortal://use-')) {
    return null;
  }

  const cleanUrl = url.replace(/^(qortal:\/\/)/, '');
  if (cleanUrl.includes('/')) {
    const parts = cleanUrl.split('/');
    const service = parts[0].toUpperCase();
    parts.shift();
    const name = parts[0];
    parts.shift();
    let identifier;
    const path = parts.join('/');
    return { service, name, identifier, path };
  }

  return null;
};

export interface PostData {
  data: PostType;
  qortalMetadata: QortalMetadata;
  reposterName?: string; // Name of the user who reposted (for display purposes)
  reposterIdentifier?: string; // Identifier of the user who reposted
  reposterService?: string; // Service of the user who reposted
}

interface PostProps {
  post: PostData;
  onLike?: (postId: string, isLiked: boolean) => void;
  onRetweet?: (postId: string, post: PostData) => void;
  onReply?: (postId: string, postName: string) => void;
  onShare?: (postId: string, postName: string) => void;
  onForward?: (
    postId: string,
    postName: string,
    text?: string,
    author?: string,
    created?: number
  ) => void;
  onEdit?: (postId: string, post: PostData) => void;
  onDelete?: (post: PostData) => void;
  onPin?: (postId: string) => void;
  onClick?: (postId: string, postName: string) => void;
  onUserClick?: (userName: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  isPinned?: boolean;
  isReplyInThread?: boolean; // When true, hide the "Replying to" section for nested replies
}

export function Post({
  post,
  onLike = () => {},
  onRetweet = () => {},
  onReply = () => {},
  onShare = () => {},
  onForward = () => {},
  onEdit,
  onDelete,
  onPin,
  onClick = () => {},
  onUserClick,
  onHashtagClick,
  isPinned = false,
  isReplyInThread = false,
}: PostProps) {
  const { auth } = useGlobal();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(
    null
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const menuOpen = Boolean(anchorEl);
  const replyCount = useReplyCount(post.qortalMetadata.identifier);

  // Fetch parent post if this is a reply
  const { parentPost, isLoadingParent } = useParentPost(post.data?.location);

  const MAX_TEXT_LENGTH = 280;
  // Determine if this is a repost
  const isRepost = !!post.data?.repostMetadata;

  // Check ownership: for reposts, check both qortalMetadata.name and reposterName
  const isOwnPost =
    auth?.name === post.qortalMetadata.name ||
    (isRepost && auth?.name === post.reposterName);

  // Get the original post author for reposts
  const originalPostAuthor = isRepost
    ? post.data.repostMetadata?.originalPostName || post.qortalMetadata.name
    : post.qortalMetadata.name;

  // Get repost count for this post
  const repostCount = useRepostCount(
    post.qortalMetadata.identifier,
    originalPostAuthor
  );

  // Check if the current user has already reposted this original post
  const { hasReposted: hasAlreadyReposted, isLoading: isLoadingRepost } =
    useHasReposted(post.qortalMetadata.identifier, originalPostAuthor);

  // For reposts, use the original post identifier for likes
  const likeIdentifier = isRepost
    ? post.data.repostMetadata?.originalPostIdentifier ||
      post.qortalMetadata.identifier
    : post.qortalMetadata.identifier;

  // Check if the current user has liked this post (or the original post for reposts)
  const { hasLiked, isLoading: isLoadingLike } = useHasLiked(likeIdentifier);

  // Get like count for this post (or the original post for reposts)
  const likeCount = useLikeCount(likeIdentifier);

  // Disable repost button if:
  // 1. It's the original author's post (including if you're viewing your own original post)
  // 2. It's your own repost (you're viewing your repost of someone else's post)
  // 3. You've already reposted this original content (viewing someone's post that you've already reposted)
  const cannotRepost =
    auth?.name === originalPostAuthor || // Original author can't repost their own content
    isOwnPost || // Can't repost your own repost
    hasAlreadyReposted; // Already reposted this original post

  // Disable like button if user is the original post author (can't like your own post even if it's reposted)
  const cannotLike = auth?.name === originalPostAuthor;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit?.(post.qortalMetadata.identifier, post);
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    const copyPost = structuredClone(post);
    if (
      isRepost &&
      post.reposterName &&
      post.reposterIdentifier &&
      post.reposterService
    ) {
      copyPost.qortalMetadata.name = post.reposterName;
      copyPost.qortalMetadata.identifier = post.reposterIdentifier;
      copyPost.qortalMetadata.service = post.reposterService as Service;
    }

    onDelete?.(copyPost);
  };

  const handlePin = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onPin?.(post.qortalMetadata.identifier);
  };

  const handleReplyToClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (post.data?.location?.identifier) {
      onClick(
        post.data.location.identifier,
        post.data.location.name || post.qortalMetadata.name
      );
    }
  };

  const handleParentPostClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (parentPost) {
      onClick(
        parentPost.qortalMetadata.identifier,
        parentPost.qortalMetadata.name
      );
    }
  };

  const handleUserClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onUserClick) {
      // For reposts, navigate to original author; otherwise use the post's author
      const targetUser =
        isRepost && originalPostAuthor
          ? originalPostAuthor
          : post.qortalMetadata.name;
      onUserClick(targetUser);
    }
  };

  const handleHashtagClick = useCallback(
    (event: React.MouseEvent, hashtag: string) => {
      event.stopPropagation();
      if (onHashtagClick) {
        // Remove the # from the hashtag before passing to handler
        const cleanHashtag = hashtag.startsWith('#')
          ? hashtag.substring(1)
          : hashtag;
        onHashtagClick(cleanHashtag);
      }
    },
    [onHashtagClick]
  );

  const handleLinkClick = useCallback(
    async (event: React.MouseEvent, url: string) => {
      event.stopPropagation();
      event.preventDefault();

      try {
        // Copy link to clipboard
        await copyToClipboard(url);
        setCopiedLink(true);

        // Hide the indicator after 2 seconds
        setTimeout(() => {
          setCopiedLink(false);
        }, 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    },
    []
  );

  const handleLinkContextMenu = useCallback(
    (event: React.MouseEvent, url: string) => {
      // Allow right-click for copy functionality
      event.stopPropagation();
    },
    []
  );

  const handleCloseCopiedSnackbar = useCallback(() => {
    setCopiedLink(false);
  }, []);

  const handleQortalLinkClick = useCallback(
    async (event: React.MouseEvent, url: string) => {
      event.stopPropagation();
      event.preventDefault();

      try {
        let copyUrl: string = url;
        copyUrl = copyUrl?.replace(/^(qortal:\/\/)/, '');

        // Handle the new 'use' format
        if (copyUrl && copyUrl?.startsWith('use-')) {
          const parts = copyUrl.split('/');
          parts.shift();
          const action = parts.length > 0 ? parts[0].split('-')[1] : null; // e.g., 'invite' from 'action-invite'
          parts.shift();
          const id = parts.length > 0 ? parts[0].split('-')[1] : null; // e.g., '321' from 'groupid-321'
          if (action === 'join' && id) {
            await qortalRequest({
              action: 'JOIN_GROUP',
              groupId: +id,
            });
            return;
          }
        }

        // Handle regular qortal:// links
        const res = extractQortalComponents(url);
        if (res) {
          await qortalRequest({
            action: 'OPEN_NEW_TAB',
            qortalLink: url,
          });
        }
      } catch (error) {
        console.error('Failed to handle qortal link:', error);
      }
    },
    []
  );

  const handleShowMoreClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setIsExpanded(!isExpanded);
    },
    [isExpanded]
  );

  // Define imageUrls before handlers that use it
  const imageUrls = useMemo(
    () =>
      (post.data?.images || []).map(
        (image) => `data:image/jpeg;base64,${image.src}`
      ),
    [post.data?.images]
  );

  const handleImageClick = useCallback(
    (event: React.MouseEvent, imageIndex: number) => {
      event.stopPropagation();
      event.preventDefault();
      setSelectedImageIndex(imageIndex);
    },
    []
  );

  const handleCloseImageViewer = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedImageIndex(null);
  }, []);

  const handlePrevImage = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedImageIndex((prev) => {
      if (prev !== null && prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleNextImage = useCallback(
    (event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }
      setSelectedImageIndex((prev) => {
        if (prev !== null && prev < imageUrls.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    },
    [imageUrls.length]
  );

  // Keyboard navigation for image viewer
  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (event.key === 'ArrowRight') {
        handleNextImage();
      } else if (event.key === 'Escape') {
        handleCloseImageViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedImageIndex,
    handlePrevImage,
    handleNextImage,
    handleCloseImageViewer,
  ]);

  // Video click handlers
  const handleVideoClick = useCallback(
    (event: React.MouseEvent, mediaIndex: number) => {
      event.stopPropagation();
      event.preventDefault();
      setSelectedVideoIndex(mediaIndex);
    },
    []
  );

  const handleCloseVideoViewer = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedVideoIndex(null);
  }, []);

  // Keyboard navigation for video viewer
  useEffect(() => {
    if (selectedVideoIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseVideoViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVideoIndex, handleCloseVideoViewer]);

  // Parse text and render with clickable hashtags and links
  const renderTextWithHashtags = useMemo(() => {
    const text = post.data?.text || '';
    const shouldTruncate = text.length > MAX_TEXT_LENGTH && !isExpanded;
    const displayText = shouldTruncate ? text.slice(0, MAX_TEXT_LENGTH) : text;

    // Combined regex to match hashtags, HTTP URLs, and qortal:// URLs
    const combinedRegex = /(#\w+|https?:\/\/[^\s]+|qortal:\/\/[^\s]+)/g;

    const parts = displayText.split(combinedRegex);

    const elements = parts.map((part, index) => {
      if (!part) return null;

      // Check if it's a hashtag
      if (part.startsWith('#')) {
        return (
          <Hashtag key={index} onClick={(e) => handleHashtagClick(e, part)}>
            {part}
          </Hashtag>
        );
      }

      // Check if it's a qortal:// URL (skip qortal://use-embed/ links)
      if (
        part.startsWith('qortal://') &&
        !part.startsWith('qortal://use-embed/')
      ) {
        return (
          <QortalLinkText
            key={index}
            onClick={(e) => handleQortalLinkClick(e, part)}
            onContextMenu={(e) => e.stopPropagation()}
          >
            {part}
          </QortalLinkText>
        );
      }

      // Check if it's an HTTP/HTTPS URL
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <LinkText
            key={index}
            onClick={(e) => handleLinkClick(e, part)}
            onContextMenu={(e) => handleLinkContextMenu(e, part)}
          >
            {part}
          </LinkText>
        );
      }

      return part;
    });

    return elements;
  }, [
    post.data?.text,
    handleHashtagClick,
    handleLinkClick,
    handleLinkContextMenu,
    handleQortalLinkClick,
    isExpanded,
  ]);

  const needsShowMore = (post.data?.text || '').length > MAX_TEXT_LENGTH;

  // Fetch video metadata for new format videos
  const { videosWithMetadata, isLoading: isLoadingVideos } = useVideoMetadata(
    post.data?.videos
  );

  // Add skeleton placeholders for loading videos
  const videoSkeletons =
    isLoadingVideos && post.data?.videos
      ? post.data.videos.map((_, index) => ({
          type: 'video-skeleton' as const,
          index,
        }))
      : [];

  const allMedia = [
    ...imageUrls.map((url) => ({
      type: 'image' as const,
      url,
    })),
    // Show skeletons while loading, otherwise show videos with metadata
    ...(isLoadingVideos
      ? videoSkeletons
      : videosWithMetadata.map((video) => ({
          type: 'video' as const,
          url: video.videoUrl,
          metadata: video.metadata,
        }))),
  ];

  return (
    <PostContainer
      onClick={() =>
        onClick(post.qortalMetadata.identifier, post.qortalMetadata.name)
      }
    >
      <StyledAvatar
        src={`/arbitrary/THUMBNAIL/${isRepost && originalPostAuthor ? originalPostAuthor : post.qortalMetadata.name}/qortal_avatar?async=true`}
        alt={`${isRepost && originalPostAuthor ? originalPostAuthor : post.qortalMetadata.name} avatar`}
        onClick={handleUserClick}
        sx={{ cursor: onUserClick ? 'pointer' : 'default' }}
      >
        {isRepost && originalPostAuthor
          ? originalPostAuthor[0]
          : post.qortalMetadata.name[0]}
      </StyledAvatar>
      <PostContent>
        {isRepost && (
          <RepostedByIndicator>
            <RepeatIcon />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {post.reposterName || post.qortalMetadata.name} reposted
            </Typography>
          </RepostedByIndicator>
        )}
        {isPinned && (
          <PinnedIndicator>
            <PushPinIcon />
            <Typography variant="caption">Pinned</Typography>
          </PinnedIndicator>
        )}
        {!isReplyInThread && post.data?.location && (
          <ReplyingToIndicator onClick={handleReplyToClick}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              Replying to @{post.data.location.name}
            </Typography>
          </ReplyingToIndicator>
        )}
        {!isReplyInThread && post.data?.location && isLoadingParent && (
          <ParentPostSkeleton>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ flexShrink: 0 }}
            />
            <ParentPostContent>
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="75%" />
            </ParentPostContent>
          </ParentPostSkeleton>
        )}
        {!isReplyInThread && post.data?.location && parentPost && (
          <ParentPostContainer onClick={handleParentPostClick}>
            <StyledAvatar
              src={`/arbitrary/THUMBNAIL/${parentPost.qortalMetadata.name}/qortal_avatar?async=true`}
              alt={`${parentPost.qortalMetadata.name} avatar`}
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              {parentPost.qortalMetadata.name[0]}
            </StyledAvatar>
            <ParentPostContent>
              <ParentPostHeader>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: 'text.primary' }}
                >
                  {parentPost.qortalMetadata.name}
                </Typography>
                <Typography variant="caption">
                  · {formatTimestamp(parentPost.qortalMetadata.created)}
                </Typography>
              </ParentPostHeader>
              {parentPost.data?.text && (
                <ParentPostText>{parentPost.data.text}</ParentPostText>
              )}
              {parentPost.data?.images && parentPost.data.images.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  📷 {parentPost.data.images.length}{' '}
                  {parentPost.data.images.length === 1 ? 'image' : 'images'}
                </Typography>
              )}
              {parentPost.data?.videos && parentPost.data.videos.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  🎥 {parentPost.data.videos.length}{' '}
                  {parentPost.data.videos.length === 1 ? 'video' : 'videos'}
                </Typography>
              )}
            </ParentPostContent>
          </ParentPostContainer>
        )}
        <PostHeader>
          <UserInfo>
            <Typography
              variant="body1"
              fontWeight={700}
              onClick={handleUserClick}
              sx={{
                cursor: onUserClick ? 'pointer' : 'default',
                '&:hover': onUserClick ? { textDecoration: 'underline' } : {},
              }}
            >
              {isRepost && originalPostAuthor
                ? originalPostAuthor
                : post.qortalMetadata.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              · {formatTimestamp(post.qortalMetadata.created)}
            </Typography>
          </UserInfo>
          {isOwnPost && (
            <>
              <IconButton
                size="small"
                onClick={handleMenuClick}
                aria-controls={menuOpen ? 'post-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? 'true' : undefined}
              >
                <MoreHorizIcon fontSize="small" />
              </IconButton>
              <Menu
                id="post-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={() => handleMenuClose()}
                onClick={(e) => e.stopPropagation()}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* <MenuItem onClick={handlePin}>
                  <ListItemIcon>
                    <PushPinIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{isPinned ? 'Unpin' : 'Pin'}</ListItemText>
                </MenuItem> */}
                {!isRepost && (
                  <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                  </MenuItem>
                )}
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </PostHeader>

        <Typography
          variant="body1"
          sx={{ mb: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {renderTextWithHashtags}
          {needsShowMore && (
            <>
              {!isExpanded && '... '}
              <ShowMoreButton onClick={handleShowMoreClick}>
                {isExpanded ? 'Show less' : 'Show more'}
              </ShowMoreButton>
            </>
          )}
        </Typography>

        {allMedia.length > 0 && (
          <MediaContainer onClick={(e) => e.stopPropagation()}>
            <MediaGrid count={allMedia.length}>
              {allMedia.map((media, index) =>
                media.type === 'image' ? (
                  <MediaImage
                    key={index}
                    src={media.url}
                    alt={`Media ${index + 1}`}
                    onClick={(e) => handleImageClick(e, index)}
                  />
                ) : media.type === 'video-skeleton' ? (
                  <VideoSkeletonContainer key={`skeleton-${index}`}>
                    <VideoSkeletonContent>
                      <Skeleton
                        variant="rectangular"
                        width="100%"
                        height="100%"
                        animation="wave"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                        }}
                      />
                      <PlayCircleIcon
                        sx={{
                          fontSize: 64,
                          color: 'rgba(255, 255, 255, 0.3)',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      />
                    </VideoSkeletonContent>
                  </VideoSkeletonContainer>
                ) : (
                  <VideoContainer key={index}>
                    <MediaImage
                      src={
                        media.metadata?.videoImage || '/default-video-thumb.png'
                      }
                      alt={media.metadata?.title || `Video ${index + 1}`}
                      onClick={(e) => handleVideoClick(e, index)}
                    />
                    <VideoPlayIconOverlay>
                      <PlayCircleIcon
                        sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.9)' }}
                      />
                    </VideoPlayIconOverlay>
                    {media.metadata && (
                      <VideoMetadataOverlay>
                        <VideoTitle>{media.metadata.title}</VideoTitle>
                      </VideoMetadataOverlay>
                    )}
                  </VideoContainer>
                )
              )}
            </MediaGrid>
          </MediaContainer>
        )}

        <PostActions>
          <ActionGroup>
            <ActionButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onReply(
                  post.qortalMetadata.identifier,
                  post.qortalMetadata.name
                );
              }}
            >
              <ChatBubbleOutlineIcon fontSize="small" />
            </ActionButton>
            <Typography variant="body2" color="text.secondary">
              {replyCount || 0}
            </Typography>
          </ActionGroup>

          <ActionGroup>
            <ActionButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                // Prevent reposting own content or already retweeted content
                if (!cannotRepost && !isLoadingRepost) {
                  onRetweet(post.qortalMetadata.identifier, post);
                }
              }}
              sx={
                hasAlreadyReposted
                  ? { color: '#00ba7c' }
                  : cannotRepost || isLoadingRepost
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : {}
              }
              disabled={cannotRepost || isLoadingRepost}
            >
              {isLoadingRepost ? (
                <CircularProgress size={20} sx={{ color: 'inherit' }} />
              ) : (
                <RepeatIcon fontSize="small" />
              )}
            </ActionButton>
            <Typography
              variant="body2"
              color={hasAlreadyReposted ? '#00ba7c' : 'text.secondary'}
            >
              {repostCount}
            </Typography>
          </ActionGroup>

          <ActionGroup>
            <ActionButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                // For reposts, like the original post instead
                if (!cannotLike && !isLoadingLike) {
                  onLike(likeIdentifier, hasLiked);
                }
              }}
              sx={
                hasLiked
                  ? { color: '#f91880' }
                  : cannotLike || isLoadingLike
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : {}
              }
              disabled={cannotLike || isLoadingLike}
            >
              {isLoadingLike ? (
                <CircularProgress size={20} sx={{ color: 'inherit' }} />
              ) : hasLiked ? (
                <FavoriteIcon fontSize="small" />
              ) : (
                <FavoriteBorderIcon fontSize="small" />
              )}
            </ActionButton>
            <Typography
              variant="body2"
              color={hasLiked ? '#f91880' : 'text.secondary'}
            >
              {likeCount}
            </Typography>
          </ActionGroup>

          <ActionGroup>
            <ActionButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onForward(
                  post.qortalMetadata.identifier,
                  post.qortalMetadata.name,
                  post.data?.text || '',
                  originalPostAuthor || post.qortalMetadata.name,
                  post.data?.created || post.qortalMetadata.created
                );
              }}
            >
              <SendIcon fontSize="small" />
            </ActionButton>
          </ActionGroup>

          <ActionGroup>
            <ActionButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onShare(
                  post.qortalMetadata.identifier,
                  post.qortalMetadata.name
                );
              }}
            >
              <ShareIcon fontSize="small" />
            </ActionButton>
          </ActionGroup>
        </PostActions>
      </PostContent>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={selectedImageIndex !== null}
        onClose={() => handleCloseImageViewer()}
        maxWidth={false}
        onClick={(e) => e.stopPropagation()}
      >
        <ImageViewerContent onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={(e) => handleCloseImageViewer(e)}>
            <CloseIcon />
          </CloseButton>

          {selectedImageIndex !== null && imageUrls[selectedImageIndex] && (
            <>
              <FullScreenImage
                src={imageUrls[selectedImageIndex]}
                alt="Full screen view"
              />

              {/* Navigation buttons - only show if there are multiple images */}
              {imageUrls.length > 1 && (
                <>
                  <PrevButton
                    onClick={(e) => handlePrevImage(e)}
                    disabled={selectedImageIndex === 0}
                    sx={{
                      opacity: selectedImageIndex === 0 ? 0.3 : 1,
                      cursor:
                        selectedImageIndex === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ArrowBackIosNewIcon />
                  </PrevButton>

                  <NextButton
                    onClick={(e) => handleNextImage(e)}
                    disabled={selectedImageIndex === imageUrls.length - 1}
                    sx={{
                      opacity:
                        selectedImageIndex === imageUrls.length - 1 ? 0.3 : 1,
                      cursor:
                        selectedImageIndex === imageUrls.length - 1
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    <ArrowForwardIosIcon />
                  </NextButton>

                  <ImageCounter>
                    {selectedImageIndex + 1} / {imageUrls.length}
                  </ImageCounter>
                </>
              )}
            </>
          )}
        </ImageViewerContent>
      </ImageViewerDialog>

      {/* Video Viewer Dialog */}
      <ImageViewerDialog
        open={selectedVideoIndex !== null}
        onClose={() => handleCloseVideoViewer()}
        maxWidth={false}
        onClick={(e) => e.stopPropagation()}
      >
        <ImageViewerContent onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={(e) => handleCloseVideoViewer(e)}>
            <CloseIcon />
          </CloseButton>

          {selectedVideoIndex !== null &&
            allMedia[selectedVideoIndex] &&
            allMedia[selectedVideoIndex].type === 'video' &&
            (() => {
              const selectedVideo = allMedia[selectedVideoIndex];
              if (selectedVideo.type !== 'video') return null;

              return (
                <div
                  style={{
                    maxWidth: '1200px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px',
                  }}
                >
                  {/* Video Player */}
                  {selectedVideo.metadata?.videoReference && (
                    <div style={{ width: '100%', height: '70vh' }}>
                      <VideoPlayer
                        poster={selectedVideo.metadata.videoImage}
                        videoRef={videoRef}
                        qortalVideoResource={{
                          name: selectedVideo.metadata.videoReference.name,
                          service: selectedVideo.metadata.videoReference
                            .service as Service,
                          identifier:
                            selectedVideo.metadata.videoReference.identifier,
                        }}
                        autoPlay={true}
                        filename={selectedVideo.metadata.filename}
                        styling={{
                          progressSlider: {
                            thumbColor: 'white',
                            railColor: '',
                            trackColor: '#4285f4',
                          },
                        }}
                      />
                    </div>
                  )}

                  {/* Video metadata */}
                  {selectedVideo.metadata && (
                    <div
                      style={{
                        marginTop: '20px',
                        color: 'white',
                        width: '100%',
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        {selectedVideo.metadata.title}
                      </Typography>
                    </div>
                  )}
                </div>
              );
            })()}
        </ImageViewerContent>
      </ImageViewerDialog>

      {/* Copied Link Notification */}
      <Snackbar
        open={copiedLink}
        autoHideDuration={2000}
        onClose={handleCloseCopiedSnackbar}
        message="Link copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: (theme) => theme.palette.success.main,
            fontWeight: 500,
          },
        }}
      />
    </PostContainer>
  );
}
