import { useState, useEffect } from 'react';
import { styled } from '@mui/system';
import {
  Typography,
  Menu,
  MenuItem,
  CircularProgress,
  Avatar,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { useGlobal, showError, showSuccess, useAuth } from 'qapp-core';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { preferredNamesMapAtom } from '../state/global/profile';

const NameSwitcherContainer = styled('div')(({ theme }) => ({
  marginTop: 'auto',
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const NameSwitcherButton = styled('button')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderRadius: '28px',
  border: 'none',
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.05)',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.08)',
    transform: 'translateY(-2px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
        : '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  [theme.breakpoints.down('lg')]: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    padding: theme.spacing(1.5),
    justifyContent: 'center',
  },
}));

const NameInfo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1,
});

const NameAvatar = styled('div')(({ theme }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '18px',
  fontWeight: 700,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.15)',
}));

const NameDetails = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  [theme.breakpoints.down('lg')]: {
    display: 'none',
  },
}));

const ArrowIcon = styled(KeyboardArrowDownIcon)(({ theme }) => ({
  transition: 'transform 0.2s ease',
  [theme.breakpoints.down('lg')]: {
    display: 'none',
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
  minWidth: '200px',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.15)'
        : 'rgba(29, 155, 240, 0.1)',
  },
}));

export function NameSwitcher() {
  const { auth } = useGlobal();
  const { switchName } = useAuth();
  const navigate = useNavigate();
  const [preferredNamesMap, setPreferredNamesMap] = useAtom(
    preferredNamesMapAtom
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const menuOpen = Boolean(anchorEl);

  // Fetch names when component mounts or address changes
  useEffect(() => {
    const fetchNames = async () => {
      if (!auth?.address) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/names/address/${auth.address}`);
        if (!response.ok) {
          throw new Error('Failed to fetch names');
        }
        const data = await response.json();
        const fetchedNames = data?.map((item: any) => item?.name);
        setNames(fetchedNames);
      } catch (error) {
        console.error('Error fetching names:', error);
        showError('Failed to load names');
        setNames([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNames();
  }, [auth?.address]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNameSwitch = async (name: string) => {
    if (!switchName || name === auth?.name) {
      handleMenuClose();
      return;
    }

    setIsSwitching(true);
    try {
      await switchName(name);

      // Save the preferred name for this address
      if (auth?.address) {
        setPreferredNamesMap({
          ...preferredNamesMap,
          [auth.address]: name,
        });
      }

      showSuccess(`Switched to ${name}`);
      handleMenuClose();

      // The profile check will happen automatically via useInitializeProfile
      // when auth.name changes. If the name has no profile, Layout will
      // show CreateProfile. If they have a profile, navigate to it.
      // Small delay to let the profile check start
      setTimeout(() => {
        navigate(`/user/${name}`);
      }, 100);
    } catch (error) {
      console.error('Error switching name:', error);
      showError('Failed to switch name');
    } finally {
      setIsSwitching(false);
    }
  };

  if (!auth?.name || !auth?.address) {
    const handleAuthenticate = async () => {
      if (isAuthenticating) return;
      setIsAuthenticating(true);
      try {
        await auth?.authenticateUser?.();
      } catch (error) {
        console.error('Authentication failed:', error);
        showError('Authentication was cancelled or failed.');
      } finally {
        setIsAuthenticating(false);
      }
    };

    return (
      <NameSwitcherContainer>
        <NameSwitcherButton
          onClick={handleAuthenticate}
          disabled={isAuthenticating}
          aria-label="Authenticate"
        >
          <NameInfo>
            <NameAvatar>
              <PersonIcon sx={{ fontSize: '20px' }} />
            </NameAvatar>
            <NameDetails>
              <Typography
                variant="body1"
                fontWeight={700}
                sx={{
                  fontSize: '15px',
                  color: 'text.primary',
                  textAlign: 'left',
                }}
              >
                Authenticate
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '13px',
                  color: 'text.secondary',
                }}
              >
                Connect to select a name
              </Typography>
            </NameDetails>
          </NameInfo>
          {isAuthenticating ? (
            <CircularProgress size={20} />
          ) : (
            <ArrowIcon />
          )}
        </NameSwitcherButton>
      </NameSwitcherContainer>
    );
  }

  const currentName = auth.name;

  return (
    <NameSwitcherContainer>
      <NameSwitcherButton onClick={handleMenuClick} disabled={isSwitching}>
        <NameInfo>
          <NameAvatar>
            <Avatar
              src={`/arbitrary/THUMBNAIL/${currentName}/qortal_avatar?async=true`}
              alt={`${currentName} avatar`}
            >
              <PersonIcon sx={{ fontSize: '20px' }} />
            </Avatar>
          </NameAvatar>
          <NameDetails>
            <Typography
              variant="body1"
              fontWeight={700}
              sx={{
                fontSize: '15px',
                color: 'text.primary',
                textAlign: 'left',
              }}
            >
              @{currentName}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '13px',
                color: 'text.secondary',
              }}
            >
              {isLoading
                ? 'Loading...'
                : names.length > 1
                  ? `${names.length} names`
                  : 'Switch name'}
            </Typography>
          </NameDetails>
        </NameInfo>
        {isSwitching ? (
          <CircularProgress size={20} />
        ) : (
          <ArrowIcon
            sx={{
              transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        )}
      </NameSwitcherButton>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                : '0 8px 24px rgba(0, 0, 0, 0.15)',
            mt: -1,
          },
        }}
      >
        {isLoading ? (
          <StyledMenuItem>
            <CircularProgress size={20} />
          </StyledMenuItem>
        ) : names.length === 0 ? (
          <StyledMenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No names found
            </Typography>
          </StyledMenuItem>
        ) : (
          names.map((name) => (
            <StyledMenuItem
              key={name}
              onClick={() => handleNameSwitch(name)}
              disabled={isSwitching}
            >
              <Typography
                variant="body1"
                fontWeight={name === currentName ? 700 : 400}
                sx={{ fontSize: '15px' }}
              >
                @{name}
              </Typography>
              {name === currentName && (
                <CheckIcon sx={{ fontSize: '20px', color: 'primary.main' }} />
              )}
            </StyledMenuItem>
          ))
        )}
      </Menu>
    </NameSwitcherContainer>
  );
}
