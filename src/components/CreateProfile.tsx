import { useState } from 'react';
import { styled } from '@mui/system';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useAtom } from 'jotai';
import {
  useGlobal,
  objectToBase64,
  usePublish,
  type Service,
  showError,
  showSuccess,
  useQortBalance,
} from 'qapp-core';
import {
  hasProfileAtom,
  profileDataAtom,
  profileNameAtom,
} from '../state/global/profile';
import { saveProfileToCache } from '../utils/profileCache';
import { NameSwitcher } from './NameSwitcher';

interface Profile {
  bio: string;
}

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const MainContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
  padding: theme.spacing(2),
}));

const ProfileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: '500px',
  width: '100%',
  borderRadius: theme.spacing(2),
}));

const NameSwitcherWrapper = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '280px',
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('lg')]: {
    width: '88px',
  },
}));

const FormTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 600,
  textAlign: 'center',
}));

const QortalNameDisplay = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.05)',
  borderRadius: theme.spacing(1),
  textAlign: 'center',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const CreateButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '16px',
}));

export function CreateProfile() {
  const { auth, identifierOperations } = useGlobal();
  const { updatePublish, publishMultipleResources } = usePublish();
  const { value: balance } = useQortBalance();
  const [, setHasProfile] = useAtom(hasProfileAtom);
  const [, setProfileData] = useAtom(profileDataAtom);
  const [, setProfileName] = useAtom(profileNameAtom);

  const [bio, setBio] = useState('');
  const [bioError, setBioError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBioChange = (value: string) => {
    // Enforce 200 character limit
    if (value.length <= 200) {
      setBio(value);
    }
    // Clear error when user starts typing
    if (bioError) {
      setBioError('');
    }
  };

  const validateForm = (): boolean => {
    if (!bio.trim()) {
      setBioError('Bio is required');
      return false;
    }

    if (bio.length > 200) {
      setBioError('Bio must be 200 characters or less');
      return false;
    }

    return true;
  };

  const handleCreateProfile = async () => {
    if (!validateForm()) {
      return;
    }

    // Check balance before publishing
    if (!balance || balance < 0.01) {
      showError(
        'Insufficient balance. You need at least 0.01 QORT to publish a profile.'
      );
      return;
    }

    if (!auth.name) {
      showError('Cannot create profile without a Qortal name');
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        bio,
        qortalName: auth.name,
      };

      // Publish profile to blockchain
      await createProfile(bio);

      // Save to cache (5 minute expiry) for page refreshes
      // while blockchain confirmation is pending
      // Uses Qortal name as cache key to support multiple accounts
      await saveProfileToCache(auth.name, profileData);

      // Update global state after profile creation
      setProfileData(profileData);
      setHasProfile(true);
      setProfileName(auth.name);

      showSuccess('Profile created successfully!');
    } catch (error) {
      console.error('Error creating profile:', error);
      showError(
        error instanceof Error
          ? `Failed to create profile: ${error.message}`
          : 'Failed to create profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (bioText: string) => {
    if (!auth.name) {
      console.error('Cannot create profile without a Qortal name');
      return;
    }

    const finalProfileObject: Profile = {
      bio: bioText,
    };

    const id = await identifierOperations.createSingleIdentifier('profile');
    if (!id) return;

    const profileBase64 = await objectToBase64(finalProfileObject);

    const resourcesToPublish: {
      service: Service;
      identifier: string;
      name: string;
      base64: string;
    }[] = [];

    resourcesToPublish.push({
      service: 'METADATA',
      identifier: id,
      name: auth.name, // Explicitly set the name to ensure publishing under the correct name
      base64: profileBase64,
    });

    await publishMultipleResources(resourcesToPublish);

    updatePublish(
      {
        name: auth.name,
        service: 'DOCUMENT',
        identifier: id,
      },
      finalProfileObject
    );
  };

  const handleAuthenticate = async () => {
    try {
      await auth.authenticateUser();
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  // Case 1: User not authenticated (no address)
  if (!auth?.address) {
    return (
      <Container>
        <MainContent>
          <ProfileCard elevation={3}>
            <FormTitle variant="h4">Authentication Required</FormTitle>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, textAlign: 'center' }}
            >
              Please authenticate with your Qortal account to create a profile
            </Typography>

            <CreateButton
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleAuthenticate}
              size="large"
              disabled={auth.isLoadingUser}
              startIcon={
                auth.isLoadingUser ? (
                  <CircularProgress size={20} color="inherit" />
                ) : undefined
              }
            >
              {auth.isLoadingUser ? 'Authenticating...' : 'Authenticate'}
            </CreateButton>
          </ProfileCard>
        </MainContent>
      </Container>
    );
  }

  // Case 2: User authenticated but no name registered
  if (!auth.name) {
    return (
      <Container>
        <MainContent>
          <ProfileCard elevation={3}>
            <FormTitle variant="h4">Name Registration Required</FormTitle>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, textAlign: 'center' }}
            >
              A Qortal name is required to publish on Qortal. Please register a
              name before creating your profile.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center' }}
            >
              You can register a name through the Qortal Core application.
            </Typography>
          </ProfileCard>
        </MainContent>
      </Container>
    );
  }

  // Case 3: User authenticated with name - show profile creation form
  return (
    <Container>
      <MainContent>
        <ProfileCard elevation={3}>
          <FormTitle variant="h4">Create Your Profile</FormTitle>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, textAlign: 'center' }}
          >
            Please create your profile to get started, or switch to a different
            name
          </Typography>

          <QortalNameDisplay>
            <Typography variant="caption" color="text.secondary">
              Your Qortal Name
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5 }}>
              @{auth.name}
            </Typography>
          </QortalNameDisplay>

          <Box>
            <StyledTextField
              fullWidth
              label="Bio"
              variant="outlined"
              multiline
              rows={4}
              value={bio}
              onChange={(e) => handleBioChange(e.target.value)}
              error={!!bioError}
              helperText={
                <span
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <span>{bioError || ''}</span>
                  <Typography
                    component="span"
                    variant="caption"
                    color={bio.length > 200 ? 'error' : 'text.secondary'}
                    sx={{ ml: 'auto' }}
                  >
                    {bio.length}/200
                  </Typography>
                </span>
              }
              placeholder="Tell us about yourself..."
              required
              inputProps={{ maxLength: 200 }}
            />
          </Box>

          <CreateButton
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleCreateProfile}
            size="large"
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : undefined
            }
          >
            {isLoading ? 'Creating Profile...' : 'Create Profile'}
          </CreateButton>
        </ProfileCard>
      </MainContent>

      {/* Allow user to switch names if they have multiple names */}
      <NameSwitcherWrapper>
        <NameSwitcher />
      </NameSwitcherWrapper>
    </Container>
  );
}
