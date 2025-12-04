import { describe, expect, it } from 'vitest';
import { buildForwardPayload } from '../src/utils/forwardPayload';

describe('buildForwardPayload', () => {
  const postId = 'ABC123';
  const postName = 'alice';

  it('builds a link-only payload when text is empty', () => {
    const result = buildForwardPayload({ postId, postName });
    expect(result.message).toBe(
      `qortal://APP/Quittest/post/${encodeURIComponent(postName)}/${encodeURIComponent(postId)}`
    );
    expect(result.bytes).toBeLessThanOrEqual(4000);
    expect(result.snippet).toBeUndefined();
  });

  it('includes snippet and link when text provided', () => {
    const text = 'Hello Qortal friends!';
    const result = buildForwardPayload({ postId, postName, text });
    expect(result.message).toContain(text);
    expect(result.message).toContain('qortal://APP/Quittest/post');
    expect(result.snippet).toBe(text);
    expect(result.bytes).toBeLessThanOrEqual(4000);
  });

  it('truncates long text by bytes to stay under limit', () => {
    // Create a long string with multibyte chars to test byte trimming
    const text = '🚀'.repeat(3000);
    const result = buildForwardPayload({ postId, postName, text });
    expect(result.bytes).toBeLessThanOrEqual(4000);
    expect(result.snippet).toBeDefined();
    expect(result.message.endsWith(`/${postId}`)).toBe(true);
  });
});
