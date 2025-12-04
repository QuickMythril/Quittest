/**
 * Notification Sound Utility
 * 
 * Creates a pleasant, non-annoying notification sound using the Web Audio API
 * The sound is a soft, two-tone chime that's gentle and not intrusive
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize the audio context (lazy initialization)
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a pleasant notification sound
 * Creates a soft two-tone chime: C6 (1046.5 Hz) followed by E6 (1318.5 Hz)
 */
export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create oscillator for the first tone (C6)
    const oscillator1 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();

    oscillator1.connect(gainNode1);
    gainNode1.connect(ctx.destination);

    oscillator1.type = 'sine'; // Sine wave for a pure, soft tone
    oscillator1.frequency.setValueAtTime(1046.5, now); // C6

    // Soft attack and decay envelope for first tone
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.15, now + 0.01); // Quick attack
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.3); // Gentle decay

    oscillator1.start(now);
    oscillator1.stop(now + 0.3);

    // Create oscillator for the second tone (E6)
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(1318.5, now + 0.15); // E6, slightly delayed

    // Soft attack and decay envelope for second tone
    gainNode2.gain.setValueAtTime(0, now + 0.15);
    gainNode2.gain.linearRampToValueAtTime(0.12, now + 0.16); // Quick attack
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Gentle decay

    oscillator2.start(now + 0.15);
    oscillator2.stop(now + 0.5);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

/**
 * Test the notification sound (useful for settings)
 */
export function testNotificationSound(): void {
  playNotificationSound();
}

