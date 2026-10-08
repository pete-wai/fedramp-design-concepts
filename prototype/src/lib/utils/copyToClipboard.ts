/* lib/utils/copyToClipboard.ts */
import { alertStore } from '$lib/stores/AlertStore';

// State to provide feedback to the user
// export let copyStatus: string = ''; // 'success', 'error', or empty

let hideAlertTimeout: ReturnType<typeof setTimeout> | null = null; // To manage the toast message timeout
/**
 * Function to copy text to the clipboard.
 * @param {string} text - The text to be copied.
 */
// export async function copyToClipboard(text: string) {
//   copyStatus = ''; // Reset status before attempting to copy

//   try {
//     await navigator.clipboard.writeText(text);
//     copyStatus = 'success';
//     showAlert(`Copied text "${text}" to clipboard!`, 'success');
//     console.log(`Successfully copied text "${text}" to clipboard!`);
//   } catch (err) {
//     copyStatus = 'error';
//     showAlert(`Failed to copy text "${text}".`, 'error');
//     console.error(`Failed to copy text "${text}" to clipboard:`, err);
//   } finally {
//     // Clear the status message after a short delay
//     setTimeout(() => {
//       copyStatus = '';
//     }, 1000);
//   }
// }

/**
 * Handles the click event for the copy button, copies text to clipboard, and shows a toast.
 * @param {string | undefined} text - The text to be copied.
 * @param {string} toastDuration - Duration of toast after copying text. Default to 1 second.
 */
export async function copyToClipboard(text: string | undefined, toastDuration: number = 1000, successMessage: string = 'Text copied to clipboard!') {
  if (text) {
    try {
      await navigator.clipboard.writeText(text);
      // Clear any existing alert timeout to prevent conflicts
      if (hideAlertTimeout) clearTimeout(hideAlertTimeout);
      alertStore.set({ message: successMessage, type: 'success' });
      // Set a new timeout to clear the alert after the specified duration
      hideAlertTimeout = setTimeout(() => {
        alertStore.set(null);
        hideAlertTimeout = null;
      }, toastDuration);
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Clear any existing alert timeout
      if (hideAlertTimeout) clearTimeout(hideAlertTimeout);
      alertStore.set({ message: 'Failed to copy text.', type: 'error' });
      // Set a new timeout to clear the alert
      hideAlertTimeout = setTimeout(() => {
        alertStore.set(null);
        hideAlertTimeout = null;
      }, toastDuration);
    }
  } else {
    console.warn('No text available to copy.');
    // Clear any existing alert timeout
    if (hideAlertTimeout) clearTimeout(hideAlertTimeout);
    alertStore.set({ message: 'No text available to copy.', type: 'warning' });
    // Set a new timeout to clear the alert
    hideAlertTimeout = setTimeout(() => {
      alertStore.set(null);
      hideAlertTimeout = null;
    }, toastDuration);
  }
}
