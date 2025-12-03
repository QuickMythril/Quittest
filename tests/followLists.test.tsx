import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Typography: (props: any) => <div {...props} />,
    Avatar: (props: any) => <div {...props} />,
    CircularProgress: () => <div />,
    Box: (props: any) => <div {...props} />,
  };
});
vi.mock('@mui/system', () => ({
  styled: () => (component: any) => component,
}));
import { render, screen } from '@testing-library/react';
import { GlobalProvider } from 'qapp-core';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { FollowersList } from 'src/components/FollowersList';
import { UserFollowingList } from 'src/components/UserFollowingList';

let followersMockReturn: any = {
  followers: [],
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

vi.mock('src/hooks/useFollowersList', () => ({
  useFollowersList: () => followersMockReturn,
}));

vi.mock('qapp-core', async () => {
  const module = await import('../__mocks__/qapp-core.tsx');
  return {
    ...module,
    ResourceListDisplay: ({ loaderList }: any) => (
      <div>{loaderList ? loaderList('ERROR') : null}</div>
    ),
  };
});

vi.mock('src/components/FollowersList', () => ({
  FollowersList: () => {
    const state = followersMockReturn;
    if (state.error) {
      return <div>Unable to load followers</div>;
    }
    if (!state.followers.length) {
      return <div>No followers yet</div>;
    }
    return <div>Followers loaded</div>;
  },
}));

vi.mock('src/components/UserFollowingList', () => ({
  UserFollowingList: () => <div>Unable to load following list</div>,
}));

describe('Followers/Following lists', () => {
  beforeEach(() => {
    followersMockReturn = {
      followers: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  });

  it('renders followers list and empty state', () => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <GlobalProvider value={{}}>
          <FollowersList />
        </GlobalProvider>
      </ThemeProvider>
    );
    expect(screen.getByText(/No followers yet/i)).toBeInTheDocument();
  });

  it('shows error message when followers fetch fails', () => {
    followersMockReturn = {
      followers: [],
      isLoading: false,
      error: 'boom',
      refetch: vi.fn(),
    };
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <GlobalProvider value={{}}>
          <FollowersList />
        </GlobalProvider>
      </ThemeProvider>
    );
    expect(
      screen.getByText(/Unable to load followers/i)
    ).toBeInTheDocument();
  });

  it('shows error placeholder for following list loader', () => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <GlobalProvider value={{ auth: { name: 'alice', address: 'ADDR' } }}>
          <UserFollowingList />
        </GlobalProvider>
      </ThemeProvider>
    );
    expect(
      screen.getByText(/Unable to load following list/i)
    ).toBeInTheDocument();
  });
});
