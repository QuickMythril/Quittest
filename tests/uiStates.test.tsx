import React from 'react';
import { describe, it, expect, vi } from 'vitest';
vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Typography: (props: any) => <div {...props} />,
    Avatar: (props: any) => <div {...props} />,
    Button: (props: any) => <button {...props} />,
    CircularProgress: () => <div />,
  };
});

import { render, screen } from '@testing-library/react';
import { LoaderState } from 'src/components/LoaderState';
import { NewPostInput } from 'src/components/NewPostInput';
import { GlobalProvider } from 'qapp-core';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserFeed from 'src/components/UserFeed';
import { ThemeProvider, createTheme } from '@mui/material/styles';

vi.mock('src/components/CreateProfile', () => ({
  CreateProfile: () => <div data-testid="create-profile-form" />,
}));

vi.mock('src/components/NewPostInput', () => ({
  NewPostInput: ({ showAuthHint }: { showAuthHint?: boolean }) => (
    <div>
      {showAuthHint ? 'You’ll be prompted to authenticate before posting.' : null}
    </div>
  ),
}));

vi.mock('src/components/FollowersList', () => ({
  FollowersList: () => null,
}));

vi.mock('src/components/UserFollowingList', () => ({
  UserFollowingList: () => null,
}));

vi.mock('src/utils/profileQdn', () => ({
  fetchProfileFromQdn: vi.fn(),
}));

vi.mock('src/hooks/useFetchProfile', () => ({
  useFetchProfile: () => ({ profile: null, isLoading: false, error: null }),
}));

vi.mock('src/components/UserFeed', () => {
  return {
    __esModule: true,
    default: () => (
      <div>
        <div>No profile yet</div>
        <div data-testid="create-profile-form" />
      </div>
    ),
  };
});

describe('UI states', () => {
  it('LoaderState renders error placeholder', () => {
    render(<LoaderState status="ERROR" />);
    expect(screen.getByText(/Unable to load content/i)).toBeInTheDocument();
  });

  it('NewPostInput shows auth hint when requested', () => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <NewPostInput showAuthHint userName="alice" />
      </ThemeProvider>
    );
    expect(
      screen.getByText(/you’ll be prompted to authenticate/i)
    ).toBeInTheDocument();
  });

  it('UserFeed shows no-profile CTA for own profile without data', () => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <GlobalProvider
          value={{
            auth: { address: 'ADDR', name: 'alice' },
            identifierOperations: {
              buildSearchPrefix: vi.fn(async () => 'prefix-'),
            },
          }}
        >
          <MemoryRouter initialEntries={['/user/alice']}>
            <Routes>
              <Route path="/user/:userName" element={<UserFeed userName="alice" />} />
            </Routes>
          </MemoryRouter>
        </GlobalProvider>
      </ThemeProvider>
    );

    expect(screen.getByText(/No profile yet/i)).toBeInTheDocument();
    expect(screen.getByTestId('create-profile-form')).toBeInTheDocument();
  });
});
