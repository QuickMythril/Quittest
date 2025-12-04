import { useEffect, useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import { styled } from '@mui/system';
import { Snackbar, Alert, AlertTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReplyIcon from '@mui/icons-material/Reply';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import {
  notificationsAtom,
  shownNotificationIdsAtom,
  notificationSnackbarEnabledAtom,
  notificationSoundEnabledAtom,
  hasUnreadNotificationsAtom,
  Notification,
} from '../state/global/notifications';
import { playNotificationSound } from '../utils/notificationSound';
import { setLastViewedNotificationsTimestamp } from '../utils/notificationTimestamp';
import { useGlobal } from 'qapp-core';

const StyledAlert = styled(Alert)(({ theme }) => ({
  minWidth: '300px',
  maxWidth: '400px',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(0, 0, 0, 0.6)'
      : '0 8px 24px rgba(0, 0, 0, 0.15)',
  borderRadius: theme.spacing(1.5),
  '& .MuiAlert-message': {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  '& .MuiAlert-icon': {
    fontSize: '28px',
  },
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 32px rgba(0, 0, 0, 0.7)'
        : '0 12px 32px rgba(0, 0, 0, 0.2)',
  },
}));

const NotificationMessage = styled('div')(({ theme }) => ({
  fontSize: '13px',
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

interface NotificationSnackbarProps {
  onNotificationClick?: () => void;
}

export function NotificationSnackbar({
  onNotificationClick,
}: NotificationSnackbarProps) {
  const { auth } = useGlobal();
  const [notifications] = useAtom(notificationsAtom);
  const [shownNotificationIds, setShownNotificationIds] = useAtom(
    shownNotificationIdsAtom
  );
  const [snackbarEnabled] = useAtom(notificationSnackbarEnabledAtom);
  const [soundEnabled] = useAtom(notificationSoundEnabledAtom);
  const [, setHasUnread] = useAtom(hasUnreadNotificationsAtom);

  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);
  const [open, setOpen] = useState(false);

  // Find a random unshown notification
  const findRandomNotification = useCallback(() => {
    if (!snackbarEnabled) return null;

    // Find all unshown, unread notifications
    const unshownNotifications = notifications.filter(
      (notification) =>
        !shownNotificationIds.includes(notification.id) && notification.unread
    );

    // If there are no unshown notifications, return null
    if (unshownNotifications.length === 0) return null;

    // Randomly pick one notification
    const randomIndex = Math.floor(Math.random() * unshownNotifications.length);
    return unshownNotifications[randomIndex];
  }, [notifications, shownNotificationIds, snackbarEnabled]);

  // Check for new notifications and show one randomly
  useEffect(() => {
    // Only check if no notification is currently being shown
    if (!open && snackbarEnabled) {
      const randomNotification = findRandomNotification();
      if (randomNotification) {
        setCurrentNotification(randomNotification);
        setOpen(true);

        // Play notification sound if enabled
        if (soundEnabled) {
          playNotificationSound();
        }

        // Mark ALL current unshown notifications as shown to prevent showing more
        const unshownIds = notifications
          .filter((n) => !shownNotificationIds.includes(n.id) && n.unread)
          .map((n) => n.id);
        setShownNotificationIds((prev) => [...prev, ...unshownIds]);
      }
    }
  }, [
    notifications,
    open,
    findRandomNotification,
    setShownNotificationIds,
    snackbarEnabled,
    shownNotificationIds,
    soundEnabled,
  ]);

  const handleClose = useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      // Don't close on clickaway, only on timeout or manual close
      if (reason === 'clickaway') {
        return;
      }
      setOpen(false);
    },
    []
  );

  const handleNotificationClick = useCallback(() => {
    // Clear notification indicator by updating last viewed timestamp
    if (auth?.name) {
      setLastViewedNotificationsTimestamp(auth.name);
    }

    // Immediately clear the unread badge indicator
    setHasUnread(false);

    if (onNotificationClick) {
      onNotificationClick();
      handleClose();
    }
  }, [onNotificationClick, handleClose, auth?.name, setHasUnread]);

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

  const getNotificationSeverity = (
    type: 'follower' | 'mention' | 'reply'
  ): 'info' | 'success' | 'warning' => {
    switch (type) {
      case 'follower':
        return 'info';
      case 'mention':
        return 'warning';
      case 'reply':
        return 'success';
    }
  };

  const getNotificationTypeLabel = (
    type: 'follower' | 'mention' | 'reply'
  ): string => {
    switch (type) {
      case 'follower':
        return 'New follower';
      case 'mention':
        return 'New mention';
      case 'reply':
        return 'New reply';
    }
  };

  if (!currentNotification || !snackbarEnabled) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{ bottom: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 } }}
    >
      <StyledAlert
        severity={getNotificationSeverity(currentNotification.type)}
        icon={getNotificationIcon(currentNotification.type)}
        onClick={handleNotificationClick}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle sx={{ mb: 0.5, fontSize: '14px', fontWeight: 600 }}>
          {getNotificationTypeLabel(currentNotification.type)}
        </AlertTitle>
        <NotificationMessage>
          Click to view your notifications
        </NotificationMessage>
      </StyledAlert>
    </Snackbar>
  );
}

