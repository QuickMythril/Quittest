import { styled } from '@mui/system';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import TagIcon from '@mui/icons-material/Tag';
import { PostData } from '../Post';
import { PostWrapper } from '../PostWrapper';
import { ResourceListDisplay, LoaderListStatus } from 'qapp-core';
import { LoaderState, LoaderItem } from '../LoaderState';
import { ENTITY_POST, ENTITY_ROOT } from '../../constants/qdn';
import { QortalSearchParams } from 'qapp-core';
import { TrendingHashtags } from './TrendingHashtags';

const ResultsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  overflowAnchor: 'auto', // CSS scroll anchoring to prevent jumps during content loading
}));

const EmptyState = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
  gap: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

interface HashtagSearchResultsProps {
  onUserClick?: (userName: string) => void;
  onPostClick?: (postId: string, postName: string) => void;
  onLike?: (postId: string, isLiked: boolean) => void;
  onRetweet?: (postId: string, post?: PostData) => void;
  onReply?: (postId: string, postName: string) => void;
  onShare?: (postId: string, postName: string) => void;
  onEdit?: (postId: string, post: PostData) => void;
  onDelete?: (post: PostData) => void;
  onPin?: (postId: string) => void;
  pinnedPostIds?: Set<string>;
}

export function HashtagSearchResults({
  onUserClick,
  onPostClick,
  onLike,
  onRetweet,
  onReply,
  onShare,
  onEdit,
  onDelete,
  onPin,
  pinnedPostIds = new Set(),
}: HashtagSearchResultsProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');

  // Initialize from URL params and trigger search immediately when query changes
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
  }, [searchParams]);

  // Set up search parameters for hashtag ResourceListDisplay
  const hashtagSearch = useMemo((): QortalSearchParams | null => {
    if (!searchQuery.trim()) {
      return null;
    }

    const cleanHashtag = searchQuery.startsWith('#')
      ? `~${searchQuery}~`
      : `~#${searchQuery}~`;

    return {
      service: 'DOCUMENT',
      identifier: '',
      description: encodeURIComponent(cleanHashtag),
      limit: 20,
      reverse: true,
    } as QortalSearchParams;
  }, [searchQuery]);

  // Loader for posts list
  const loaderList = useCallback((status: LoaderListStatus) => {
    return (
      <LoaderState
        status={status}
        emptyIcon="🔍"
        emptyTitle="No posts found"
        emptyMessage={
          status === 'ERROR'
            ? 'Unable to load hashtag results right now.'
            : 'No posts found with this hashtag'
        }
      />
    );
  }, []);

  // Loader for individual post items
  const loaderItem = useCallback(() => {
    return <LoaderItem />;
  }, []);

  // Handle hashtag click from posts in search results
  const handleHashtagClickInResults = useCallback(
    (hashtag: string) => {
      setSearchParams({ q: hashtag });
    },
    [setSearchParams]
  );

  // Render individual post item
  const listItem = useCallback(
    (item: { qortalMetadata: any; data: any }, _index: number) => {
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
          onHashtagClick={handleHashtagClickInResults}
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
      handleHashtagClickInResults,
    ]
  );

  if (!searchQuery) {
    return <TrendingHashtags onSelectHashtag={(tag) => setSearchParams({ q: tag })} />;
  }

  if (!hashtagSearch) {
    return null;
  }

  return (
    <ResultsContainer>
      <ResourceListDisplay
        styles={{
          gap: 20,
        }}
        retryAttempts={3}
        listName={`search-hashtag`}
        direction="VERTICAL"
        disableVirtualization
        disablePagination
        returnType="JSON"
        loaderList={loaderList}
        entityParams={{
          entityType: ENTITY_POST,
          parentId: ENTITY_ROOT,
        }}
        search={hashtagSearch}
        listItem={listItem}
        loaderItem={loaderItem}
        filterDuplicateIdentifiers={{
          enabled: true,
        }}
      />
    </ResultsContainer>
  );
}
