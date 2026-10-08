// src/lib/utils/a11yAnnouncer.ts
import { writable } from 'svelte/store';

// Writable store to hold the current live region message
// Components can subscribe to this store to display the message in an aria-live region.
export const liveAnnouncementStore = writable('');

let timeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Announces a message to screen readers via an aria-live region.
 * The message is cleared after a short delay to ensure subsequent identical messages are announced.
 *
 * @param message The string message to announce.
 * @param delay Optional delay in milliseconds before clearing the message (default: 10ms).
 */
export function announce(message: string, delay: number = 10) {
  // Clear any existing timeout to ensure new messages are announced promptly
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  liveAnnouncementStore.set(message);

  // Set a timeout to clear the message, allowing screen readers to finish announcing
  timeoutId = setTimeout(() => {
    liveAnnouncementStore.set('');
    timeoutId = null; // Reset timeoutId after clearing
  }, delay);
}
