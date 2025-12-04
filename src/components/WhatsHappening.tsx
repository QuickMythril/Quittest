import { styled } from '@mui/system';
import { Typography, CircularProgress, Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTrendingHashtags } from '../hooks/useTrendingHashtags';

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

export function WhatsHappening({
  onTrendClick = () => {},
}: WhatsHappeningProps) {
  const { tags, isLoading, error, refetch } = useTrendingHashtags(5);

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
          <Typography
            variant="caption"
            color="primary"
            sx={{ mt: 1, cursor: 'pointer' }}
            onClick={refetch}
          >
            Retry
          </Typography>
        </EmptyState>
      ) : tags.length === 0 ? (
        <EmptyState>
          <Typography variant="body2" color="text.secondary">
            No trending topics yet
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Check back later for updates
          </Typography>
        </EmptyState>
      ) : (
        tags.map((trend, index) => (
          <TrendItem key={index} onClick={() => onTrendClick(trend.tag)}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '13px' }}
            >
              Trending
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {trend.tag}
            </Typography>
          </TrendItem>
        ))
      )}
    </TrendsContainer>
  );
}
