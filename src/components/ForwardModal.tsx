import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { useState, useEffect, MouseEvent } from 'react';

type ForwardTarget = 'user' | 'group';

interface ForwardModalProps {
  open: boolean;
  postId?: string;
  postName?: string;
  onClose: () => void;
  onSelectPath?: (target: ForwardTarget) => void;
}

export function ForwardModal({
  open,
  postId,
  postName,
  onClose,
  onSelectPath,
}: ForwardModalProps) {
  const [target, setTarget] = useState<ForwardTarget>('user');

  useEffect(() => {
    if (!open) {
      setTarget('user');
    }
  }, [open]);

  const handleChange = (_: MouseEvent<HTMLElement>, value: ForwardTarget) => {
    if (value) {
      setTarget(value);
      onSelectPath?.(value);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="forward-modal-title"
    >
      <DialogTitle
        id="forward-modal-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pb: 1,
        }}
      >
        Forward to chat
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pt: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Choose whether to share this post with a user or a group. Recipient
          selection and sending will be added next.
        </Typography>

        <ToggleButtonGroup
          value={target}
          exclusive
          onChange={handleChange}
          fullWidth
          color="primary"
          size="small"
        >
          <ToggleButton value="user" aria-label="Share to user">
            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
            User
          </ToggleButton>
          <ToggleButton value="group" aria-label="Share to group">
            <GroupIcon fontSize="small" sx={{ mr: 1 }} />
            Group
          </ToggleButton>
        </ToggleButtonGroup>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Post to share:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {postName || 'Unknown name'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {postId || 'Unknown'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Forwarding flow coming next.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<SendIcon fontSize="small" />}
          disabled
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
