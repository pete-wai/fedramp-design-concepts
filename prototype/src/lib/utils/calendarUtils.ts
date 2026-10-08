/* lib/utils/calendarUtils.ts */
import { DateTime, Settings } from 'luxon';
import { SITE_URL } from '$lib/constants';
import type { Event, TimeOfDay, FilteredEvent } from '$lib/types/events';

// --- Timezone and Date Utility Helpers ---
// Luxon handles robust timezone handling, including daylight saving time.
// The 'iana' property is crucial for Luxon.
const TIMEZONE_INFO: { [key: string]: { offsetMinutes: number; iana: string } } = {
  // Original data had -04:00, which is EDT (Eastern Daylight Time).
  // Luxon will automatically determine the correct offset for 'America/New_York' based on the date.
  ET: { offsetMinutes: -300, iana: 'America/New_York' } // offsetMinutes here is a static reference, Luxon will use IANA name.
};

/**
 * Helper to get the IANA timezone name for a given timezone string.
 * This is primarily for Luxon's use.
 */
function getIanaTimezone(timezone: string): string | undefined {
  return TIMEZONE_INFO[timezone]?.iana;
}

/**
 * Creates a Luxon DateTime object from a date string (M/D/YYYY), TimeOfDay, and timezone.
 * The resulting DateTime object will be correctly zoned to the specified timezone.
 * Example: dateStr="1/7/2026", time={hour:13, minute:0}, timezone="ET"
 * Resulting DateTime will represent 2026-01-07T13:00:00.000-05:00 (or -04:00 if DST) in America/New_York.
 * @returns A Luxon DateTime object in the specified timezone.
 */
export function createDateWithTimezone(dateStr: string, time: TimeOfDay, timezone: string): DateTime {
  const ianaZone = getIanaTimezone(timezone);
  if (!ianaZone) {
    console.warn(`❓ Unknown timezone: ${timezone}. Falling back to system default timezone.`);
    return DateTime.fromFormat(`${dateStr} ${time.hour}:${time.minute}`, 'M/d/yyyy H:m', { zone: Settings.defaultZone });
  }
  // Ensure minutes are padded to 2 digits
  const paddedMinutes = time.minute.toString().padStart(2, '0');
  const timeString = `${time.hour}:${paddedMinutes}`;
  const fullDateTimeString = `${dateStr} ${timeString}`;
  // Use H:mm format to handle padded minutes properly
  const dt = DateTime.fromFormat(fullDateTimeString, 'M/d/yyyy H:mm', { zone: ianaZone });
  if (!dt.isValid) {
    console.error(`🚨 Invalid date/time created for ${fullDateTimeString} in ${ianaZone}: ${dt.invalidExplanation}`);
    return DateTime.invalid('Invalid date/time input');
  }
  return dt;
}

/**
 * Formats a Luxon DateTime object into an ISO 8601 string with offset (e.g., "YYYY-MM-DDTHH:mm:ss-HH:mm").
 * This is suitable for `DTSTART`, `DTEND` in ICS, and for `startDatetime`, `endDatetime` in FilteredEvent.
 * The input `dt` should already be in the desired local time in its correct zone.
 */
export function formatToISOWithOffset(dt: DateTime): string {
  if (!dt.isValid) {
    console.warn(`Invalid DateTime object passed to formatToISOWithOffset. Returning empty string.`);
    return '';
  }
  // Luxon's toISO() naturally includes the offset for zoned DateTimes.
  // suppressMilliseconds is often good for calendar integrations unless sub-second precision is needed.
  return dt.toISO({ includeOffset: true, suppressMilliseconds: true }) || '';
}

// --- CalendarEventManager Class ---
export class CalendarEventManager {
  private static dayOfWeekMap: { [key: string]: number } = {
    sunday: 0, // Luxon: 7
    monday: 1, // Luxon: 1
    tuesday: 2, // Luxon: 2
    wednesday: 3, // Luxon: 3
    thursday: 4, // Luxon: 4
    friday: 5, // Luxon: 5
    saturday: 6 // Luxon: 6
  };

  private static luxonDayOfWeekMap: { [key: string]: number } = {
    sunday: 7,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  private static weekOfMonthMap: { [key: string]: number } = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    last: -1
  };

