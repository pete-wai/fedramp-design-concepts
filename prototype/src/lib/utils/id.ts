/* lib/utils/id.ts */
import { browser } from '$app/environment';

let idCounter = 0;

/**
 * Generates a unique ID with an optional prefix
 * Works in both browser and SSR environments
 */
export function generateId(prefix: string = 'id'): string {
  if (!browser) {
    // For SSR, use a simple incrementing counter
    return `${prefix}-ssr-${idCounter++}`;
  }

  // For browser, use random ID
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}
