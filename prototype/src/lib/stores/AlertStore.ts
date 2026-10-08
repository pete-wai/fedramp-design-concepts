/* lib/stores/AlertStore.ts */
import { writable, type Writable } from 'svelte/store';

interface AlertMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning'; // Include 'warning' as per your USAAlert component
}

export const alertStore: Writable<AlertMessage | null> = writable(null);

/**
 * Displays a temporary alert message.
 * @param {string} message - The message to display.
 * @param {'success' | 'error' | 'info' | 'warning'} type - The type of alert (for styling).
 * @param {number} [duration=3000] - How long the alert should be visible in milliseconds.
 */
export function showAlert(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info', // Use the defined types for parameters
  duration: number = 3000
) {
  alertStore.set({ message, type });

  // Automatically clear the alert after a specified duration
  setTimeout(() => {
    alertStore.set(null);
  }, duration);
}