  /**
   * Helper function to convert M/d/yyyy date to yyyy-mm-dd format
   */
  private static formatDateForOccurrenceId(dateStr: string): string {
    // Parse the M/d/yyyy format and convert to yyyy-mm-dd
    const dt = DateTime.fromFormat(dateStr, 'M/d/yyyy');
    if (dt.isValid) {
      return dt.toFormat('yyyy-MM-dd');
    }
    // Fallback to original string if parsing fails
    console.warn(`Could not parse date for occurrence ID: ${dateStr}`);
    return dateStr.replace(/\//g, '-'); // Simple fallback: replace slashes with dashes
  }

  /**
   * Formats a Luxon DateTime object into a calendar-friendly UTC string (e.g., 20231026T140000Z).
   * This is used for calendar URLs (Google, Outlook, Yahoo) and ICS DTSTAMP, DTSTART, DTEND, and UNTIL.
   * Always returns UTC format ending with 'Z' for maximum compatibility.
   */
  private static formatDateTimeForCalendar(dt: DateTime): string {
    if (!dt.isValid) {
      console.warn(`Invalid DateTime object passed to formatDateTimeForCalendar. Returning empty string.`);
      return '';
    }

    const utcDt = dt.toUTC();
    // Use explicit formatting instead of template literals to avoid corruption
    const year = utcDt.year.toString().padStart(4, '0');
    const month = utcDt.month.toString().padStart(2, '0');
    const day = utcDt.day.toString().padStart(2, '0');
    const hour = utcDt.hour.toString().padStart(2, '0');
    const minute = utcDt.minute.toString().padStart(2, '0');
    const second = utcDt.second.toString().padStart(2, '0');
    return `${year}${month}${day}T${hour}${minute}${second}Z`;
  }

  /**
   * Get the local day of the week for a given DateTime object in its specified timezone.
   * This is crucial for correctly calculating recurring events like "first Wednesday".
   * @param dt A DateTime object representing a specific point in time (already zoned).
   * @param timezone The event's timezone string (e.g., "ET").
   * @returns The local day of the week (0 for Sunday, 6 for Saturday) in the event's timezone.
   */
  private static getLocalDayOfWeekInTimezone(dt: DateTime, timezone: string): number {
    if (!dt.isValid) {
      console.warn(`Invalid DateTime object passed to getLocalDayOfWeekInTimezone. Returning -1.`);
      return -1;
    }
    const ianaZone = getIanaTimezone(timezone);
    if (!ianaZone) {
      console.warn(`Unknown timezone: ${timezone}. Falling back to current DateTime's zone.`);
      // Use the DateTime's current zone's weekday if IANA zone is unknown
      return dt.weekday === 7 ? 0 : dt.weekday; // Luxon: 1=Mon, ..., 7=Sun. Convert to 0=Sun, ..., 6=Sat
    }
    // Ensure the DateTime is in the correct zone before getting the weekday
    const zonedDt = dt.setZone(ianaZone);
    // Luxon's weekday is 1 for Monday, 7 for Sunday.
    // We need to convert it to 0 for Sunday, 6 for Saturday.
    return zonedDt.weekday === 7 ? 0 : zonedDt.weekday;
  }

  /**
   * Finds the Nth day of the week in a given month/year for a specific timezone.
   * @param year The year.
   * @param month The 0-indexed month (0-11).
   * @param targetDayOfWeekIndex The target day of the week (0=Sunday, 6=Saturday).
   * @param weekOfMonth The 'weekOfMonth' string ('first', 'second', 'last', etc.).
   * @param eventTime The TimeOfDay object for the event.
   * @param timezone The event's timezone string.
   * @returns A DateTime object representing the found day, or null if not found.
   */
  private static findNthDayOfWeekInMonth(
    year: number,
    month: number, // 0-indexed
    targetDayOfWeekIndex: number,
    weekOfMonth: Event['recurring']['weekOfMonth'],
    eventTime: TimeOfDay,
    timezone: string
  ): DateTime | null {
    const ianaZone = getIanaTimezone(timezone);
    if (!ianaZone) {
      console.warn(`Cannot calculate recurring date for unknown timezone: ${timezone}`);
      return null;
    }
    // Luxon's weekday is 1=Monday, ..., 7=Sunday. Convert targetDayOfWeekIndex (0=Sun, ..., 6=Sat)
    const luxonTargetDayOfWeek = targetDayOfWeekIndex === 0 ? 7 : targetDayOfWeekIndex;
    let foundDtInMonth: DateTime | null = null;
    if (!weekOfMonth) return null;
    if (weekOfMonth === 'last') {
      // Start from the last day of the month and go backwards
      let dt = DateTime.fromObject({ year, month: month + 1, day: 1, hour: eventTime.hour, minute: eventTime.minute }, { zone: ianaZone }).minus({
        days: 1
      });
      while (dt.month === month + 1 && dt.day > 0) {
        // Ensure we stay in the target month (Luxon month is 1-indexed)
        if (dt.weekday === luxonTargetDayOfWeek) {
          foundDtInMonth = dt;
          break;
        }
        dt = dt.minus({ days: 1 });
      }
    } else {
      const targetWeekNum = CalendarEventManager.weekOfMonthMap[weekOfMonth];
      let dayCounter = 0;
      // Start from the first day of the month
      let dt = DateTime.fromObject({ year, month: month + 1, day: 1, hour: eventTime.hour, minute: eventTime.minute }, { zone: ianaZone });
      while (dt.month === month + 1) {
        // Ensure we stay in the target month
        if (dt.weekday === luxonTargetDayOfWeek) {
          dayCounter++;
          if (dayCounter === targetWeekNum) {
            foundDtInMonth = dt;
            break;
          }
        }
        dt = dt.plus({ days: 1 });
      }
    }
    return foundDtInMonth;
  }

  /**
   * Calculates the next occurrence date for a recurring event.
   * Returns a DateTime object representing the start of that occurrence in its local time,
   * correctly zoned.
   */
  public static calculateNextOccurrenceDate(event: Event, referenceDateTime: DateTime): DateTime | null {
    const { startTime, timezone } = event;
    const ianaZone = getIanaTimezone(timezone);
    if (!ianaZone) {
      console.warn(`Cannot calculate next occurrence for unknown timezone: ${timezone}`);
      return null;
    }
    const endDate = event.recurring.endDate ? createDateWithTimezone(event.recurring.endDate, { hour: 23, minute: 59 }, event.timezone) : null;
    // For non-recurring events, calculate if it's still in the future
    if (!event.recurring.isRecurring) {
      const oneTimeEventDateTime = createDateWithTimezone(event.firstOccurrence, startTime, timezone);
      if (oneTimeEventDateTime.isValid && oneTimeEventDateTime >= referenceDateTime) {
        return oneTimeEventDateTime;
      }
      return null;
    }
    // For recurring events, start from the firstOccurrence date
    let currentOccurrence = createDateWithTimezone(event.firstOccurrence, startTime, timezone);
    if (!currentOccurrence.isValid) {
      console.error(`Invalid first occurrence date for event: ${event.title}`);
      return null;
    }
    const maxIterations = 365 * 2; // Limit to prevent infinite loops
    let i = 0;
    // Adjust currentOccurrence to be at least the referenceDateTime if it's in the past
    while (currentOccurrence < referenceDateTime && i < maxIterations) {
      let nextCandidate: DateTime | null;
      const currentMonth = currentOccurrence.month; // Luxon month is 1-indexed
      const currentYear = currentOccurrence.year;
      switch (event.recurring.frequency) {
        case 'weekly':
          nextCandidate = currentOccurrence.plus({ weeks: 1 });
          break;
        case 'biweekly':
          nextCandidate = currentOccurrence.plus({ weeks: 2 });
          break;
        case 'monthly':
        case 'quarterly': {
          if (!event.recurring.dayOfWeek || !event.recurring.weekOfMonth) {
            console.warn('dayOfWeek or weekOfMonth undefined for monthly/quarterly event:', event.title);
            return null;
          }
          const targetDayOfWeekIndex = CalendarEventManager.dayOfWeekMap[event.recurring.dayOfWeek.toLowerCase()];
          let nextMonth = currentMonth + (event.recurring.frequency === 'monthly' ? 1 : 3);
          let nextYear = currentYear;
          if (nextMonth > 12) {
            // Luxon months are 1-12
            nextYear += Math.floor((nextMonth - 1) / 12); // Adjust year for rollovers
            nextMonth = ((nextMonth - 1) % 12) + 1; // Adjust month for rollovers
          }
          nextCandidate = CalendarEventManager.findNthDayOfWeekInMonth(
            nextYear,
            nextMonth - 1, // findNthDayOfWeekInMonth expects 0-indexed month
            targetDayOfWeekIndex,
            event.recurring.weekOfMonth,
            startTime,
            timezone
          );
          if (!nextCandidate) {
            console.warn('Could not find next monthly/quarterly occurrence for event:', event.title, 'Month:', nextMonth, 'Year:', nextYear);
            return null;
          }
          break;
        }
        default:
          console.warn('Unknown recurring frequency:', event.recurring.frequency);
          return null;
      }
      if (nextCandidate && nextCandidate.isValid) {
        currentOccurrence = nextCandidate;
      } else {
        return null; // Could not calculate next valid date
      }
      i++;
    }
    // Check if current occurrence exceeds the recurring end date
    if (endDate && currentOccurrence > endDate) {
      return null;
    }
    // If we reached here, currentOccurrence is on or after referenceDateTime
    if (currentOccurrence.isValid && currentOccurrence >= referenceDateTime) {
      return currentOccurrence;
    }
    return null; // Exceeded max iterations or no future occurrence found
  }

  // --- EVENT EXPANSION FUNCTIONALITY ---
  /**
   * Expands a base event into individual occurrence objects (FilteredEvent).
   * Uses instances array as definitive source, fills gaps with recurring pattern.
   * @param baseEvent The original event data with instances array.
   * @param referenceDateTime DateTime to use for determining past/future (defaults to now in system local zone).
   * @param futureOccurrencesLimit How many future occurrences to generate (default: 5).
   * @returns Array of individual event occurrence objects.
   */
  public static expandEventOccurrences(
    baseEvent: Event,
    referenceDateTime: DateTime = DateTime.local(),
    futureOccurrencesLimit: number = 5
  ): FilteredEvent[] {
    const occurrences: FilteredEvent[] = [];
    // Handle non-recurring events
    if (!baseEvent.recurring.isRecurring) {
      const occurrenceDate = baseEvent.firstOccurrence;
      // Check if there's enrichment data for this single occurrence
      const instanceData = baseEvent.instances.find((instance) => instance.date === occurrenceDate);

      // Determine the display date: use rescheduledTo if present, otherwise use original date
      const displayDate = instanceData?.rescheduledTo || occurrenceDate;

      // Determine the times to use: rescheduledStartTime/rescheduledEndTime if present, otherwise use base event times
      const startTime = instanceData?.rescheduledStartTime || baseEvent.startTime;
      const endTime = instanceData?.rescheduledEndTime || baseEvent.endTime;

      const fullStartDate = createDateWithTimezone(displayDate, startTime, baseEvent.timezone);
      const fullEndDate = createDateWithTimezone(displayDate, endTime, baseEvent.timezone);
      if (!fullStartDate.isValid || !fullEndDate.isValid) {
        console.warn(`Skipping invalid non-recurring event date for event ${baseEvent.title}: ${displayDate}`);
        return occurrences;
      }

      // Handle cancellation
      const isCancelled = instanceData?.isCancelled || false;
      const isPast = fullEndDate < referenceDateTime;
      const isUpcoming = !isPast && !isCancelled;

      // Build occurrence description with auto-rescheduling note if needed
      let occurrenceDesc = instanceData?.description;
      // Check for ANY rescheduling: date change OR time change
      const isRescheduled = instanceData?.rescheduledTo || instanceData?.rescheduledStartTime || instanceData?.rescheduledEndTime;
      if (isRescheduled) {
        // Auto-generate rescheduling note - ALWAYS prepend, even if description exists
        const changedItems: string[] = [];
        if (displayDate !== occurrenceDate) changedItems.push('date');
        if (startTime !== baseEvent.startTime) changedItems.push('start time');
        if (endTime !== baseEvent.endTime) changedItems.push('end time');
        if (changedItems.length > 0) {
          const itemListStr =
            changedItems.length === 1 ? changedItems[0] : changedItems.slice(0, -1).join(', ') + ' and ' + changedItems[changedItems.length - 1];
          const reschedulingNotice = `⚠️ **NOTE: The ${itemListStr} of this event has been updated.**`;
          // Always prepend rescheduling notice, even if there's already a description
          occurrenceDesc = occurrenceDesc ? `${reschedulingNotice}\n\n${occurrenceDesc}` : reschedulingNotice;
        }
      }

      const formattedDate = CalendarEventManager.formatDateForOccurrenceId(displayDate);
      occurrences.push({
        ...baseEvent,
        // Override title if instance has a custom title
        title: instanceData?.title || baseEvent.title,
        // Override start and end times if rescheduled
        startTime: startTime,
        endTime: endTime,
        displayOccurrenceDate: displayDate,
        isUpcoming: isUpcoming,
        startDatetime: formatToISOWithOffset(fullStartDate),
        endDatetime: formatToISOWithOffset(fullEndDate),
        occurrenceId: `${baseEvent.id}-${formattedDate}`,
        parentEventId: undefined,
        occurrenceDate: displayDate,
        isPast: isPast,
        occurrenceNumber: 1,
        isNextOccurrence: isUpcoming,
        // Use instance data for enrichment if available
        occurrenceDescription: occurrenceDesc,
        occurrenceRecordingLink: instanceData?.recordingLink,
        occurrenceReference: instanceData?.reference,
        tag: baseEvent.tag,
        tagColor: baseEvent.tagColor,
        // Track cancellation and rescheduling status
        occurrenceCancelled: isCancelled,
        originalOccurrenceDate: instanceData?.rescheduledTo ? occurrenceDate : undefined,
        occurrenceRescheduled: !!(instanceData?.rescheduledTo || instanceData?.rescheduledStartTime || instanceData?.rescheduledEndTime),
        occurrenceTitle: instanceData?.title
      });
      return occurrences;
    }
    // Handle recurring events
    // STEP 1: Process ALL instances from the instances array (these are definitive)
    const allInstanceDates = new Set<string>();
    baseEvent.instances.forEach((instance) => {
      allInstanceDates.add(instance.date);

      // Determine the display date: use rescheduledTo if present, otherwise use original date
      const displayDate = instance.rescheduledTo || instance.date;

      // Determine the times to use: rescheduledStartTime/rescheduledEndTime if present, otherwise use base event times
      const startTime = instance.rescheduledStartTime || baseEvent.startTime;
      const endTime = instance.rescheduledEndTime || baseEvent.endTime;

      const fullStartDate = createDateWithTimezone(displayDate, startTime, baseEvent.timezone);
      const fullEndDate = createDateWithTimezone(displayDate, endTime, baseEvent.timezone);
      if (!fullStartDate.isValid || !fullEndDate.isValid) {
        console.warn(`Skipping invalid instance date for event ${baseEvent.title}: ${displayDate}`);
        return;
      }

      // Cancelled occurrences are marked as not upcoming
      const isCancelled = instance.isCancelled || false;
      const isPast = fullEndDate < referenceDateTime;
      const isUpcoming = !isPast && !isCancelled;

      // Build occurrence description with auto-rescheduling note if needed
      let occurrenceDesc = instance.description;
      // Check for ANY rescheduling: date change OR time change
      const isRescheduled = instance.rescheduledTo || instance.rescheduledStartTime || instance.rescheduledEndTime;
      if (isRescheduled) {
        // Auto-generate rescheduling note - ALWAYS prepend, even if description exists
        const changedItems: string[] = [];
        if (displayDate !== instance.date) changedItems.push('date');
        if (startTime !== baseEvent.startTime) changedItems.push('start time');
        if (endTime !== baseEvent.endTime) changedItems.push('end time');
        if (changedItems.length > 0) {
          const itemListStr =
            changedItems.length === 1 ? changedItems[0] : changedItems.slice(0, -1).join(', ') + ' and ' + changedItems[changedItems.length - 1];
          const reschedulingNotice = `⚠️ **NOTE: The ${itemListStr} of this event has been updated.**`;
          // Always prepend rescheduling notice, even if there's already a description
          occurrenceDesc = occurrenceDesc ? `${reschedulingNotice}\n\n${occurrenceDesc}` : reschedulingNotice;
        }
      }

      const formattedDate = CalendarEventManager.formatDateForOccurrenceId(displayDate);
      occurrences.push({
        ...baseEvent,
        // Override title if instance has a custom title
        title: instance.title || baseEvent.title,
        // Override start and end times if rescheduled
        startTime: startTime,
        endTime: endTime,
        displayOccurrenceDate: displayDate,
        isUpcoming: isUpcoming,
        startDatetime: formatToISOWithOffset(fullStartDate),
        endDatetime: formatToISOWithOffset(fullEndDate),
        occurrenceId: `${baseEvent.id}-${formattedDate}`,
        parentEventId: baseEvent.id,
        occurrenceDate: displayDate,
        isPast: isPast,
        occurrenceNumber: 0, // Will be set after sorting
        isNextOccurrence: false, // Will be set after sorting
        // Use instance-specific data
        occurrenceDescription: occurrenceDesc,
        occurrenceRecordingLink: instance.recordingLink,
        occurrenceReference: instance.reference,
        tag: baseEvent.tag,
        tagColor: baseEvent.tagColor,
        // Track cancellation and rescheduling status
        occurrenceCancelled: isCancelled,
        originalOccurrenceDate: instance.rescheduledTo ? instance.date : undefined,
        occurrenceRescheduled: !!(instance.rescheduledTo || instance.rescheduledStartTime || instance.rescheduledEndTime),
        occurrenceTitle: instance.title
      });
    });
    // STEP 2: Generate pattern-based occurrences to fill gaps
    const patternOccurrences = CalendarEventManager.generatePatternBasedOccurrences(
      baseEvent,
      referenceDateTime,
      futureOccurrencesLimit,
      allInstanceDates // Pass existing dates to avoid duplicates
    );
    occurrences.push(...patternOccurrences);
    // STEP 3: Sort all occurrences chronologically and assign occurrence numbers
    occurrences.sort((a, b) => {
      const dtA = createDateWithTimezone(a.displayOccurrenceDate, baseEvent.startTime, baseEvent.timezone);
      const dtB = createDateWithTimezone(b.displayOccurrenceDate, baseEvent.startTime, baseEvent.timezone);
      return dtA.toMillis() - dtB.toMillis();
    });
    // Assign occurrence numbers in chronological order
    occurrences.forEach((occurrence, index) => {
      occurrence.occurrenceNumber = index + 1;
    });
    // STEP 4: Mark the first upcoming occurrence as "next"
    const upcomingOccurrences = occurrences.filter((occ) => occ.isUpcoming);
    if (upcomingOccurrences.length > 0) {
      // Sort upcoming by date to find the truly next one
      upcomingOccurrences.sort((a, b) => {
        const dtA = createDateWithTimezone(a.displayOccurrenceDate, baseEvent.startTime, baseEvent.timezone);
        const dtB = createDateWithTimezone(b.displayOccurrenceDate, baseEvent.startTime, baseEvent.timezone);
        return dtA.toMillis() - dtB.toMillis();
      });
      const nextOccurrence = upcomingOccurrences[0];
      const matchingIndex = occurrences.findIndex((occ) => (occ.occurrenceId || occ.id) === (nextOccurrence.occurrenceId || nextOccurrence.id));
      if (matchingIndex !== -1) {
        occurrences[matchingIndex].isNextOccurrence = true;
      }
    }
    return occurrences;
  }

  /**
   * Generates pattern-based occurrences to fill gaps where instances don't exist.
   * Only creates occurrences for dates that aren't already in the instances array.
   */
  private static generatePatternBasedOccurrences(
    baseEvent: Event,
    referenceDateTime: DateTime,
    futureLimit: number,
    existingDates: Set<string>
  ): FilteredEvent[] {
    const patternOccurrences: FilteredEvent[] = [];
    // Start generating from well before the reference date to capture historical gaps
    const startGeneratingFrom = referenceDateTime.minus({ years: 2 });
    // Calculate end date for generation
    const recurringEndDate = baseEvent.recurring.endDate
      ? createDateWithTimezone(baseEvent.recurring.endDate, { hour: 23, minute: 59 }, baseEvent.timezone)
      : referenceDateTime.plus({ years: 2 }); // Generate 2 years into future if no end date
    let currentCalculationPoint = startGeneratingFrom;
    let futureOccurrenceCount = 0;
    let totalOccurrences = 0;
    const maxOccurrences = 1000; // Safety limit
    while (totalOccurrences < maxOccurrences && futureOccurrenceCount < futureLimit) {
      const nextOccurrenceDateTime = CalendarEventManager.calculateNextOccurrenceDate(baseEvent, currentCalculationPoint);
      if (!nextOccurrenceDateTime || !nextOccurrenceDateTime.isValid) {
        break;
      }
      // Stop if we've passed the recurring end date
      if (recurringEndDate && nextOccurrenceDateTime > recurringEndDate) {
        break;
      }
      const occurrenceDateStr = nextOccurrenceDateTime.toFormat('M/d/yyyy');
      // SKIP if this date already exists in instances array
      if (existingDates.has(occurrenceDateStr)) {
        currentCalculationPoint = nextOccurrenceDateTime.plus({ minute: 1 });
        continue;
      }
      const fullStartDate = nextOccurrenceDateTime;
      const fullEndDate = createDateWithTimezone(occurrenceDateStr, baseEvent.endTime, baseEvent.timezone);
      if (!fullEndDate.isValid) {
        console.warn(`Skipping invalid end date for pattern occurrence ${occurrenceDateStr}`);
        currentCalculationPoint = nextOccurrenceDateTime.plus({ minute: 1 });
        continue;
      }
      const isPast = fullEndDate < referenceDateTime;
      const isUpcoming = !isPast;
      // Count future occurrences to respect the limit
      if (isUpcoming) {
        futureOccurrenceCount++;
      }
      const formattedDate = CalendarEventManager.formatDateForOccurrenceId(occurrenceDateStr);
      patternOccurrences.push({
        ...baseEvent,
        displayOccurrenceDate: occurrenceDateStr,
        isUpcoming: isUpcoming,
        startDatetime: formatToISOWithOffset(fullStartDate),
        endDatetime: formatToISOWithOffset(fullEndDate),
        occurrenceId: `${baseEvent.id}-${formattedDate}`,
        parentEventId: baseEvent.id,
        occurrenceDate: occurrenceDateStr,
        isPast: isPast,
        occurrenceNumber: 0, // Will be set in main function
        isNextOccurrence: false, // Will be set in main function
        // Pattern-based occurrences have no enrichment data
        occurrenceDescription: undefined,
        occurrenceRecordingLink: undefined,
        occurrenceReference: undefined,
        tag: baseEvent.tag,
        tagColor: baseEvent.tagColor,
        // Pattern-based occurrences are never cancelled or rescheduled
        occurrenceCancelled: false,
        originalOccurrenceDate: undefined,
        occurrenceRescheduled: false,
        occurrenceTitle: undefined
      });
      totalOccurrences++;
      currentCalculationPoint = nextOccurrenceDateTime.plus({ minute: 1 });
    }
    return patternOccurrences;
  }

  /**
   * Generates ALL recurring occurrences based on the event's recurring pattern.
   * This generates every occurrence that should exist, regardless of instances array.
   */
  private static generateAllRecurringOccurrences(baseEvent: Event, referenceDateTime: DateTime, futureLimit: number): FilteredEvent[] {
    const allOccurrences: FilteredEvent[] = [];
    // Start generating from well before the reference date to capture historical occurrences
    const startGeneratingFrom = referenceDateTime.minus({ years: 2 });
    // Calculate end date for generation
    const recurringEndDate = baseEvent.recurring.endDate
      ? createDateWithTimezone(baseEvent.recurring.endDate, { hour: 23, minute: 59 }, baseEvent.timezone)
      : referenceDateTime.plus({ years: 2 }); // Generate 2 years into future if no end date
    let currentCalculationPoint = startGeneratingFrom;
    let futureOccurrenceCount = 0;
    let totalOccurrences = 0;
    const maxOccurrences = 1000; // Safety limit
    while (totalOccurrences < maxOccurrences && futureOccurrenceCount < futureLimit) {
      const nextOccurrenceDateTime = CalendarEventManager.calculateNextOccurrenceDate(baseEvent, currentCalculationPoint);
      if (!nextOccurrenceDateTime || !nextOccurrenceDateTime.isValid) {
        break;
      }
      // Stop if we've passed the recurring end date
      if (recurringEndDate && nextOccurrenceDateTime > recurringEndDate) {
        break;
      }
      const occurrenceDateStr = nextOccurrenceDateTime.toFormat('M/d/yyyy');
      const fullStartDate = nextOccurrenceDateTime;
      const fullEndDate = createDateWithTimezone(occurrenceDateStr, baseEvent.endTime, baseEvent.timezone);
      if (!fullEndDate.isValid) {
        console.warn(`Skipping invalid end date for occurrence ${occurrenceDateStr}`);
        currentCalculationPoint = nextOccurrenceDateTime.plus({ minute: 1 });
        continue;
      }
      const isPast = fullEndDate < referenceDateTime;
      const isUpcoming = !isPast;
      // Count future occurrences to respect the limit
      if (isUpcoming) {
        futureOccurrenceCount++;
      }
      const formattedDate = CalendarEventManager.formatDateForOccurrenceId(occurrenceDateStr);
      allOccurrences.push({
        ...baseEvent,
        displayOccurrenceDate: occurrenceDateStr,
        isUpcoming: isUpcoming,
        startDatetime: formatToISOWithOffset(fullStartDate),
        endDatetime: formatToISOWithOffset(fullEndDate),
        occurrenceId: `${baseEvent.id}-${formattedDate}`,
        parentEventId: baseEvent.id,
        occurrenceDate: occurrenceDateStr,
        isPast: isPast,
        occurrenceNumber: 0, // Will be set in the main function
        isNextOccurrence: false, // Will be set in the main function
        // These will be enriched with instance data in the main function
        occurrenceDescription: undefined,
        occurrenceRecordingLink: undefined,
        occurrenceReference: undefined,
        tag: baseEvent.tag,
        tagColor: baseEvent.tagColor
      });
      totalOccurrences++;
      currentCalculationPoint = nextOccurrenceDateTime.plus({ minute: 1 });
    }
    // Sort all occurrences chronologically
    allOccurrences.sort((a, b) => {
      const dtA = createDateWithTimezone(a.displayOccurrenceDate, baseEvent.startTime, baseEvent.timezone);
      const dtB = createDateWithTimezone(b.displayOccurrenceDate, baseEvent.startTime, baseEvent.timezone);
      return dtA.toMillis() - dtB.toMillis();
    });
    return allOccurrences;
  }

  // --- CALENDAR INTEGRATION METHODS ---
  /**
   * Creates an RRULE string for ICS files.
   * Now uses the `recurring` object directly.
   */
  public static createRecurrenceRule(recurring: Event['recurring'], timezone: string): string {
    if (!recurring.isRecurring) return '';
    const dayAbbrevMap: { [key: string]: string } = {
      sunday: 'SU',
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      saturday: 'SA'
    };
    let rrule = `FREQ=${recurring.frequency?.toUpperCase()}`;
    // Handle BYDAY for weekly, monthly, quarterly
    if (recurring.dayOfWeek) {
      const dayAbbrev = dayAbbrevMap[recurring.dayOfWeek.toLowerCase()];
      if (dayAbbrev) {
        if (recurring.frequency === 'weekly' || recurring.frequency === 'biweekly') {
          rrule += `;BYDAY=${dayAbbrev}`;
        } else if ((recurring.frequency === 'monthly' || recurring.frequency === 'quarterly') && recurring.weekOfMonth) {
          const weekNum = CalendarEventManager.weekOfMonthMap[recurring.weekOfMonth];
          if (weekNum && weekNum !== -1) {
            rrule += `;BYDAY=${weekNum}${dayAbbrev}`;
          } else if (weekNum === -1) {
            rrule += `;BYDAY=-1${dayAbbrev}`; // 'last' week
          }
        }
      }
    }
    // Handle INTERVAL for biweekly and quarterly
    if (recurring.frequency === 'biweekly') {
      rrule += `;INTERVAL=2`;
    } else if (recurring.frequency === 'quarterly') {
      if (recurring.dayOfWeek && recurring.weekOfMonth) {
        rrule = rrule.replace('FREQ=QUARTERLY', 'FREQ=MONTHLY');
        rrule += `;INTERVAL=3`;
      }
    }
    if (recurring.endDate) {
      const endDateDt = createDateWithTimezone(recurring.endDate, { hour: 23, minute: 59 }, timezone);
      if (endDateDt.isValid) {
        // Use the fixed formatDateTimeForCalendar function
        const untilFormatted = CalendarEventManager.formatDateTimeForCalendar(endDateDt);
        rrule += `;UNTIL=${untilFormatted}`;
      } else {
        console.warn(`Invalid recurring endDate for event. Skipping UNTIL rule.`);
      }
    }
    return rrule;
  }

  /**
   * Creates a comprehensive event description for calendar entries.
   * Prioritizes specificOccurrenceDescription if provided, otherwise uses event.description.
   * Includes cancellation/rescheduling notices if applicable.
   * Includes a dynamic eventPageUrl for the "IMPORTANT" note.
   * Properly escapes text for ICS format.
   */
  public static createEventDescription(
    event: Event | FilteredEvent,
    basePath: string, // Now expects just the base path like "/community" or ""
    specificOccurrenceDescription?: string
  ): string {
    let description = '';

    // Add automatic rescheduling notes based on what changed
    if ('occurrenceRescheduled' in event && event.occurrenceRescheduled && event.originalOccurrenceDate) {
      const changedItems: string[] = [];

      if (event.displayOccurrenceDate !== event.originalOccurrenceDate) {
        changedItems.push('date');
      }

      // Check if times changed from base event
      if (event.occurrenceRescheduled && event.originalOccurrenceDate) {
        // This is a rescheduled occurrence, so we assume times might have changed
        // We'll add a note if rescheduledStartTime or rescheduledEndTime fields exist
        const instanceData = 'parentEventId' in event ? event : null;
        if (instanceData && (instanceData.startTime !== event.startTime || instanceData.endTime !== event.endTime)) {
          if (!changedItems.includes('start time')) changedItems.push('start time');
          if (!changedItems.includes('end time')) changedItems.push('end time');
        }
      }

      if (changedItems.length > 0) {
        const itemListStr =
          changedItems.length === 1 ? changedItems[0] : changedItems.slice(0, -1).join(', ') + ' and ' + changedItems[changedItems.length - 1];
        description = `**NOTE: The ${itemListStr} of this event has been updated.**\n\n`;
      }
    }

    // Add cancellation notice
    if ('occurrenceCancelled' in event && event.occurrenceCancelled) {
      description = '🚨 **THIS EVENT HAS BEEN CANCELLED.**\n\n';
    }

    description += specificOccurrenceDescription || event.description || '';

    // Construct the proper event page URL using the base path and appropriate event ID.
    // Must be absolute: this string is embedded in downloaded .ics files, which are
    // opened outside any web page context. Uses the canonical www host (#1208).
    const baseUrl = SITE_URL;
    let properEventUrl: string;
    // If this is a FilteredEvent with an occurrenceId, link to the specific occurrence
    if ('occurrenceId' in event && event.occurrenceId) {
      properEventUrl = `${baseUrl}/event/${event.occurrenceId}`;
    }
    // If this is a FilteredEvent with a parentEventId but no occurrenceId, link to the series
    else if ('parentEventId' in event && event.parentEventId) {
      properEventUrl = `${baseUrl}/event/${event.parentEventId}`;
    }
    // Otherwise, link to the event itself (series or single event)
    else {
      properEventUrl = `${baseUrl}/event/${event.id}`;
    }

    description += `\n\n⚠️ IMPORTANT: Please check ${properEventUrl} for the most up-to-date information.`;

    if (event.meetingLink) {
      description += `\n\nJoin the meeting: ${event.meetingLink}`;
    }

    if (event.registrationLink) {
      description += `\n\nRegister here: ${event.registrationLink}`;
    } else if (event.registrationRequired && !event.meetingLink && !event.reference) {
      description += `\n\nRegistration may be required. Please check the event page for details.`;
    }

    return description;
  }

  /**
   * Escapes text for ICS format according to RFC 5545.
   * Handles newlines, commas, semicolons, and backslashes.
   */
  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\') // Escape backslashes first
      .replace(/\n/g, '\\n') // Convert newlines to \n
      .replace(/,/g, '\\,') // Escape commas
      .replace(/;/g, '\\;') // Escape semicolons
      .replace(/\r/g, ''); // Remove carriage returns
  }

