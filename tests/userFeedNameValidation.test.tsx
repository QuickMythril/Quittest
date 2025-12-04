import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Typography: (props: any) => <div {...props} />,
    Avatar: (props: any) => <div {...props} />,
    Button: (props: any) => <button {...props} />,
    IconButton: (props: any) => <button {...props} />,
    CircularProgress: () => <div data-testid="spinner" />,
  };
});
vi.mock('@mui/system', () => ({
  styled: () => (component: any) => component,
}));

import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GlobalProvider } from 'qapp-core';
import { UserFeed } from 'src/components/UserFeed';

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

vi.mock('src/hooks/useFollowerCount', () => ({
  useFollowerCount: () => 0,
}));

vi.mock('src/hooks/useFollowingList', () => ({
  useFollowingList: () => ({ followingCount: 0 }),
}));

vi.mock('src/hooks/useFetchProfile', () => ({
  useFetchProfile: () => ({ profile: null, isLoading: false, error: null }),
}));

vi.mock('src/components/PostWrapper', () => ({
  PostWrapper: () => <div>PostWrapper</div>,
}));

vi.mock('qapp-core', async () => {
  const module = await import('../__mocks__/qapp-core.tsx');
  return {
    ...module,
    ResourceListDisplay: () => <div data-testid="resource-list" />,
  };
});

describe('UserFeed name validation', () => {
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

  const renderUserFeed = (userName = 'alice') => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <GlobalProvider value={{ auth: { name: 'bob', address: 'ADDR' } }}>
          <MemoryRouter initialEntries={[`/user/${userName}`]}>
            <Routes>
              <Route path="/user/:userName" element={<UserFeed userName={userName} />} />
            </Routes>
          </MemoryRouter>
        </GlobalProvider>
      </ThemeProvider>
    );
  };

  it('shows loading state while checking name', () => {
    nameExistsMockReturn.isChecking = true;
    renderUserFeed();
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows name not found state when name does not exist', () => {
    nameExistsMockReturn = {
      nameExists: false,
      isChecking: false,
      error: 'boom',
      nameData: null,
    };
    renderUserFeed('charlie');
    expect(screen.getByText(/Name Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/@charlie/i)).toBeInTheDocument();
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it('disables follow button and shows loading text when follow state is loading', () => {
    isFollowingMockReturn = {
      isFollowing: false,
      isLoading: true,
    };
    renderUserFeed('dave');
    const btn = screen.getByRole('button', { name: /Loading.../i });
    expect(btn).toBeDisabled();
  });
});

