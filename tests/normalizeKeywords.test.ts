import { describe, it, expect } from 'vitest';
import { buildHashtagDescription, normalizeKeywords } from '../src/utils/postQdn';

describe('buildHashtagDescription / normalizeKeywords', () => {
  it('dedupes and lowercases tags within budget', () => {
    const { description, truncated } = buildHashtagDescription([
      '#Test',
      '#test',
      '#Another',
    ]);
    expect(description).toBe('~#test~,~#another~');
    expect(truncated).toBe(false);
  });

  it('truncates a single oversized tag to fit budget', () => {
    const longTag = '#'.concat('a'.repeat(200));
    const { description, truncated } = buildHashtagDescription([longTag]);
    expect(description.startsWith('~#')).toBe(true);
    expect(description.length).toBeLessThanOrEqual(150);
    expect(truncated).toBe(true);
  });

  it('stops when no space remains and marks truncated', () => {
    const tags = ['#a'.repeat(20), '#b'.repeat(20), '#c'.repeat(20), '#d'.repeat(20)];
    const { description, truncated } = buildHashtagDescription(tags, 60);
    expect(description.length).toBeLessThanOrEqual(60);
    expect(truncated).toBe(true);
  });

  it('normalizes tags via normalizeKeywords helper', () => {
    expect(normalizeKeywords(['#Test', '#Two'])).toBe('~#test~,~#two~');
  });
});
