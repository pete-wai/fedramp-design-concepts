/* lib/utils/functions.ts */
// Useful functions that we can use across the project

import { resolve } from './paths';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

export function normalizePermalink(permalink: string): string {
  /**
   * reversing it so it now adds trailing slash if there's no trailing slash
   * removing slash:
   * return permalink.endsWith('/') ? permalink.slice(0, -1) : permalink;
   */
  return permalink.endsWith('/') ? permalink : permalink.concat('/');
}

/**
 * Converts a date string into a numeric format (MM/DD/YYYY or DD/MM/YYYY) based on locale
 *
 * @param date - A date string that can be parsed by the Date constructor (e.g., "2024-03-15", "March 15, 2024")
 * @param locale - A language tag (e.g., "en-US" for MM/DD/YYYY, "en-GB" for DD/MM/YYYY, "en-CA" for YYYY-MM-DD)
 * @returns A formatted date string in numeric format
 *
 * @example
 * formatDateToNumeric("2024-03-15", "en-US") // Returns "03/15/2024"
 * formatDateToNumeric("March 15, 2024", "en-GB") // Returns "15/03/2024"
 * formatDateToNumeric("2024-12-25", "de-DE") // Returns "25.12.2024"
 */
export function formatDateToNumeric(date: string, locale: string): string {
  const dateOnly = date.split('T')[0];
  const dateObj = new Date(dateOnly + 'T00:00:00');

  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Converts a Markdown string to HTML format.
 *
 * @param {string} markdown - The Markdown string to be converted.
 * @returns {Promise<string>} A Promise that resolves with the HTML representation of the input Markdown.
 *
 * @async
 *
 * @example
 * const markdownText = '# Hello, world!\n\nThis is a paragraph.';
 * markdownToHtml(markdownText) // Returns '<h1>Hello, world!</h1>\n<p>This is a paragraph.</p>\n'
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  // Replace <br><br> with double newlines for proper paragraph breaks
  const cleanMarkdown = markdown.replace(/<br><br>/g, '\n\n');

  const result = await remark().use(remarkHtml).process(cleanMarkdown);
  return result.toString().replace(/href="(\/[^"]*)"/g, (_, path) => `href="${resolve(path)}"`);
}
