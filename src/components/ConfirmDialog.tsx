import { styled } from '@mui/system';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(30, 39, 50, 0.95)'
        : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 32px rgba(0, 0, 0, 0.1)',
    minWidth: '400px',
    [theme.breakpoints.down('sm')]: {
      minWidth: '90vw',
      margin: '16px',
    },
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  paddingBottom: theme.spacing(1),
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(3),
}));

const StyledDialogContentText = styled(DialogContentText)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.95rem',
  lineHeight: 1.5,
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3, 3),
  gap: theme.spacing(1.5),
}));

const CancelButton = styled(Button)(({ theme }) => ({
  borderRadius: '24px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  padding: theme.spacing(1.25, 3),
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
    border: `1px solid ${theme.palette.divider}`,
  },
}));

const ConfirmButton = styled(Button)(({ theme }) => ({
  borderRadius: '24px',
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '0.95rem',
  padding: theme.spacing(1.25, 3),
  backgroundColor: theme.palette.error.main,
  color: '#fff',
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  },
}));

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <StyledDialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <StyledDialogTitle id="confirm-dialog-title">{title}</StyledDialogTitle>
      <StyledDialogContent>
        <StyledDialogContentText id="confirm-dialog-description">
          {message}
        </StyledDialogContentText>
      </StyledDialogContent>
      <StyledDialogActions>
        <CancelButton onClick={onCancel} variant="outlined">
          {cancelText}
        </CancelButton>
        <ConfirmButton onClick={onConfirm} variant="contained" autoFocus>
          {confirmText}
        </ConfirmButton>
      </StyledDialogActions>
    </StyledDialog>
  );
}

