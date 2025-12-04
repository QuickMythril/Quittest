import { describe, it, expect, vi } from 'vitest';
import { publishPost, publishReply } from 'src/utils/postQdn';

// Mock qortalRequest globally
// @ts-ignore
global.qortalRequest = vi.fn(async () => ({}));

describe('postQdn metadata descriptions', () => {
const identifierOperations = {
  hashString: vi.fn(async (val: string) => `hash_${val}`),
  buildSearchPrefix: vi.fn(async () => 'prefix'),
  buildIdentifier: vi.fn(async (entity: string, parent: string) => `id_${entity}_${parent}`),
};

  const addNewResources = vi.fn();
  const publishMultipleResources = vi.fn(async () => {});
  const updateNewResources = vi.fn();

  it('includes hashed mention in post description', async () => {
    await publishPost({
      text: 'Hello @alice and #hi',
      media: [],
      identifierOperations,
      addNewResources,
      userName: 'bob',
      publishMultipleResources,
      updateNewResources,
    });

    const call = publishMultipleResources.mock.calls.at(-1);
    expect(call).toBeTruthy();
    const resources = call[0] as any[];
    const postResource = resources.find((r) => r.service === 'DOCUMENT');
    expect(postResource.description).toContain('~@hash_alice~');
    expect(postResource.description).toContain('~#hi~');
  });

  it('includes mention and reply markers in reply description', async () => {
    await publishReply({
      text: 'Replying to @alice #topic',
      media: [],
      identifierOperations,
      addNewResources,
      userName: 'bob',
      replyToPostIdentifier: 'post123',
      replyToPostName: 'charlie',
      publishMultipleResources,
    });

    const call = publishMultipleResources.mock.calls.at(-1);
    expect(call).toBeTruthy();
    const resources = call[0] as any[];
    const replyResource = resources.find((r) => r.service === 'DOCUMENT');
    expect(replyResource.description).toContain('~@hash_alice~');
    expect(replyResource.description).toContain('~rplyhash_charlie~');
    expect(replyResource.description).toContain('~#topic~');
  });
});
