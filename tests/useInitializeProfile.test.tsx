import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { Provider, useAtom } from 'jotai';
import { GlobalProvider } from 'qapp-core';
import { useInitializeProfile } from 'src/hooks/useInitializeProfile';
import {
  hasProfileAtom,
  profileDataAtom,
  profileNameAtom,
  isLoadingProfileAtom,
} from 'src/state/global/profile';

const loadProfileFromCache = vi.fn();
const saveProfileToCache = vi.fn();
const fetchProfileFromQdn = vi.fn();

vi.mock('src/utils/profileCache', () => ({
  loadProfileFromCache: (...args: any[]) => loadProfileFromCache(...args),
  saveProfileToCache: (...args: any[]) => saveProfileToCache(...args),
}));

vi.mock('src/utils/profileQdn', () => ({
  fetchProfileFromQdn: (...args: any[]) => fetchProfileFromQdn(...args),
}));

const HookTester = ({ children }: { children?: React.ReactNode }) => {
  useInitializeProfile();
  const [hasProfile] = useAtom(hasProfileAtom);
  const [profileData] = useAtom(profileDataAtom);
  const [profileName] = useAtom(profileNameAtom);
  const [isLoading] = useAtom(isLoadingProfileAtom);

  return (
    <div>
      <div data-testid="hasProfile">{String(hasProfile)}</div>
      <div data-testid="profileData">{profileData?.bio || ''}</div>
      <div data-testid="profileName">{profileName || ''}</div>
      <div data-testid="isLoading">{String(isLoading)}</div>
      {children}
    </div>
  );
};

describe('useInitializeProfile', () => {
  beforeEach(() => {
    loadProfileFromCache.mockReset();
    saveProfileToCache.mockReset();
    fetchProfileFromQdn.mockReset();
  });

  const renderHookWithAuth = (auth: any) => {
    render(
      <Provider>
        <GlobalProvider
          value={{
            auth,
            identifierOperations: {
              createSingleIdentifier: vi.fn(async () => 'profile-id'),
            },
          }}
        >
          <HookTester />
        </GlobalProvider>
      </Provider>
    );
  };

  it('sets hasProfile false when no auth name', async () => {
    renderHookWithAuth({});

    await waitFor(() => {
      expect(screen.getByTestId('hasProfile').textContent).toBe('false');
    });
    expect(screen.getByTestId('isLoading').textContent).toBe('false');
  });

  it('loads from cache when available', async () => {
    loadProfileFromCache.mockResolvedValue({ bio: 'cached bio' });

    renderHookWithAuth({ name: 'alice', address: 'ADDR' });

    await waitFor(() => {
      expect(screen.getByTestId('profileData').textContent).toBe('cached bio');
    });

    expect(screen.getByTestId('hasProfile').textContent).toBe('true');
    expect(screen.getByTestId('profileName').textContent).toBe('alice');
  });

  it('fetches from QDN on cache miss', async () => {
    loadProfileFromCache.mockResolvedValue(null);
    fetchProfileFromQdn.mockResolvedValue({ profile: { bio: 'qdn' }, error: null });

    renderHookWithAuth({ name: 'alice', address: 'ADDR' });

    await waitFor(() => {
      expect(screen.getByTestId('profileData').textContent).toBe('qdn');
    });

    expect(saveProfileToCache).toHaveBeenCalled();
  });

  it('handles fetch errors by clearing profile', async () => {
    loadProfileFromCache.mockResolvedValue(null);
    fetchProfileFromQdn.mockRejectedValue(new Error('fail'));

    renderHookWithAuth({ name: 'alice', address: 'ADDR' });

    await waitFor(() => {
      expect(screen.getByTestId('hasProfile').textContent).toBe('false');
    });
  });
});
