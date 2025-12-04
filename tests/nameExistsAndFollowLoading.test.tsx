import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

let nameExistsMockReturn: any = {
  nameExists: true,
  isChecking: false,
  error: null,
  nameData: null,
};

let isFollowingMockReturn: any = {
  isFollowing: false,
  isLoading: false,
};

vi.mock('src/hooks/useNameExists', () => ({
  useNameExists: () => nameExistsMockReturn,
}));

vi.mock('src/hooks/useIsFollowing', () => ({
  useIsFollowing: () => isFollowingMockReturn,
}));

// Minimal component that exercises the hooks and renders simple markers
const TestProfile = ({ userName }: { userName: string }) => {
  const { nameExists, isChecking, error } = require('src/hooks/useNameExists').useNameExists(
    userName
  );
  const { isFollowing, isLoading } = require('src/hooks/useIsFollowing').useIsFollowing(
    userName
  );

  if (isChecking) {
    return <div>Loading name...</div>;
  }

  if (!nameExists) {
    return (
      <div>
        <div>Name Not Found</div>
        <div data-testid="error">{error}</div>
      </div>
    );
  }

  return (
    <button disabled={isLoading}>
      {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};

describe('Name existence and follow loading states', () => {
  beforeEach(() => {
    nameExistsMockReturn = {
      nameExists: true,
      isChecking: false,
      error: null,
      nameData: null,
    };
    isFollowingMockReturn = {
      isFollowing: false,
      isLoading: false,
    };
  });

  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme();
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  it('shows loading indicator while checking name', () => {
    nameExistsMockReturn.isChecking = true;
    renderWithTheme(<TestProfile userName="alice" />);
    expect(screen.getByText(/Loading name/i)).toBeInTheDocument();
  });

  it('shows name not found message and error', () => {
    nameExistsMockReturn = {
      nameExists: false,
      isChecking: false,
      error: 'boom',
      nameData: null,
    };
    renderWithTheme(<TestProfile userName="charlie" />);
    expect(screen.getByText(/Name Not Found/i)).toBeInTheDocument();
    expect(screen.getByTestId('error').textContent).toContain('boom');
  });

  it('disables follow button and shows loading text when follow state is loading', () => {
    isFollowingMockReturn = {
      isFollowing: false,
      isLoading: true,
    };
    renderWithTheme(<TestProfile userName="dave" />);
    const btn = screen.getByRole('button', { name: /Loading.../i });
    expect(btn).toBeDisabled();
  });
});

