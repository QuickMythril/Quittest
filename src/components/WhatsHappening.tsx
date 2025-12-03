import { styled } from '@mui/system';
import { Typography, CircularProgress, Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useGlobal } from 'qapp-core';
import { ENTITY_POST, ENTITY_ROOT } from '../constants/qdn';

const TrendsContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 4px 16px rgba(0, 0, 0, 0.4)'
        : '0 4px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const TrendsHeader = styled('div')(({ theme }) => ({
  padding: theme.spacing(2.5, 2),
  fontWeight: 700,
  fontSize: '20px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(29, 155, 240, 0.1), rgba(120, 86, 255, 0.1))'
      : 'linear-gradient(135deg, rgba(29, 155, 240, 0.05), rgba(120, 86, 255, 0.05))',
}));

const TrendItem = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  borderLeft: '3px solid transparent',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.08)'
        : 'rgba(29, 155, 240, 0.05)',
    borderLeftColor: theme.palette.primary.main,
    transform: 'translateX(4px)',
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
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
  textAlign: 'center',
}));

interface Trend {
  topic: string;
  posts: number;
  category: string;
}

interface WhatsHappeningProps {
  onTrendClick?: (trend: string) => void;
}

declare global {
  function qortalRequest(params: any): Promise<any>;
}

export function WhatsHappening({
  onTrendClick = () => {},
}: WhatsHappeningProps) {
  const { identifierOperations } = useGlobal();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTrendingData = async () => {
      if (!identifierOperations?.buildSearchPrefix) {
        console.log('Identifier operations not available yet');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Build the search prefix for posts
        const prefix = await identifierOperations.buildSearchPrefix(
          ENTITY_POST,
          ENTITY_ROOT
        );
        const res = await fetch(
          `/arbitrary/resources/search?service=DOCUMENT&identifier=${prefix}&description=~%23&prefix=true&includemetadata=true&limit=100&reverse=true&mode=ALL`
        );
        if (!res?.ok) return;
        const response = await res.json();
        if (!isMounted) return;

        if (!response || !Array.isArray(response)) {
          console.error('Invalid response format:', response);
          setTrends([]);
          return;
        }

        // Process posts to extract trending topics from metadata
        const topicCounts = new Map<string, number>();

        // Extract hashtags from metadata descriptions
        for (const resource of response) {
          try {
            if (!resource.metadata?.description) continue;

            // Parse hashtags from description format: ~#hashtag~
            const description = resource.metadata.description;
            const hashtagRegex = /~#(\w+)~/g;
            let match;

            while ((match = hashtagRegex.exec(description)) !== null) {
              const hashtag = `#${match[1]}`;
              const normalizedTag = hashtag.toLowerCase();
              topicCounts.set(
                normalizedTag,
                (topicCounts.get(normalizedTag) || 0) + 1
              );
            }
          } catch (err) {
            console.error('Error processing resource metadata:', err);
            // Continue processing other posts
          }
        }

        if (!isMounted) return;

        // Sort by count and take top 5
        const sortedTrends = Array.from(topicCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([topic, count]) => ({
            topic,
            posts: count,
            category: 'Trending',
          }));

        setTrends(sortedTrends);
      } catch (err) {
        console.error('Error fetching trending data:', err);
        if (isMounted) {
          setError('Failed to load trending topics');
          setTrends([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTrendingData();

    // Refresh trends every 5 minutes
    const interval = setInterval(
      () => {
        fetchTrendingData();
      },
      15 * 60 * 1000
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [identifierOperations.buildSearchPrefix]);

  return (
    <TrendsContainer>
      <TrendsHeader>What's happening</TrendsHeader>

      {isLoading ? (
        <LoadingContainer>
          <CircularProgress size={24} />
        </LoadingContainer>
      ) : error ? (
        <EmptyState>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </EmptyState>
      ) : trends.length === 0 ? (
        <EmptyState>
          <Typography variant="body2" color="text.secondary">
            No trending topics yet
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Check back later for updates
          </Typography>
        </EmptyState>
      ) : (
        trends.map((trend, index) => (
          <TrendItem key={index} onClick={() => onTrendClick(trend.topic)}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '13px' }}
            >
              Trending
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {trend.topic}
            </Typography>
          </TrendItem>
        ))
      )}
    </TrendsContainer>
  );
}
