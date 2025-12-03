import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('qapp-core', async () => {
  const module = await import('./__mocks__/qapp-core.tsx');
  return module;
});

vi.mock('qortalRequest', async () => {
  const module = await import('./__mocks__/qortalRequest.ts');
  return module;
});

// Suppress noisy console.error for expected test failures; let unexpected ones surface.
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      (msg.includes('Error: Test expected error') ||
        msg.includes('Error with post:') ||
        msg.includes('Error loading follows') ||
        msg.includes('Error initializing profile') ||
        msg.includes('Error fetching profile from QDN') ||
        msg.includes('Error fetching follows') ||
        msg.includes('Error fetching followers'))
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
