import { describe, expect, it } from 'vitest';
import { buildForwardPayload } from '../src/utils/forwardPayload';

describe('buildForwardPayload', () => {
  const postId = 'ABC123';
  const postName = 'alice';

  it('builds a link-only payload when text is empty', () => {
    const result = buildForwardPayload({ postId, postName });
    expect(result.fullMessageObject).toBeDefined();
    expect(result.message || result.fullMessageObject).toBeDefined();
    expect(result.bytes).toBeLessThanOrEqual(4000);
    expect(result.snippet).toBeUndefined();
  });

  it('includes snippet and link when text provided', () => {
    const text = 'Hello Qortal friends!';
    const result = buildForwardPayload({ postId, postName, text });
    const serialized = result.fullMessageObject || result.message || '';
    expect(serialized).toContain('qortal://APP/Quittest/post');
    expect(result.snippet).toBe(text);
    expect(result.bytes).toBeLessThanOrEqual(4000);
  });

  it('truncates long text by bytes to stay under limit', () => {
    // Create a long string with multibyte chars to test byte trimming
    const text = '🚀'.repeat(3000);
    const result = buildForwardPayload({ postId, postName, text });
    expect(result.bytes).toBeLessThanOrEqual(4000);
    expect(result.snippet).toBeDefined();
    const serialized = result.fullMessageObject || result.message || '';
    expect(serialized.includes(postId)).toBe(true);
  });
});
