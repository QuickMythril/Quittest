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
import {
  likePost as likePostMock,
  unlikePost as unlikePostMock,
  publishRepost as publishRepostMock,
} from 'src/utils/postQdn';
import { copyToClipboard } from 'src/utils/clipboard';

let feedActions: ((props: {
  onLike?: (id: string, isLiked: boolean) => void;
  onShare?: (id: string, name: string) => void;
  onRetweet?: (id: string, post: any) => void;
}) => void)[] = [];

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
  Feed: (props: {
    onLike?: (id: string, isLiked: boolean) => void;
    onShare?: (id: string, name: string) => void;
    onRetweet?: (id: string, post: any) => void;
  }) => {
    useEffect(() => {
      feedActions.forEach((fn) => fn(props));
    }, [props.onLike, props.onShare, props.onRetweet]);
    return null;
  },
}));

vi.mock('src/utils/postQdn', () => {
  const likePost = vi.fn(async () => {});
  const unlikePost = vi.fn(async () => {});
  const publishRepost = vi.fn(async () => {});
  return {
    likePost,
    unlikePost,
    publishRepost,
    publishPost: vi.fn(),
    publishReply: vi.fn(),
    deletePost: vi.fn(),
    updatePost: vi.fn(),
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
  };
});

vi.mock('src/utils/clipboard', () => ({
  copyToClipboard: vi.fn(async () => {}),
}));

describe('SocialApp handlers', () => {
  beforeEach(() => {
    feedActions = [];
    likePostMock.mockReset();
    unlikePostMock.mockReset();
    publishRepostMock.mockReset();
    (copyToClipboard as unknown as any).mockReset?.();
    showError.mockClear();
    showSuccess.mockClear();
    showLoading.mockClear();
    dismissToast.mockClear();
  });

  const renderWithAuth = () => {
    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <GlobalProvider
          value={{
            auth: { address: 'ADDR', name: 'alice' },
          }}
        >
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<SocialApp />} />
            </Routes>
          </MemoryRouter>
        </GlobalProvider>
      </ThemeProvider>
    );
  };

  it('handles like and unlike flows', async () => {
    feedActions = [
      (props) => props.onLike?.('post1', false),
      (props) => props.onLike?.('post1', true),
    ];

    renderWithAuth();

    await waitFor(() => {
      expect(likePostMock).toHaveBeenCalled();
      expect(unlikePostMock).toHaveBeenCalled();
    });
  });

  it('builds share link correctly', async () => {
    feedActions = [(props) => props.onShare?.('id1', 'alice')];

    renderWithAuth();

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(
        'qortal://APP/Quittest/post/alice/id1'
      );
    });
  });

  it('prevents reposting own content', async () => {
    feedActions = [
      (props) =>
        props.onRetweet?.('id1', {
          qortalMetadata: { name: 'alice', identifier: 'id1' },
          data: {},
        }),
    ];

    renderWithAuth();

    await waitFor(() => {
      expect(showError).toHaveBeenCalled();
      expect(publishRepostMock).not.toHaveBeenCalled();
    });
  });
});
