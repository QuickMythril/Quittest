import { styled } from '@mui/system';
import { PostData } from './Post';
import { PostWrapper } from './PostWrapper';
import { NewPostInput, PostContent } from './NewPostInput';
import {
  QortalMetadata,
  QortalSearchParams,
  ResourceListDisplay,
  useGlobal,
  LoaderListStatus,
} from 'qapp-core';
import {
  ENTITY_POST,
  ENTITY_REPLY,
  ENTITY_REPOST,
  ENTITY_ROOT,
  LIST_POSTS_FEED,
} from '../constants/qdn';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  Box,
  CircularProgress,
  ButtonBase,
  Typography,
  Avatar,
} from '@mui/material';
import { LoaderState, LoaderItem } from './LoaderState';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useFollowedNamesDB } from '../hooks/useFollowingListDB';

const FeedContainer = styled('div')({
  width: '100%',
  maxWidth: '600px',
  minHeight: '100vh',
  position: 'relative',
});

const FeedHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(21, 32, 43, 0.85)'
      : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2.5),
  fontWeight: 700,
  fontSize: '22px',
  zIndex: 10,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 1px 0 rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.08)',
  letterSpacing: '-0.01em',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '&::before': {
    content: '""',
    width: '4px',
    height: '24px',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '4px',
  },
}));

const PostsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2, 0),
  overflowAnchor: 'auto', // CSS scroll anchoring to prevent jumps during content loading
}));

const AvatarGroup = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginRight: '4px',
});

const StyledAvatar = styled(Avatar)({
  width: 22,
  height: 22,
  border: '2px solid rgb(29, 155, 240)',
  marginLeft: '-6px',
  fontSize: '10px',
  '&:first-of-type': {
    marginLeft: 0,
  },
});

