import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import { styled } from '@mui/system';
import { useFetchProfile } from '../hooks/useFetchProfile';

const ProfileContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '600px',
  margin: '0 auto',
}));

const ProfileSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

interface UserProfileProps {
  qortalName: string;
}

/**
 * Example component showing how to fetch and display a user's profile from QDN
 */
export function UserProfile({ qortalName }: UserProfileProps) {
  const { profile, isLoading, error, refetch } = useFetchProfile(qortalName);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <ProfileContainer elevation={2}>
        <Typography color="error" gutterBottom>
          Error: {error}
        </Typography>
        <Button variant="contained" onClick={refetch} sx={{ mt: 2 }}>
          Retry
        </Button>
      </ProfileContainer>
    );
  }

  if (!profile) {
    return (
      <ProfileContainer elevation={2}>
        <Typography color="text.secondary">
          No profile found for @{qortalName}
        </Typography>
        <Button variant="contained" onClick={refetch} sx={{ mt: 2 }}>
          Refresh
        </Button>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer elevation={2}>
      <ProfileSection>
        <Typography variant="h5" gutterBottom>
          @{profile.qortalName || qortalName}
        </Typography>
      </ProfileSection>

      <ProfileSection>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Bio
        </Typography>
        <Typography variant="body1">{profile.bio}</Typography>
      </ProfileSection>

      <Button variant="outlined" onClick={refetch} fullWidth>
        Refresh Profile
      </Button>
    </ProfileContainer>
  );
}

