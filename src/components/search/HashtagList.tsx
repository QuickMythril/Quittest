import { styled } from '@mui/system';
import { Typography, CircularProgress, Box } from '@mui/material';
import TagIcon from '@mui/icons-material/Tag';

const ListContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const Card = styled('div')(({ theme }) => ({
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

export interface HashtagListItem {
  tag: string;
  count?: number;
}

interface HashtagListProps {
  title?: string;
  tags: HashtagListItem[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onSelect?: (tag: string) => void;
}

export function HashtagList({
  title,
  tags,
  isLoading = false,
  error = null,
  emptyMessage = 'No hashtags found',
  onSelect = () => {},
}: HashtagListProps) {
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

  if (!tags.length) {
    return (
      <EmptyState>
        <TagIcon sx={{ fontSize: 64, opacity: 0.3 }} />
        <Typography variant="h6">{emptyMessage}</Typography>
      </EmptyState>
    );
  }

  return (
    <ListContainer>
      {title && (
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      )}
      {tags.map(({ tag, count }) => (
        <Card key={tag} onClick={() => onSelect(tag.replace(/^#/, ''))}>
          <Typography variant="body2" color="text.secondary">
            {count !== undefined ? `${count} posts` : 'Hashtag'}
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {tag}
          </Typography>
        </Card>
      ))}
    </ListContainer>
  );
}
