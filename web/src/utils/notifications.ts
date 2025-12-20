/**
 * Browser and sound notification utilities
 */

/**
 * Request browser notification permission
 * @returns Whether permission was granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[Notifications] Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Show a browser notification
 * @param title - Notification title
 * @param options - Notification options
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/wego-logo.png',
        badge: '/wego-logo.png',
        ...options,
      });
    } catch (error) {
      console.log('[Notifications] Could not show notification:', error);
    }
  }
}

// Audio element for notification sound (lazy loaded)
let notificationAudio: HTMLAudioElement | null = null;

/**
 * Play notification sound
 * Uses a simple beep sound generated programmatically if no audio file is available
 */
export async function playNotificationSound(): Promise<void> {
  try {
    // Try to use audio file first
    if (!notificationAudio) {
      notificationAudio = new Audio('/sounds/notification.mp3');
      notificationAudio.volume = 0.5;
    }

    // Reset and play
    notificationAudio.currentTime = 0;
    await notificationAudio.play();
  } catch (error) {
    // Fallback: Use Web Audio API to generate a simple notification beep
    console.log('[Notifications] Audio file not available, using fallback beep');
    playFallbackBeep();
  }
}

/**
 * Play a fallback beep sound using Web Audio API
 * This is used when the notification.mp3 file is not available
 */
function playFallbackBeep(): void {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create oscillator for the beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure the beep sound
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';

    // Set volume and fade out
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    // Play the beep
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('[Notifications] Could not play fallback beep:', error);
  }
}

/**
 * Format a date as a relative time string (e.g., "Hace 5 min")
 * @param date - The date to format
 * @returns Formatted relative time string in Spanish
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}
