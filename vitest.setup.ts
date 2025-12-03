import '@testing-library/jest-dom';

// Suppress noisy console.error for expected test failures; let unexpected ones surface.
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && msg.includes('Error: Test expected error')) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