  /**
   * Folds long lines according to ICS specification (RFC 5545).
   * Lines should be no longer than 75 characters, with continuation lines
   * starting with a space or tab.
   */
  private static foldICSLine(line: string): string {
    if (line.length <= 75) {
      return line;
    }

    const folded: string[] = [];
    let remaining = line;

    // First line can be 75 characters
    folded.push(remaining.substring(0, 75));
    remaining = remaining.substring(75);

    // Continuation lines start with a space and can be 74 characters (75 - 1 for the space)
    while (remaining.length > 0) {
      const chunk = remaining.substring(0, 74);
      folded.push(` ${chunk}`);
      remaining = remaining.substring(74);
    }

    return folded.join('\r\n');
  }
  /**
   * Creates a clean location string for ICS files.
   * Combines meeting link and location in a readable format without line breaks.
   */
  public static createLocationString(event: Event | FilteredEvent): string {
    const parts: string[] = [];

    if (event.meetingLink) {
      parts.push(`Google Meet: ${event.meetingLink}`);
    }

    if (event.location && event.location.trim() !== '' && event.location !== 'Google Meet') {
      parts.push(event.location.trim());
    }

    return parts.join(' | ') || '';
  }

  /**
   * Creates the content for an ICS file for a single event occurrence.
   * This will NOT include RRULE, even if the event is part of a series.
   * Uses UTC times for maximum compatibility.
   * @param event A FilteredEvent representing a single occurrence.
   * @param basePath The base path for the event page URL (e.g., "/community").
   */
  public static createICSForOccurrence(event: FilteredEvent, basePath: string): string {
    const description = CalendarEventManager.createEventDescription(event, basePath, event.occurrenceDescription);
    const location = CalendarEventManager.createLocationString(event);

    const startDt = DateTime.fromISO(event.startDatetime);
    const endDt = DateTime.fromISO(event.endDatetime);

    if (!startDt.isValid || !endDt.isValid) {
      console.error(`Invalid startDatetime or endDatetime for ICS: ${event.startDatetime}, ${event.endDatetime}`);
      return ''; // Or throw an error
    }

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FedRAMP//Community Meetings//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      CalendarEventManager.foldICSLine(
        `UID:${event.occurrenceId || event.id}-${CalendarEventManager.formatDateTimeForCalendar(startDt)}@fedramp.gov`
      ),
      `DTSTART:${CalendarEventManager.formatDateTimeForCalendar(startDt)}`,
      `DTEND:${CalendarEventManager.formatDateTimeForCalendar(endDt)}`,
      `DTSTAMP:${CalendarEventManager.formatDateTimeForCalendar(DateTime.utc())}`,
      CalendarEventManager.foldICSLine(`SUMMARY:${CalendarEventManager.escapeICSText(event.title)} (Occurrence ${event.occurrenceNumber || 1})`),
      CalendarEventManager.foldICSLine(`DESCRIPTION:${CalendarEventManager.escapeICSText(description)}`),
      CalendarEventManager.foldICSLine(`LOCATION:${CalendarEventManager.escapeICSText(location)}`),
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    return icsLines.join('\r\n');
  }

  /**
   * Creates the content for an ICS file for an entire recurring event series.
   * This will include the RRULE.
   * Uses TZID format for recurring events to properly handle DST transitions.
   * @param baseEvent The base Event object (not a FilteredEvent occurrence).
   * @param basePath The base path for the event page URL (e.g., "/community").
   */
  public static createICSForSeries(baseEvent: Event, basePath: string): string {
    if (!baseEvent.recurring.isRecurring) {
      console.warn('Attempted to create series ICS for a non-recurring event:', baseEvent.title);
      // Fallback to single occurrence if it's not actually recurring
      const firstStartDate = createDateWithTimezone(baseEvent.firstOccurrence, baseEvent.startTime, baseEvent.timezone);
      const firstEndDate = createDateWithTimezone(baseEvent.firstOccurrence, baseEvent.endTime, baseEvent.timezone);
      if (!firstStartDate.isValid || !firstEndDate.isValid) {
        console.error(`Invalid first occurrence date for non-recurring event ${baseEvent.title}. Cannot create ICS.`);
        return '';
      }
      const tempFilteredEvent: FilteredEvent = {
        ...baseEvent,
        displayOccurrenceDate: baseEvent.firstOccurrence,
        isUpcoming: true,
        startDatetime: formatToISOWithOffset(firstStartDate),
        endDatetime: formatToISOWithOffset(firstEndDate),
        occurrenceId: baseEvent.id,
        parentEventId: undefined,
        occurrenceDate: baseEvent.firstOccurrence,
        isPast: false,
        occurrenceNumber: 1,
        isNextOccurrence: true
      };
      return CalendarEventManager.createICSForOccurrence(tempFilteredEvent, basePath);
    }

    const firstStartDate = createDateWithTimezone(baseEvent.firstOccurrence, baseEvent.startTime, baseEvent.timezone);
    const firstEndDate = createDateWithTimezone(baseEvent.firstOccurrence, baseEvent.endTime, baseEvent.timezone);

    if (!firstStartDate.isValid || !firstEndDate.isValid) {
      console.error(`Invalid first occurrence date for recurring event ${baseEvent.title}. Cannot create series ICS.`);
      return '';
    }

    const description = CalendarEventManager.createEventDescription(baseEvent, basePath);
    const location = CalendarEventManager.createLocationString(baseEvent);

    const ianaZone = getIanaTimezone(baseEvent.timezone);
    if (!ianaZone) {
      console.warn(`Unknown timezone for series ICS: ${baseEvent.timezone}. Falling back to UTC.`);
    }

    const formatLocalDateTime = (dt: DateTime): string => {
      const year = dt.year.toString().padStart(4, '0');
      const month = dt.month.toString().padStart(2, '0');
      const day = dt.day.toString().padStart(2, '0');
      const hour = dt.hour.toString().padStart(2, '0');
      const minute = dt.minute.toString().padStart(2, '0');
      const second = dt.second.toString().padStart(2, '0');
      return `${year}${month}${day}T${hour}${minute}${second}`;
    };

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FedRAMP//Community Meetings//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      CalendarEventManager.foldICSLine(`UID:${baseEvent.id}@fedramp.gov`),
      ianaZone
        ? `DTSTART;TZID=${ianaZone}:${formatLocalDateTime(firstStartDate)}`
        : `DTSTART:${CalendarEventManager.formatDateTimeForCalendar(firstStartDate)}`,
      ianaZone
        ? `DTEND;TZID=${ianaZone}:${formatLocalDateTime(firstEndDate)}`
        : `DTEND:${CalendarEventManager.formatDateTimeForCalendar(firstEndDate)}`,
      `DTSTAMP:${CalendarEventManager.formatDateTimeForCalendar(DateTime.utc())}`,
      CalendarEventManager.foldICSLine(`SUMMARY:${CalendarEventManager.escapeICSText(baseEvent.title)} (Series)`),
      CalendarEventManager.foldICSLine(`DESCRIPTION:${CalendarEventManager.escapeICSText(description)}`),
      CalendarEventManager.foldICSLine(`LOCATION:${CalendarEventManager.escapeICSText(location)}`),
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE'
    ];

    const rrule = CalendarEventManager.createRecurrenceRule(baseEvent.recurring, baseEvent.timezone);
    if (rrule) {
      icsLines.push(CalendarEventManager.foldICSLine(`RRULE:${rrule}`));
    }

    icsLines.push('END:VEVENT', 'END:VCALENDAR');

    return icsLines.join('\r\n');
  }
  /**
   * Triggers a download of the ICS file for a single event occurrence.
   * @param event A FilteredEvent representing a single occurrence.
   * @param basePath The base path for the event page URL (e.g., "/community").
   */
  public static downloadICSForOccurrence(event: FilteredEvent, basePath: string): void {
    const icsContent = CalendarEventManager.createICSForOccurrence(event, basePath);
    if (!icsContent) return; // Don't download if content generation failed
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${event.displayOccurrenceDate.replace(/\//g, '-')}-occurrence.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Triggers a download of the ICS file for an entire recurring event series.
   * @param baseEvent The base Event object (not a FilteredEvent occurrence).
   * @param basePath The base path for the event page URL (e.g., "/community").
   */
  public static downloadICSForSeries(baseEvent: Event, basePath: string): void {
    const icsContent = CalendarEventManager.createICSForSeries(baseEvent, basePath);
    if (!icsContent) return; // Don't download if content generation failed
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseEvent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-series.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Creates a Google Calendar URL for a SINGLE event occurrence.
   * @param event A FilteredEvent representing a single occurrence.
   * @param basePath The base path for the event page URL (e.g., "/community").
   */
  public static createGoogleCalendarURL(event: FilteredEvent, basePath: string): string {
    const baseURL = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const startDateTime = DateTime.fromISO(event.startDatetime);
    const endDateTime = DateTime.fromISO(event.endDatetime);

    if (!startDateTime.isValid || !endDateTime.isValid) {
      console.error(`Invalid startDatetime or endDatetime for Google Calendar URL: ${event.startDatetime}, ${event.endDatetime}`);
      return '';
    }

    const params = new URLSearchParams({
      text: event.title,
      // Google Calendar expects YYYYMMDDTHHMMSSZ format in UTC
      dates: `${CalendarEventManager.formatDateTimeForCalendar(startDateTime)}/${CalendarEventManager.formatDateTimeForCalendar(endDateTime)}`,
      details: CalendarEventManager.createEventDescription(event, basePath, event.occurrenceDescription),
      // Use meetingLink for location if available, otherwise use location
      location: event.meetingLink || event.location || ''
    });

    return `${baseURL}&${params.toString()}`;
  }

  /**
   * Creates a Google Calendar URL for an entire recurring event SERIES.
   * @param baseEvent The base Event object (not a FilteredEvent occurrence).
   * @param basePath The base path for the event page URL (e.g., "/community").
   */
  public static createGoogleCalendarURLForSeries(baseEvent: Event, basePath: string): string {
    if (!baseEvent.recurring.isRecurring) {
      console.warn('Attempted to create series Google Calendar URL for a non-recurring event:', baseEvent.title);
      const firstStartDate = createDateWithTimezone(baseEvent.firstOccurrence, baseEvent.startTime, baseEvent.timezone);
      const firstEndDate = createDateWithTimezone(baseEvent.firstOccurrence, baseEvent.endTime, baseEvent.timezone);
      if (!firstStartDate.isValid || !firstEndDate.isValid) {
        console.error(`Invalid first occurrence date for non-recurring event ${baseEvent.title}. Cannot create Google Calendar URL.`);
        return '';
      }
      const tempFilteredEvent: FilteredEvent = {
        ...baseEvent,
        displayOccurrenceDate: baseEvent.firstOccurrence,
        isUpcoming: true,
        startDatetime: formatToISOWithOffset(firstStartDate),
        endDatetime: formatToISOWithOffset(firstEndDate),
        occurrenceId: baseEvent.id,
        parentEventId: undefined,
        occurrenceDate: baseEvent.firstOccurrence,
        isPast: false,
        occurrenceNumber: 1,
        isNextOccurrence: true
      };
      return CalendarEventManager.createGoogleCalendarURL(tempFilteredEvent, basePath);
    }

    const baseURL = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

    // Use the NEXT occurrence date, not the first occurrence
    const now = DateTime.now();
    const nextOccurrence = CalendarEventManager.calculateNextOccurrenceDate(baseEvent, now);
    if (!nextOccurrence || !nextOccurrence.isValid) {
      console.error(`Could not calculate next occurrence for recurring event ${baseEvent.title}`);
      return '';
    }

    // Calculate end time for the next occurrence
    const nextOccurrenceEnd = nextOccurrence.set({
      hour: baseEvent.endTime.hour,
      minute: baseEvent.endTime.minute,
      second: 0,
      millisecond: 0
    });

    const startFormatted = CalendarEventManager.formatDateTimeForCalendar(nextOccurrence);
    const endFormatted = CalendarEventManager.formatDateTimeForCalendar(nextOccurrenceEnd);

    const rrule = CalendarEventManager.createRecurrenceRule(baseEvent.recurring, baseEvent.timezone);
    const details = CalendarEventManager.createEventDescription(baseEvent, basePath);

    const params = new URLSearchParams({
      text: baseEvent.title,
      dates: `${startFormatted}/${endFormatted}`,
      details: details,
      location: baseEvent.meetingLink || baseEvent.location || ''
    });

    if (rrule) {
      params.append('recur', `RRULE:${rrule}`);
    }

    const finalUrl = `${baseURL}&${params.toString()}`;
    return finalUrl;
  }

  /**
   * Creates an Outlook Calendar URL. Now takes a FilteredEvent.
   * @param event A FilteredEvent representing a single occurrence.
   * @param basePath The base path for the event page URL (e.g., "/community").
   */
  public static createOutlookURL(event: FilteredEvent, basePath: string): string {
    const baseURL = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const startDt = DateTime.fromISO(event.startDatetime);
    const endDt = DateTime.fromISO(event.endDatetime);

    if (!startDt.isValid || !endDt.isValid) {
      console.error(`Invalid startDatetime or endDatetime for Outlook URL: ${event.startDatetime}, ${event.endDatetime}`);
      return '';
    }

    const params = new URLSearchParams({
      subject: event.title,
      // Outlook expects ISO strings with timezone offset, which event.startDatetime/endDatetime already are.
      startdt: event.startDatetime,
      enddt: event.endDatetime,
      body: CalendarEventManager.createEventDescription(event, basePath, event.occurrenceDescription),
      location: event.meetingLink || event.location || ''
    });

    return `${baseURL}?${params.toString()}`;
  }

  /**
   * Creates a Yahoo Calendar URL. Now takes a FilteredEvent.
   * @param event A FilteredEvent representing a single occurrence.
   * @param basePath The base path for the event page URL (e.g., "/community").
   */
  public static createYahooURL(event: FilteredEvent, basePath: string): string {
    const baseURL = 'https://calendar.yahoo.com/?v=60&view=d&type=20';
    const startDateTime = DateTime.fromISO(event.startDatetime);
    const endDateTime = DateTime.fromISO(event.endDatetime);

    if (!startDateTime.isValid || !endDateTime.isValid) {
      console.error(`Invalid startDatetime or endDatetime for Yahoo Calendar URL: ${event.startDatetime}, ${event.endDatetime}`);
      return '';
    }

    const params = new URLSearchParams({
      title: event.title,
      // Yahoo expects Unix timestamps in seconds (UTC)
      st: startDateTime.toUTC().toSeconds().toString(),
      et: endDateTime.toUTC().toSeconds().toString(),
      desc: CalendarEventManager.createEventDescription(event, basePath, event.occurrenceDescription),
      in_loc: event.meetingLink || event.location || ''
    });

    return `${baseURL}&${params.toString()}`;
  }
}
