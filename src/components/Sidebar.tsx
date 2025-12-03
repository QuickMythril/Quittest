import { styled } from '@mui/system';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { NameSwitcher } from './NameSwitcher';
import { WhatsHappening } from './WhatsHappening';

const SidebarContainer = styled('div')(({ theme }) => ({
  width: '290px',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflowY: 'auto',
  scrollBehavior: 'smooth',
  // Hide scrollbar on small screens for cleaner look
  [theme.breakpoints.down('md')]: {
    width: '68px',
    '&::-webkit-scrollbar': {
      width: '4px',
    },
  },
}));

const NavButton = styled('button')<{ active?: boolean }>(
  ({ theme, active }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2.5),
    borderRadius: '28px',
    border: 'none',
    backgroundColor: active
      ? theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.15)'
        : 'rgba(29, 155, 240, 0.1)'
      : 'transparent',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: active ? 700 : 400,
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: active ? '4px' : '0',
      height: '60%',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '0 4px 4px 0',
      transition: 'width 0.3s ease',
    },
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(29, 155, 240, 0.15)'
          : 'rgba(29, 155, 240, 0.1)',
      transform: 'translateX(4px)',
      '& svg': {
        transform: 'scale(1.1)',
      },
    },
    '& svg': {
      transition: 'transform 0.2s ease',
    },
    [theme.breakpoints.down('md')]: {
      width: '52px',
      height: '52px',
      justifyContent: 'center',
      padding: theme.spacing(1.5),
    },
  })
);

const NavLabel = styled('span')(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const TweetButton = styled('button')(({ theme }) => ({
  background: theme.palette.primary.main,
  color: '#fff',
  border: 'none',
  borderRadius: '28px',
  padding: theme.spacing(2),
  fontWeight: 700,
  fontSize: '17px',
  cursor: 'pointer',
  marginTop: theme.spacing(2),
  transition: 'all 0.2s ease',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 1px 3px rgba(0, 0, 0, 0.3)'
      : '0 1px 3px rgba(0, 0, 0, 0.12)',
  '&:hover': {
    background: theme.palette.primary.dark,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 2px 6px rgba(0, 0, 0, 0.4)'
        : '0 2px 6px rgba(0, 0, 0, 0.15)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  [theme.breakpoints.down('md')]: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    padding: 0,
    fontSize: '24px',
  },
}));

const TweetButtonText = styled('span')(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const TweetButtonIcon = styled('span')(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'block',
  },
}));


interface SidebarProps {
  onNavigate?: (page: string) => void;
  onTweet?: () => void;
  onSearch?: (query: string) => void;
  onTrendClick?: (trend: string) => void;
  onFollow?: (userId: string) => void;
  activePage?: string;
}

export function Sidebar({
  onNavigate = () => {},
  onTweet = () => {},
  activePage = 'home',
}: SidebarProps) {
  return (
    <SidebarContainer>
      <NavButton
        active={activePage === 'home'}
        onClick={() => onNavigate('home')}
      >
        <HomeIcon />
        <NavLabel>Home</NavLabel>
      </NavButton>
      <NavButton
        active={activePage === 'search'}
        onClick={() => onNavigate('search')}
      >
        <SearchIcon />
        <NavLabel>Search</NavLabel>
      </NavButton>
      {/* <NavButton
        active={activePage === 'notifications'}
        onClick={() => onNavigate('notifications')}
      >
        <NotificationsIcon />
        <NavLabel>Notifications</NavLabel>
      </NavButton> */}
      {/* <NavButton active={activePage === 'messages'} onClick={() => onNavigate('messages')}>
        <MailIcon />
        <NavLabel>Messages</NavLabel>
      </NavButton> */}
      {/* <NavButton active={activePage === 'bookmarks'} onClick={() => onNavigate('bookmarks')}>
        <BookmarkIcon />
        <NavLabel>Bookmarks</NavLabel>
      </NavButton> */}
      <NavButton
        active={activePage === 'profile'}
        onClick={() => onNavigate('profile')}
      >
        <PersonIcon />
        <NavLabel>Profile</NavLabel>
      </NavButton>
      {/* <NavButton onClick={() => onNavigate('more')}>
        <MoreHorizIcon />
        <NavLabel>More</NavLabel>
      </NavButton> */}

      <TweetButton onClick={onTweet}>
        <TweetButtonText>Post</TweetButtonText>
        <TweetButtonIcon>+</TweetButtonIcon>
      </TweetButton>

      <NameSwitcher />
    </SidebarContainer>
  );
}

export function RightSidebar({
  onTrendClick = () => {},
}: {
  onTrendClick?: (trend: string) => void;
}) {
  return (
    <SidebarContainer>
      <WhatsHappening onTrendClick={onTrendClick} />

      {/* <WhoToFollowContainer>
        <WhoToFollowHeader>Who to follow</WhoToFollowHeader>
        {suggestedUsers.map((user) => (
          <FollowUserItem key={user.id}>
            <UserInfo>
              <UserAvatar>{user.name[0]}</UserAvatar>
              <UserDetails>
                <UserNameRow>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ fontSize: '15px' }}
                  >
                    {user.name}
                  </Typography>
                  {user.verified && (
                    <VerifiedIcon sx={{ fontSize: '18px', color: '#1d9bf0' }} />
                  )}
                </UserNameRow>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '15px' }}
                >
                  @{user.username}
                </Typography>
              </UserDetails>
            </UserInfo>
            <FollowButton onClick={() => onFollow(user.id)}>
              Follow
            </FollowButton>
          </FollowUserItem>
        ))}
      </WhoToFollowContainer> */}
    </SidebarContainer>
  );
}
