import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { GlobalProvider } from 'qapp-core';
import { useFollowsList } from 'src/hooks/useFollowsList';
import { useFollowersList } from 'src/hooks/useFollowersList';

const FollowsTester = () => {
  const { followedUsers, isLoading, error } = useFollowsList();
  return (
    <div>
      <div data-testid="count">{followedUsers.length}</div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="error">{error || ''}</div>
    </div>
  );
};

const FollowersTester = ({ userName }: { userName: string }) => {
  const { followers, isLoading, error } = useFollowersList(userName);
  return (
    <div>
      <div data-testid="followers-count">{followers.length}</div>
      <div data-testid="followers-loading">{String(isLoading)}</div>
      <div data-testid="followers-error">{error || ''}</div>
    </div>
  );
};

describe('follow hooks', () => {
  it('useFollowsList parses resources', async () => {
    const lists = {
      fetchResourcesResultsOnly: vi.fn(async () => [
        { name: 'bob', identifier: 'id1', updated: 1 },
        { name: 'carol', identifier: 'id2', created: 2 },
      ]),
    };
    const identifierOperations = {
      hashString: vi.fn(async () => 'hash'),
    };

    render(
      <JotaiProvider>
        <GlobalProvider value={{ auth: { name: 'alice', address: 'ADDR' }, lists, identifierOperations }}>
          <FollowsTester />
        </GlobalProvider>
      </JotaiProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('count').textContent).toBe('2');
    });
  });

  it('useFollowsList sets error on failure', async () => {
    const lists = {
      fetchResourcesResultsOnly: vi.fn(async () => {
        throw new Error('boom');
      }),
    };
    const identifierOperations = {
      hashString: vi.fn(async () => 'hash'),
    };

    render(
      <JotaiProvider>
        <GlobalProvider value={{ auth: { name: 'alice', address: 'ADDR' }, lists, identifierOperations }}>
          <FollowsTester />
        </GlobalProvider>
      </JotaiProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).toContain('boom');
    });
  });

  it('useFollowersList parses followers', async () => {
    const lists = {
      fetchResourcesResultsOnly: vi.fn(async () => [
        { name: 'bob', identifier: 'id1', updated: 1 },
      ]),
    };
    const identifierOperations = {
      hashString: vi.fn(async () => 'hash'),
    };

    render(
      <JotaiProvider>
        <GlobalProvider value={{ lists, identifierOperations }}>
          <FollowersTester userName="alice" />
        </GlobalProvider>
      </JotaiProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('followers-loading').textContent).toBe('false');
      expect(screen.getByTestId('followers-count').textContent).toBe('1');
    });
  });

  it('useFollowersList sets error on failure', async () => {
    const lists = {
      fetchResourcesResultsOnly: vi.fn(async () => {
        throw new Error('fail');
      }),
    };
    const identifierOperations = {
      hashString: vi.fn(async () => 'hash'),
    };

    render(
      <JotaiProvider>
        <GlobalProvider value={{ lists, identifierOperations }}>
          <FollowersTester userName="alice" />
        </GlobalProvider>
      </JotaiProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('followers-loading').textContent).toBe('false');
      expect(screen.getByTestId('followers-error').textContent).toContain('fail');
    });
  });
});
