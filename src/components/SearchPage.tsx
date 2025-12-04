import { styled } from '@mui/system';
import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import TagIcon from '@mui/icons-material/Tag';
import { UserSearchResults } from './search/UserSearchResults';
import { HashtagSearchResults } from './search/HashtagSearchResults';
import { PostData } from './Post';

const PageContainer = styled('div')(({ theme }) => ({
  width: '100%',
  minHeight: '100vh',
  borderLeft: `1px solid ${theme.palette.divider}`,
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(21, 32, 43, 0.6)'
      : 'rgba(255, 255, 255, 0.8)',
}));

const Header = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(21, 32, 43, 0.95)'
      : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(12px)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const TopRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap',
});

const BackButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
  },
}));

const SearchSection = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
});

const SearchButton = styled(Button)({
  minWidth: '100px',
  height: '40px',
  borderRadius: '20px',
  textTransform: 'none',
  fontWeight: 600,
});

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButton-root': {
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    padding: theme.spacing(1, 2),
    textTransform: 'none',
    fontWeight: 500,
    gap: theme.spacing(1),
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: '#fff',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(29, 155, 240, 0.1)'
          : 'rgba(29, 155, 240, 0.08)',
    },
  },
}));

const Content = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
}));

interface SearchPageProps {
  onBack?: () => void;
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

type SearchType = 'users' | 'hashtags';
type SortOrder = 'recent' | 'most' | 'az';

export function SearchPage({
  onBack,
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
}: SearchPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine search type from route
  const isHashtagsRoute = location.pathname === '/search/hashtags';
  const searchType: SearchType = isHashtagsRoute ? 'hashtags' : 'users';

  // Local input state (not submitted to URL yet)
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');

  const handleSearchTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: SearchType | null
  ) => {
    if (newType) {
      // Navigate to the appropriate route with the current search query
      const currentQuery = searchParams.get('q') || '';
      if (newType === 'users') {
        navigate(
          `/search/users${currentQuery ? `?q=${encodeURIComponent(currentQuery)}` : ''}`
        );
      } else {
        navigate(
          `/search/hashtags${currentQuery ? `?q=${encodeURIComponent(currentQuery)}` : ''}`
        );
      }
    }
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortOrder(event.target.value as SortOrder);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const clearSearch = () => {
    setInputValue('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params);
  };

  const executeSearch = () => {
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      executeSearch();
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  return (
    <PageContainer>
      <Header>
        <TopRow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <BackButton onClick={handleBackClick}>
              <ArrowBackIcon />
            </BackButton>
            <Typography variant="h6" fontWeight={700}>
              Search
            </Typography>
          </div>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="sort-by-label">Sort by</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortOrder}
              label="Sort by"
              onChange={handleSortChange}
            >
              <MenuItem value="recent">Recent</MenuItem>
              <MenuItem value="most">Most</MenuItem>
              <MenuItem value="az">A-Z</MenuItem>
            </Select>
          </FormControl>
        </TopRow>

        <SearchSection>
          <TextField
            fullWidth
            placeholder={
              searchType === 'users' ? 'Search users...' : 'Search hashtags...'
            }
            variant="outlined"
            size="small"
            value={inputValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: inputValue ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Clear search"
                    size="small"
                    onClick={clearSearch}
                    edge="end"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
              sx: {
                borderRadius: '24px',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
              },
            }}
          />
          <SearchButton
            variant="contained"
            onClick={executeSearch}
            disabled={!inputValue.trim()}
          >
            Search
          </SearchButton>
        </SearchSection>

        <StyledToggleButtonGroup
          value={searchType}
          exclusive
          onChange={handleSearchTypeChange}
          fullWidth
        >
          <ToggleButton value="users">
            <PersonIcon fontSize="small" />
            Users
          </ToggleButton>
          <ToggleButton value="hashtags">
            <TagIcon fontSize="small" />
            Hashtags
          </ToggleButton>
        </StyledToggleButtonGroup>
      </Header>

      <Content>
        {searchType === 'users' ? (
          <UserSearchResults
            onUserClick={onUserClick}
            sortOrder={sortOrder}
          />
        ) : (
          <HashtagSearchResults
            sortOrder={sortOrder}
            onUserClick={onUserClick}
            onPostClick={onPostClick}
            onLike={onLike}
            onRetweet={onRetweet}
            onReply={onReply}
            onShare={onShare}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            pinnedPostIds={pinnedPostIds}
          />
        )}
      </Content>
    </PageContainer>
  );
}