interface FeedProps {
  posts?: PostData[];
  onNewPost?: (content: PostContent) => void | Promise<void>;
  onLike?: (postId: string, isLiked: boolean) => void;
  onRetweet?: (postId: string, post: PostData) => void;
  onReply?: (postId: string, postName: string) => void;
  onShare?: (postId: string, postName: string) => void;
  onEdit?: (postId: string, post: PostData) => void;
  onDelete?: (post: PostData) => void;
  onPin?: (postId: string) => void;
  onPostClick?: (postId: string, postName: string) => void;
  onUserClick?: (userName: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  userAvatar?: string;
  userName?: string;
  isPublishing?: boolean;
  pinnedPostIds?: Set<string>;
  showAuthHint?: boolean;
}

export function Feed({
  onNewPost = () => {},
  onLike = () => {},
  onRetweet = () => {},
  onReply = () => {},
  onShare = () => {},
  onEdit,
  onDelete,
  onPin,
  onPostClick = () => {},
  onUserClick,
  onHashtagClick,
  userAvatar,
  userName = 'User',
  isPublishing = false,
  pinnedPostIds = new Set(),
  showAuthHint = false,
}: FeedProps) {
  const PAGE_SIZE = 5;
  const { identifierOperations } = useGlobal();
  const [searchPrefix, setSearchPrefix] = useState<string | null>(null);
  const [replySearchPrefix, setReplySearchPrefix] = useState<string | null>(
    null
  );
  const [repostSearchPrefix, setRepostSearchPrefix] = useState<string | null>(
    null
  );
  const [hasNewDataItem, setHasNewDataItem] = useState(false);
  const helperListMethodsRef = useRef<any>(null);
  const [namesOfNewData, setNamesOfNewData] = useState<string[]>([]);
  const fetchFollowedNames = useFollowedNamesDB();
  const [followingNames, setFollowingNames] = useState<string[]>([]);
  // Get up to 3 random followed users to display avatars
  // const displayAvatars = useMemo(() => {
  //   if (followedUsers.length === 0) return [];
  //   const shuffled = [...followedUsers].sort(() => 0.5 - Math.random());
  //   return shuffled.slice(0, 3);
  // }, [followedUsers]);

  // Build the search prefix for the secondary data source
  useEffect(() => {
    const buildPrefix = async () => {
      if (!identifierOperations) return;

      try {
        const followedNames = await fetchFollowedNames();

        setFollowingNames(followedNames);
        const prefix = await identifierOperations.buildSearchPrefix(
          ENTITY_POST,
          ENTITY_ROOT
        );
        setSearchPrefix(prefix);

        const replyPrefix = await identifierOperations.buildSearchPrefix(
          ENTITY_REPLY,
          ''
        );
        setReplySearchPrefix(replyPrefix);

        const repostPrefix = await identifierOperations.buildSearchPrefix(
          ENTITY_REPOST,
          ''
        );

        setRepostSearchPrefix(repostPrefix);
      } catch (error) {
        console.error('Failed to build search prefix:', error);
      }
    };

    buildPrefix();
  }, [identifierOperations]);

  const loaderItem = useCallback(() => {
    return <LoaderItem />;
  }, []);

  const loaderList = useCallback((status: LoaderListStatus) => {
    return (
      <LoaderState
        status={status}
        emptyIcon="📭"
        emptyTitle="No posts yet"
        emptyMessage="Check back later for new content."
      />
    );
  }, []);

  const onNewData = useCallback(
    (hasNewData: boolean, newResources: QortalMetadata[]) => {
      if (!hasNewData || !newResources?.length) {
        setHasNewDataItem(false);
        setNamesOfNewData([]);
        return;
      }

      // Filter out resources from my own name
      const filteredByName = newResources.filter(
        (resource) => resource.name !== userName
      );
      // Filter out duplicate identifiers
      const seenIdentifiers = new Set<string>();
      const uniqueResources = filteredByName.filter((resource) => {
        if (seenIdentifiers.has(resource.identifier)) {
          return false;
        }
        seenIdentifiers.add(resource.identifier);
        return true;
      });
      // Only update state if we have 5 or more unique resources
      if (uniqueResources.length >= 1) {
        setNamesOfNewData(
          uniqueResources.map((resource: QortalMetadata) => resource.name)
        );
        setHasNewDataItem(true);
      }
    },
    [userName]
  );
  const search = useMemo((): QortalSearchParams => {
    return {
      service: 'DOCUMENT',
      limit: PAGE_SIZE,
      reverse: true,
      identifier: '',
    };
  }, [PAGE_SIZE]);

  const intervalSearch = useMemo((): QortalSearchParams | null => {
    if (!searchPrefix) return null;
    return {
      identifier: searchPrefix,
      service: 'DOCUMENT',
      limit: PAGE_SIZE,
      reverse: true,
      // names: followingNames,
      // exactMatchNames: true,
      prefix: true,
    };
  }, [searchPrefix, PAGE_SIZE]);

  const secondaryDataSources = useMemo(() => {
    if (
      !followingNames ||
      followingNames?.length === 0 ||
      !replySearchPrefix ||
      !repostSearchPrefix
    )
      return undefined;
    return [
      {
        priority: 1,
        params: {
          service: 'DOCUMENT',
          identifier: replySearchPrefix,
          names: followingNames,
          exactMatchNames: true,
          reverse: true,
          prefix: true,
        },
      },
      {
        priority: 1,
        params: {
          service: 'DOCUMENT',
          identifier: repostSearchPrefix,
          names: followingNames,
          exactMatchNames: true,
          reverse: true,
          prefix: true,
        },
      },
    ];
  }, [replySearchPrefix, repostSearchPrefix, followingNames]);
  const listItem = useCallback(
    (item: { qortalMetadata: QortalMetadata; data: any }, _index: number) => {
      return (
        <PostWrapper
          post={item}
          onLike={onLike}
          onRetweet={onRetweet}
          onReply={onReply}
          onShare={onShare}
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
      onEdit,
      onDelete,
      onPin,
      onPostClick,
      onUserClick,
      pinnedPostIds,
    ]
  );

  // Don't render feed until follows are loaded and search prefix is built
  if (
    !intervalSearch ||
    !searchPrefix ||
    !replySearchPrefix ||
    !repostSearchPrefix
  ) {
    return (
      <FeedContainer>
        <FeedHeader>Home</FeedHeader>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 4,
          }}
        >
          <CircularProgress />
        </Box>
      </FeedContainer>
    );
  }
  return (
    <FeedContainer>
      <FeedHeader>
        Home
        {/* New posts available button - right side of header */}
        {hasNewDataItem && (
          <ButtonBase
            onClick={() => {
              helperListMethodsRef?.current?.resetSearch();
            }}
            sx={{
              marginLeft: 'auto',
              borderRadius: '9999px',
              overflow: 'hidden',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <Box
              sx={{
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                borderRadius: '9999px',
                background: 'rgb(29, 155, 240)',
                boxShadow: '0 2px 8px rgba(29, 155, 240, 0.4)',
              }}
            >
              {namesOfNewData.length > 0 && (
                <AvatarGroup>
                  {namesOfNewData.slice(0, 3).map((user, index) => (
                    <StyledAvatar
                      key={user}
                      src={`/arbitrary/THUMBNAIL/${user}/qortal_avatar?apiVersion=2`}
                      alt={user}
                      sx={{
                        zIndex: 3 - index,
                      }}
                    >
                      {user?.charAt(0).toUpperCase()}
                    </StyledAvatar>
                  ))}
                </AvatarGroup>
              )}
              <ArrowDownwardIcon
                fontSize="small"
                sx={{
                  color: '#ffffff',
                  fontSize: '16px',
                }}
              />
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              >
                New posts
              </Typography>
            </Box>
          </ButtonBase>
        )}
      </FeedHeader>
      <NewPostInput
        onPost={onNewPost}
        userAvatar={userAvatar}
        userName={userName}
        isPublishing={isPublishing}
        showAuthHint={showAuthHint}
      />
      <PostsContainer>
        {/* @ts-ignore - ref type issue with MemoExoticComponent */}
        <ResourceListDisplay
          styles={{
            gap: 20,
          }}
          retryAttempts={3}
          listName={LIST_POSTS_FEED}
          direction="VERTICAL"
          disableVirtualization
          // qapp-core supports limit for non-virtualized pagination; typing omits it
          // @ts-expect-error limit is supported at runtime
          limit={PAGE_SIZE}
          returnType="JSON"
          loaderList={loaderList}
          entityParams={{
            entityType: ENTITY_POST,
            parentId: ENTITY_ROOT,
          }}
          search={search}
          listItem={listItem}
          loaderItem={loaderItem}
          filterDuplicateIdentifiers={{
            enabled: true,
          }}
          secondaryDataSources={secondaryDataSources}
          searchNewData={
            intervalSearch
              ? {
                  interval: 10000,
                  intervalSearch,
                }
              : undefined
          }
          onNewData={onNewData}
          ref={helperListMethodsRef}
        />
      </PostsContainer>
    </FeedContainer>
  );
}
