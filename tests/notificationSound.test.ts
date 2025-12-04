import { describe, it, expect, vi, beforeEach } from 'vitest';

class MockOscillator {
  type: string | undefined;
  frequency = { setValueAtTime: vi.fn() };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGain {
  gain = {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
}

class MockAudioContext {
  currentTime = 0;
  createOscillator = vi.fn(() => new MockOscillator());
  createGain = vi.fn(() => new MockGain());
  destination = {};
}

describe('notificationSound', () => {
  beforeEach(() => {
    vi.resetModules();
    (global as any).webkitAudioContext = undefined;
  });

  it('does not throw when playing sound', async () => {
    (global as any).AudioContext = MockAudioContext as any;
    const { playNotificationSound } = await import('src/utils/notificationSound');
    expect(() => playNotificationSound()).not.toThrow();
  });

  it('creates oscillators and gains for two tones', async () => {
    const ctx = new MockAudioContext();
    (global as any).AudioContext = vi.fn(() => ctx);
    const { playNotificationSound } = await import('src/utils/notificationSound');

    playNotificationSound();

    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
    expect(ctx.createGain).toHaveBeenCalledTimes(2);
  });
});

