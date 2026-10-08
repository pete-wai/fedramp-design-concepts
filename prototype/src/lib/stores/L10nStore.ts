// src/lib/stores/L10nStore.ts
import { writable, get } from 'svelte/store';
import type { L10nMessages } from '../types/i18n';
import tooltipMessages from '$lib/l10n/tooltips/data.json';

// 1. The core writable store
// This store holds all your flat localization messages.
// It's initialized to tooltip messages.
export const messages = writable<L10nMessages>(tooltipMessages as L10nMessages);

// 2. Function to load messages into the store
/**
 * Loads a new set of flat messages into the localization store,
 * replacing any previously loaded messages.
 * @param newMessages The flat JSON object containing message keys and values.
 */
export function loadMessages(newMessages: L10nMessages): void {
  messages.set(newMessages);
  // console.log('Localization messages loaded:', newMessages);
}

// 3. Helper function to get a translated message
// Sharing same function name as i18next's t() in case we want to hotswap to a more robust i18n library in the future
/**
 * Retrieves a translated message for a given key.
 * If the key is not found, it returns a fallback string indicating the missing key.
 * @param key The message identifier.
 * @returns The translated string or a fallback if not found.
 */
export function t(key: string): string {
  const currentMessages = get(messages); // Synchronously get the current value from the store
  if (!currentMessages[key]) {
    console.error(`Missing message for: ${key}`);
  }
  return currentMessages[key] || `[${key}]`; // Fallback for missing keys
}
