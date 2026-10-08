/* lib/utils/dateUtils.ts */
import type { TimeOfDay } from '../types/events'; // Updated import to TimeOfDay

/**
 * IANA timezone for all FedRAMP marketplace dates. Marketplace source data
 * (e.g. fedramp-status-changelog.json) anchors dates to Eastern Time — a
 * "midnight ET" instant is serialized as a UTC timestamp such as
 * "2012-07-19T04:00:00.000Z". Formatting such a value in the viewer's local
 * timezone shifts it to the previous calendar day for anyone west of ET,
 * producing off-by-one dates. Always format marketplace dates in this zone.
 */
export const MARKETPLACE_TIME_ZONE = 'America/New_York';

/**
 * Format a marketplace date (Date or date string) as a calendar date in
 * Eastern Time, so the displayed day matches the ET-anchored source data
 * regardless of the viewer's local timezone. Returns `fallback` for
 * null/invalid input.
 *
 * @param dateInput A Date, ISO/date string, or null.
 * @param options Intl.DateTimeFormat options (timeZone is forced to ET).
 * @param fallback String returned when the input is missing/invalid.
 */
export function formatMarketplaceDate(
  dateInput: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
  fallback = 'N/A'
): string {
  if (dateInput === null || dateInput === undefined || dateInput === '') {
    return fallback;
  }
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleDateString('en-US', { timeZone: MARKETPLACE_TIME_ZONE, ...options });
}

/**
 * Formats a Date object or string into a user-friendly date string (e.g., "Wednesday, January 7, 2026").
 * @param dateInput The Date object or date string (e.g., "1/7/2026") to format.
 * @returns A formatted date string or "Invalid Date" if the input is invalid.
 */
export function formatDisplayDate(dateInput: Date | string): string {
  let date: Date;
  if (typeof dateInput === 'string') {
    // For M/D/YYYY format, construct date to avoid timezone issues with direct 'new Date(string)'
    const [month, day, year] = dateInput.split('/').map(Number);
    // Note: Month is 0-indexed in Date constructor
    date = new Date(year, month - 1, day);
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    console.warn('Invalid Date object or string passed to formatDisplayDate:', dateInput);
    return 'Invalid Date';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a TimeOfDay object along with a timezone string into a user-friendly time string (e.g., "1:00 PM ET").
 * @param timeObj The TimeOfDay object containing hour and minute.
 * @param timezone The timezone string (e.g., "ET", "PST").
 * @returns A formatted time string with timezone or "Time TBD" if time is missing.
 */
export function formatTime(timeObj: TimeOfDay, timezone: string): string {
  if (!timeObj || timeObj.hour === undefined || timeObj.minute === undefined) {
    return 'Time TBD';
  }

  const { hour, minute } = timeObj;

  // Create a dummy date for formatting the time part
  const dummyDate = new Date();
  dummyDate.setHours(hour, minute, 0, 0); // Set hours and minutes

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true // Use 12-hour format with AM/PM
  };

  // Format the time and append the timezone
  return `${dummyDate.toLocaleTimeString('en-US', options)} ${timezone || ''}`.trim();
}

/**
 * Formats a time range from start and end TimeOfDay objects with timezone.
 * Example output: "1:00 PM ET - 2:30 PM ET"
 * @param startTime The start TimeOfDay object.
 * @param endTime The end TimeOfDay object.
 * @param timezone The timezone string (e.g., "ET", "PST").
 * @returns A formatted time range string or "Time TBD" if times are missing.
 */
export function formatTimeRange(startTime: TimeOfDay, endTime: TimeOfDay, timezone: string): string {
  const formattedStart = formatTime(startTime, timezone);
  const formattedEnd = formatTime(endTime, timezone);

  if (formattedStart === 'Time TBD' || formattedEnd === 'Time TBD') {
    return 'Time TBD';
  }

  return `${formattedStart} - ${formattedEnd}`;
}

/**
 * Generates a rescheduling notice for an event that has been rescheduled.
 * @param originalDate The original date of the event (e.g., "1/7/2026")
 * @param newDate The new date of the event (e.g., "1/14/2026")
 * @param originalTime The original TimeOfDay object
 * @param newTime The new TimeOfDay object
 * @param timezone The timezone string (e.g., "ET", "PST")
 * @returns A markdown-formatted notice describing what changed, or empty string if nothing changed
 */
export function generateReschedulingNotice(
  originalDate: string | undefined,
  newDate: string | undefined,
  originalTime: TimeOfDay | undefined,
  newTime: TimeOfDay | undefined,
  timezone: string
): string {
  const changedItems: string[] = [];

  // Check if date changed
  if (originalDate && newDate && originalDate !== newDate) {
    changedItems.push('date');
  }

  // Check if time changed
  if (originalTime && newTime && (originalTime.hour !== newTime.hour || originalTime.minute !== newTime.minute)) {
    changedItems.push('time');
  }

  if (changedItems.length === 0) {
    return '';
  }

  const itemList =
    changedItems.length === 1 ? changedItems[0] : changedItems.slice(0, -1).join(', ') + ' and ' + changedItems[changedItems.length - 1];

  let notice = `⚠️ **NOTE: The ${itemList} of this event has been updated.**`;

  // Add details about the changes
  const details: string[] = [];

  if (changedItems.includes('date')) {
    details.push(`Originally scheduled for ${formatDisplayDate(originalDate!)}`);
    details.push(`Now scheduled for ${formatDisplayDate(newDate!)}`);
  }

  if (changedItems.includes('time')) {
    details.push(`Originally scheduled for ${formatTime(originalTime!, timezone)}`);
    if (newTime) {
      details.push(`Now scheduled for ${formatTime(newTime, timezone)}`);
    }
  }

  if (details.length > 0) {
    notice += '\n\n' + details.join('\n');
  }

  return notice;
}

/**
 * Converts a date string to a Date object. If date string only includes month and day,
 * we will normalize to use year 2011 and Eastern Time zone.
 * @param dateStr Date string
 * @returns Date object or null if not a valid Date string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringToDate(dateStr: any): Date | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }
  const trimmed = dateStr.trim();
  // "Invalid Date" is what is returned by new Date(<arg>) if argument is not a date string
  if (trimmed === '' || trimmed.toLowerCase() === 'invalid date') {
    return null;
  }

  // We validated that dateStr is a valid datestring
  // Can then check for annual_assessments month/days
  function monthDayStringToDate(dateStr: string): Date | null {
    // Use a regular expression to strictly match "MM/DD" or "M/D" patterns
    const mdRegex = /^(\d{1,2})\/(\d{1,2})$/;
    const match = dateStr.match(mdRegex);

    if (match) {
      const month = Number(match[1]);
      const day = Number(match[2]);

      // Validate month and day values
      if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
        return null; // Invalid month or day
      }

      const dummyYear = 2011; // FedRAMP start year
      const timezone = '-04:00'; // ET (Eastern Time) for consistency

      // Format to an ISO-like string for reliable Date parsing
      const formattedDateStr = `${dummyYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T00:00:00${timezone}`;
      const date = new Date(formattedDateStr);

      // Final check if the constructed date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    }
    return null; // Does not match the "MM/DD" pattern
  }

  const monthDayParsedDate = monthDayStringToDate(trimmed);
  if (monthDayParsedDate !== null) {
    return monthDayParsedDate;
  }

  const generalParsedDate = new Date(trimmed);
  if (!isNaN(generalParsedDate.getTime())) {
    return generalParsedDate;
  }

  return null;
}
