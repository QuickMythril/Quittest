import { styled } from '@mui/system';
import {
  Typography,
  IconButton,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Switch,
  FormControlLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReplyIcon from '@mui/icons-material/Reply';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useCallback, useState, useMemo, useEffect } from 'react';
import { useAtom } from 'jotai';
import { useGlobal } from 'qapp-core';
import {
  notificationsAtom,
  isLoadingNotificationsAtom,
  notificationSnackbarEnabledAtom,
  notificationSoundEnabledAtom,
} from '../state/global/notifications';
import { setLastViewedNotificationsTimestamp } from '../utils/notificationTimestamp';
import { testNotificationSound } from '../utils/notificationSound';

const PageContainer = styled('div')({
  width: '100%',
  maxWidth: '600px',
  minHeight: '100vh',
  position: 'relative',
});

const PageHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(21, 32, 43, 0.85)'
      : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 1px 0 rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 1px 0 rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.08)',
}));

const HeaderTop = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const BackButton = styled(IconButton)(({ theme }) => ({
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

const NotificationsList = styled('div')({
  display: 'flex',
  flexDirection: 'column',
});

const NotificationItem = styled('div')<{ unread?: boolean }>(
  ({ theme, unread }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    padding: theme.spacing(2.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: unread
      ? theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.05)'
        : 'rgba(29, 155, 240, 0.03)'
      : 'transparent',
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.02)',
    },
  })
);

const NotificationIcon = styled('div')<{
  type: 'follower' | 'mention' | 'reply';
}>(({ theme, type }) => {
  const colors = {
    follower: theme.palette.primary.main,
    mention: theme.palette.warning.main,
    reply: theme.palette.success.main,
  };
  return {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.palette.mode === 'dark' ? `${colors[type]}20` : `${colors[type]}15`,
    color: colors[type],
    flexShrink: 0,
  };
});

const NotificationContent = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const NotificationText = styled(Typography)(({ theme }) => ({
  fontSize: '15px',
  lineHeight: 1.5,
  color: theme.palette.text.primary,
  '& strong': {
    fontWeight: 700,
    color: theme.palette.text.primary,
  },
}));

const NotificationTime = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: theme.palette.text.secondary,
}));

const EmptyState = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(8, 4),
  gap: theme.spacing(2),
  minHeight: '400px',
  textAlign: 'center',
}));

const EmptyIcon = styled('div')(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '64px',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(29, 155, 240, 0.1), rgba(29, 155, 240, 0.05))'
      : 'linear-gradient(135deg, rgba(29, 155, 240, 0.08), rgba(29, 155, 240, 0.03))',
  border: `2px solid ${
    theme.palette.mode === 'dark'
      ? 'rgba(29, 155, 240, 0.2)'
      : 'rgba(29, 155, 240, 0.15)'
  }`,
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  width: '100%',
  '& .MuiToggleButton-root': {
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    padding: theme.spacing(1, 2),
    textTransform: 'none',
    fontWeight: 500,
    gap: theme.spacing(1),
    flex: 1,
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

const InfoBanner = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  margin: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(29, 155, 240, 0.1)'
      : 'rgba(29, 155, 240, 0.08)',
  border: `1px solid ${
    theme.palette.mode === 'dark'
      ? 'rgba(29, 155, 240, 0.2)'
      : 'rgba(29, 155, 240, 0.15)'
  }`,
}));

const SettingsSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(29, 155, 240, 0.03)'
      : 'rgba(29, 155, 240, 0.02)',
}));

const SettingItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.08)'
        : 'rgba(29, 155, 240, 0.05)',
  },
}));

const SettingInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const SettingTitle = styled(Typography)(({ theme }) => ({
  fontSize: '15px',
  fontWeight: 600,
  color: theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const SettingDescription = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: theme.palette.text.secondary,
}));

import type { Notification } from '../state/global/notifications';

interface NotificationsPageProps {
  onBack?: () => void;
  onUserClick?: (userName: string) => void;
  onPostClick?: (postId: string, postName: string) => void;
}

type NotificationTab = 'all' | 'followers' | 'mentions' | 'replies';

// Format timestamp to relative time string
const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (weeks > 0) return `${weeks}w`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'now';
};

