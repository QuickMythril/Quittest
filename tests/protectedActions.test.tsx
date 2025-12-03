import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  GlobalProvider,
  showError,
  showSuccess,
  showLoading,
  dismissToast,
} from 'qapp-core';
import SocialApp from 'src/App';
import { publishPost as publishPostMock } from 'src/utils/postQdn';

vi.mock('src/components/Sidebar', () => ({
  Sidebar: () => null,
  RightSidebar: () => null,
}));
vi.mock('src/components/ConfirmDialog', () => ({
  ConfirmDialog: () => null,
}));
vi.mock('src/components/NewPostModal', () => ({
  NewPostModal: () => null,
}));
vi.mock('src/components/PostPage', () => ({
  PostPage: () => null,
}));
vi.mock('src/components/UserFeed', () => ({
  UserFeed: () => null,
}));
vi.mock('src/components/SearchPage', () => ({
  SearchPage: () => null,
}));
vi.mock('src/components/Feed', () => ({
  Feed: ({ onNewPost }: { onNewPost?: any }) => {
    useEffect(() => {
      (async () => {
        try {
          await onNewPost?.({ text: 'hello', media: [] });
        } catch (_err) {
          // Swallow errors from handler to keep test output clean
        }
      })();
    }, [onNewPost]);
    return null;
  },
}));

vi.mock('src/utils/postQdn', () => {
  const publishPost = vi.fn(async () => 'new-id');
  return {
    publishPost,
    publishReply: vi.fn(),
    publishRepost: vi.fn(),
    deletePost: vi.fn(),
    updatePost: vi.fn(),
    likePost: vi.fn(),
    unlikePost: vi.fn(),
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
  };
});

describe('SocialApp protected actions', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    showError.mockClear();
    showSuccess.mockClear();
    showLoading.mockClear();
    dismissToast.mockClear();
    publishPostMock.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const renderWithAuth = (auth: any) => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <GlobalProvider value={{ auth }}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<SocialApp />} />
            </Routes>
          </MemoryRouter>
        </GlobalProvider>
      </ThemeProvider>
    );
  };

  it('prompts auth and aborts post when auth returns no name', async () => {
    const authenticateUser = vi.fn(async () => ({ address: 'ADDR' }));

    renderWithAuth({
      authenticateUser,
    });

    await waitFor(() => {
      expect(authenticateUser).toHaveBeenCalled();
    });

    expect(publishPostMock).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalled();
  });

  it('publishes post when auth has name/address', async () => {
    const authenticateUser = vi.fn();

    renderWithAuth({
      address: 'ADDR',
      name: 'alice',
      authenticateUser,
    });

    await waitFor(() => {
      expect(publishPostMock).toHaveBeenCalled();
    });

    expect(authenticateUser).not.toHaveBeenCalled();
  });
});
