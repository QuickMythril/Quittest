import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveProfileToCache,
  loadProfileFromCache,
  clearProfileCache,
} from 'src/utils/profileCache';
import FDBFactory from 'fake-indexeddb/lib/FDBFactory';

const CACHE_MS = 5 * 60 * 1000;

describe('profileCache', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // @ts-ignore
    global.indexedDB = new FDBFactory();
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('saves and loads profile', async () => {
    await saveProfileToCache('alice', { bio: 'hello', qortalName: 'alice' });

    const cached = await loadProfileFromCache('alice');
    expect(cached?.bio).toBe('hello');
  });

  it('returns null when cache is expired', async () => {
    await saveProfileToCache('alice', { bio: 'hello', qortalName: 'alice' });
    nowSpy.mockReturnValue(CACHE_MS + 1000);

    const cached = await loadProfileFromCache('alice');
    expect(cached).toBeNull();
  });

  it('clears cache', async () => {
    await saveProfileToCache('alice', { bio: 'hello', qortalName: 'alice' });
    await clearProfileCache('alice');
    const cached = await loadProfileFromCache('alice');
    expect(cached).toBeNull();
  });
});