export function NotificationsPage({
  onBack = () => {},
  onUserClick,
  onPostClick,
}: NotificationsPageProps) {
  const { auth } = useGlobal();
  const [notifications, setNotifications] = useAtom(notificationsAtom);
  const [isLoading] = useAtom(isLoadingNotificationsAtom);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [snackbarEnabled, setSnackbarEnabled] = useAtom(
    notificationSnackbarEnabledAtom
  );
  const [soundEnabled, setSoundEnabled] = useAtom(notificationSoundEnabledAtom);

  // Update last viewed timestamp when page mounts
  useEffect(() => {
    if (auth?.name) {
      setLastViewedNotificationsTimestamp(auth.name);
    }
  }, [auth?.name]);

  const handleTabChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTab: NotificationTab | null
  ) => {
    if (newTab !== null) {
      setActiveTab(newTab);
    }
  };

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (activeTab !== 'all') {
      filtered = notifications.filter((notification) => {
        switch (activeTab) {
          case 'followers':
            return notification.type === 'follower';
          case 'mentions':
            return notification.type === 'mention';
          case 'replies':
            return notification.type === 'reply';
          default:
            return true;
        }
      });
    }

    // Sort by timestamp (newest first)
    return [...filtered].sort((a, b) => b.timestamp - a.timestamp);
  }, [notifications, activeTab]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // Mark notification as read
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, unread: false } : n
        )
      );

      // Navigate to the appropriate page
      if (notification.type === 'follower') {
        onUserClick?.(notification.userName);
      } else if (notification.postId && notification.postName) {
        onPostClick?.(notification.postId, notification.postName);
      }
    },
    [onUserClick, onPostClick, setNotifications]
  );

  const getNotificationIcon = (type: 'follower' | 'mention' | 'reply') => {
    switch (type) {
      case 'follower':
        return <PersonAddIcon />;
      case 'mention':
        return <AlternateEmailIcon />;
      case 'reply':
        return <ReplyIcon />;
    }
  };

  const formatNotificationMessage = (notification: Notification) => {
    const { type, userName, message } = notification;
    return (
      <>
        <strong>@{userName}</strong> {message}
      </>
    );
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderTop>
          <BackButton onClick={onBack} size="small">
            <ArrowBackIcon />
          </BackButton>
          <Typography variant="h6" fontWeight={700}>
            Notifications
          </Typography>
        </HeaderTop>
        <StyledToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={handleTabChange}
          fullWidth
        >
          <ToggleButton value="all">ALL</ToggleButton>
          <ToggleButton value="followers">
            <PersonAddIcon fontSize="small" />
            New Followers
          </ToggleButton>
          <ToggleButton value="mentions">
            <AlternateEmailIcon fontSize="small" />
            Mentions
          </ToggleButton>
          <ToggleButton value="replies">
            <ReplyIcon fontSize="small" />
            Replies
          </ToggleButton>
        </StyledToggleButtonGroup>
      </PageHeader>

      <SettingsSection>
        <SettingItem>
          <SettingInfo>
            <SettingTitle>
              <NotificationsActiveIcon fontSize="small" />
              Notification Alerts
            </SettingTitle>
            <SettingDescription>
              Show a popup alert when you receive new notifications
            </SettingDescription>
          </SettingInfo>
          <FormControlLabel
            control={
              <Switch
                checked={snackbarEnabled}
                onChange={(e) => setSnackbarEnabled(e.target.checked)}
                color="primary"
              />
            }
            label=""
            sx={{ m: 0 }}
          />
        </SettingItem>
        <SettingItem>
          <SettingInfo>
            <SettingTitle>
              <VolumeUpIcon fontSize="small" />
              Notification Sound
            </SettingTitle>
            <SettingDescription>
              Play a sound when new notifications arrive{' '}
              <span
                style={{
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  color: 'inherit',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  testNotificationSound();
                }}
              >
                (test sound)
              </span>
            </SettingDescription>
          </SettingInfo>
          <FormControlLabel
            control={
              <Switch
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                color="primary"
              />
            }
            label=""
            sx={{ m: 0 }}
          />
        </SettingItem>
      </SettingsSection>

      {(activeTab === 'mentions' || activeTab === 'replies') && (
        <InfoBanner>
          <InfoOutlinedIcon
            sx={{
              color: 'primary.main',
              fontSize: '20px',
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: '13px',
              lineHeight: 1.5,
              color: 'text.secondary',
            }}
          >
            Only notifications from users you are following will appear here.
          </Typography>
        </InfoBanner>
      )}

      {isLoading && filteredNotifications.length === 0 ? (
        <EmptyState>
          <EmptyIcon>⏳</EmptyIcon>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Loading notifications...
          </Typography>
        </EmptyState>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🔔</EmptyIcon>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            No notifications yet
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            {activeTab === 'all'
              ? "When someone follows you, mentions you, or replies to your posts, you'll see it here."
              : activeTab === 'followers'
                ? "When someone follows you, you'll see it here."
                : activeTab === 'mentions'
                  ? "When someone you follow mentions you in a post, you'll see it here."
                  : "When someone you follow replies to your posts, you'll see it here."}
          </Typography>
        </EmptyState>
      ) : (
        <NotificationsList>
          {filteredNotifications.map((notification, index) => (
            <div key={notification.id}>
              <NotificationItem
                unread={notification.unread}
                onClick={() => handleNotificationClick(notification)}
              >
                <NotificationIcon type={notification.type}>
                  {getNotificationIcon(notification.type)}
                </NotificationIcon>
                <NotificationContent>
                  <NotificationText>
                    {formatNotificationMessage(notification)}
                  </NotificationText>
                  <NotificationTime>
                    {formatTimestamp(notification.timestamp)}
                  </NotificationTime>
                </NotificationContent>
              </NotificationItem>
              {index < filteredNotifications.length - 1 && <Divider />}
            </div>
          ))}
        </NotificationsList>
      )}
    </PageContainer>
  );
}

