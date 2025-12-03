import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProfileFromQdn } from 'src/utils/profileQdn';

describe('profileQdn', () => {
  const createSingleIdentifier = vi.fn(async () => 'profile-id');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns profile on success', async () => {
    vi.stubGlobal('qortalRequest', vi.fn(async () => ({ bio: 'hi' })));

    const result = await fetchProfileFromQdn('alice', { createSingleIdentifier });
    expect(result.profile?.bio).toBe('hi');
    expect(result.error).toBeNull();
  });

  it('returns null when not found', async () => {
    vi.stubGlobal('qortalRequest', vi.fn(async () => null));

    const result = await fetchProfileFromQdn('alice', { createSingleIdentifier });
    expect(result.profile).toBeNull();
    expect(result.error).toBe('Profile not found');
  });

  it('handles errors', async () => {
    vi.stubGlobal('qortalRequest', vi.fn(async () => { throw new Error('boom'); }));

    const result = await fetchProfileFromQdn('alice', { createSingleIdentifier });
    expect(result.profile).toBeNull();
    expect(result.error).toContain('boom');
  });
});
