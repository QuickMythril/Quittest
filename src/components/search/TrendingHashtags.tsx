import { styled } from '@mui/system';
import { useEffect, useState } from 'react';
import { Typography, CircularProgress, Box } from '@mui/material';
import { useGlobal } from 'qapp-core';
import TagIcon from '@mui/icons-material/Tag';
import { ENTITY_POST, ENTITY_ROOT } from '../../constants/qdn';

const TrendsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const TrendCard = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.04)'
      : 'rgba(0, 0, 0, 0.02)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateX(4px)',
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.08)'
        : 'rgba(29, 155, 240, 0.05)',
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
  gap: theme.spacing(2),
  color: theme.palette.text.secondary,
  textAlign: 'center',
}));

interface TrendingHashtagsProps {
  onSelectHashtag?: (hashtag: string) => void;
}

declare global {
  function qortalRequest(params: any): Promise<any>;
}

export function TrendingHashtags({ onSelectHashtag = () => {} }: TrendingHashtagsProps) {
  const { identifierOperations } = useGlobal();
  const [trends, setTrends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTrending = async () => {
      if (!identifierOperations?.buildSearchPrefix) return;
      setIsLoading(true);
      setError(null);
      try {
        const prefix = await identifierOperations.buildSearchPrefix(
          ENTITY_POST,
          ENTITY_ROOT
        );

        const res = await fetch(
          `/arbitrary/resources/search?service=DOCUMENT&identifier=${prefix}&description=~%23&prefix=true&includemetadata=true&limit=100&reverse=true&mode=ALL`
        );
        if (!res?.ok) {
          throw new Error('Failed to load hashtags');
        }
        const response = await res.json();
        if (!isMounted) return;

        const topicCounts = new Map<string, number>();
        for (const resource of response) {
          const desc = resource?.metadata?.description;
          if (!desc || typeof desc !== 'string') continue;
          const regex = /~#(\w+)~/g;
          let match;
          while ((match = regex.exec(desc)) !== null) {
            const tag = `#${match[1].toLowerCase()}`;
            topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
          }
        }

        const sorted = Array.from(topicCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);

        setTrends(sorted);
      } catch (err) {
        console.error('Error fetching trending hashtags:', err);
        if (isMounted) setError('Failed to load hashtags');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTrending();
    return () => {
      isMounted = false;
    };
  }, [identifierOperations]);

  if (isLoading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <Typography variant="h6">Unable to load hashtags</Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </EmptyState>
    );
  }

  if (!trends.length) {
    return (
      <EmptyState>
        <TagIcon sx={{ fontSize: 64, opacity: 0.3 }} />
        <Typography variant="h6">No trending hashtags</Typography>
        <Typography variant="body2" color="text.secondary">
          Check back soon for new posts
        </Typography>
      </EmptyState>
    );
  }

  return (
    <TrendsContainer>
      {trends.map((tag) => (
        <TrendCard key={tag} onClick={() => onSelectHashtag(tag.replace(/^#/, ''))}>
          <Typography variant="body2" color="text.secondary">
            Trending
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {tag}
          </Typography>
        </TrendCard>
      ))}
    </TrendsContainer>
  );
}
