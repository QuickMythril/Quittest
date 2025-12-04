import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import CloseIcon from '@mui/icons-material/Close';
import { NewPostInput, PostContent, MediaAttachment } from './NewPostInput';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    maxWidth: '600px',
    width: '100%',
    borderRadius: theme.spacing(3),
    margin: theme.spacing(2),
    overflow: 'visible',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 24px 48px rgba(0, 0, 0, 0.5)'
        : '0 24px 48px rgba(0, 0, 0, 0.15)',
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
  },
  '& .MuiBackdrop-root': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(0, 0, 0, 0.7)'
        : 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2.5, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  fontWeight: 700,
  fontSize: '20px',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(29, 155, 240, 0.1), rgba(120, 86, 255, 0.1))'
      : 'linear-gradient(135deg, rgba(29, 155, 240, 0.05), rgba(120, 86, 255, 0.05))',
  '& button': {
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'rotate(90deg) scale(1.1)',
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(239, 68, 68, 0.2)'
          : 'rgba(239, 68, 68, 0.1)',
    },
  },
}));

const StyledDialogContent = styled(DialogContent)({
  padding: 0,
  overflow: 'visible',
});

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
  onPost: (content: PostContent) => void | Promise<void>;
  userAvatar?: string;
  userName?: string;
  isPublishing?: boolean;
  initialText?: string;
  initialMedia?: MediaAttachment[];
  isEditing?: boolean;
  isReplying?: boolean;
  replyToUsername?: string;
}

export function NewPostModal({
  open,
  onClose,
  onPost,
  userAvatar,
  userName,
  isPublishing = false,
  initialText = '',
  initialMedia = [],
  isEditing = false,
  isReplying = false,
  replyToUsername,
}: NewPostModalProps) {
  const handlePost = async (content: PostContent) => {
    await onPost(content);
    // Don't close immediately - let the parent handle closing on success
  };

  const getModalTitle = () => {
    if (isEditing) return 'Edit Post';
    if (isReplying && replyToUsername) return `Reply to @${replyToUsername}`;
    return 'Create Post';
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        {getModalTitle()}
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <NewPostInput
          onPost={handlePost}
          userAvatar={userAvatar}
          userName={userName}
          isPublishing={isPublishing}
          initialText={initialText}
          initialMedia={initialMedia}
          isEditing={isEditing}
          placeholder={isReplying ? 'Post your reply...' : undefined}
        />
      </StyledDialogContent>
    </StyledDialog>
  );
}
