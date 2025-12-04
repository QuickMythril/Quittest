import { Box, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
import { LoaderListStatus } from 'qapp-core';
import { memo } from 'react';

interface LoaderStateProps {
  status: LoaderListStatus | 'ERROR';
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
}

export function LoaderState({
  status,
  emptyIcon = '📭',
  emptyTitle = 'No results',
  emptyMessage = 'Check back later for new content.',
}: LoaderStateProps) {
  if (status === 'ERROR') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.03)',
            fontSize: '40px',
          }}
        >
          ⚠️
        </Box>
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <Box
            sx={{
              fontSize: '20px',
              fontWeight: 600,
              mb: 1,
              color: (theme) => theme.palette.text.primary,
            }}
          >
            Unable to load content
          </Box>
          <Box
            sx={{
              fontSize: '15px',
              color: (theme) => theme.palette.text.secondary,
              lineHeight: 1.5,
            }}
          >
            Please try again in a moment.
          </Box>
        </Box>
      </Box>
    );
  }

  if (status === 'NO_RESULTS') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.03)',
            fontSize: '40px',
          }}
        >
          {emptyIcon}
        </Box>
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <Box
            sx={{
              fontSize: '20px',
              fontWeight: 600,
              mb: 1,
              color: (theme) => theme.palette.text.primary,
            }}
          >
            {emptyTitle}
          </Box>
          <Box
            sx={{
              fontSize: '15px',
              color: (theme) => theme.palette.text.secondary,
              lineHeight: 1.5,
            }}
          >
            {emptyMessage}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
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
  );
}

const SkeletonPostContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2.5),
  gap: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  width: '100%',
  minHeight: '140px', // Reduced from 180px for better performance
  // Performance optimizations
  contain: 'layout style paint', // Isolate rendering
  willChange: 'opacity', // Hint browser for animation optimization
  animation: 'pulse 2s ease-in-out infinite', // Slower animation for smoother performance
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.7,
    },
  },
}));

// Optimized skeleton bar component - uses pure CSS instead of MUI Skeleton for better performance
const SkeletonBar = styled('div')<{ width?: string; height?: number }>(
  ({ theme, width = '100%', height = 16 }) => ({
    width,
    height,
    borderRadius: 4,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.11)'
        : 'rgba(0, 0, 0, 0.11)',
    // Disable MUI Skeleton's built-in animation to reduce performance overhead
    animation: 'none',
  })
);

const SkeletonCircle = styled('div')<{ size: number }>(({ theme, size }) => ({
  width: size,
  height: size,
  borderRadius: '50%',
  flexShrink: 0,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.11)'
      : 'rgba(0, 0, 0, 0.11)',
  animation: 'none',
}));

// Memoize to prevent unnecessary re-renders during scrolling
export const LoaderItem = memo(function LoaderItem() {
  // Simplified skeleton structure for better performance
  // Removed randomization to reduce complexity
  return (
    <SkeletonPostContainer>
      {/* Avatar */}
      <SkeletonCircle size={48} />

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Header - Username and timestamp */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SkeletonBar width="120px" height={20} />
          <SkeletonBar width="80px" height={16} />
        </Box>

        {/* Post content - Fixed 3 lines for consistency */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <SkeletonBar width="100%" height={18} />
          <SkeletonBar width="95%" height={18} />
          <SkeletonBar width="85%" height={18} />
        </Box>

        {/* Action buttons - simplified */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 0.5 }}>
          <SkeletonCircle size={20} />
          <SkeletonCircle size={20} />
          <SkeletonCircle size={20} />
          <SkeletonCircle size={20} />
        </Box>
      </Box>
    </SkeletonPostContainer>
  );
});
