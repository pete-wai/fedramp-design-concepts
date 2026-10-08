import { DateTime } from 'luxon';
import { createDateWithTimezone } from '$lib/utils/calendarUtils';
import type { FilteredEvent } from '$lib/types/events';

export function processEventsData(allOccurrences: FilteredEvent[], currentTime: DateTime = DateTime.now()) {
  const upcoming: FilteredEvent[] = [];
  const past: FilteredEvent[] = [];

  allOccurrences.forEach((event) => {
    // Skip cancelled occurrences - they should not appear in search results
    if (event.occurrenceCancelled) {
      return;
    }

    const eventEndDateTime = createDateWithTimezone(event.displayOccurrenceDate, event.endTime, event.timezone);
    if (eventEndDateTime.isValid) {
      if (eventEndDateTime >= currentTime) {
        upcoming.push({ ...event, isUpcoming: true, isPast: false });
      } else {
        past.push({ ...event, isUpcoming: false, isPast: true });
      }
    }
  });

  // Sort upcoming events chronologically (earliest first)
  upcoming.sort((a, b) => {
    const startA = createDateWithTimezone(a.displayOccurrenceDate, a.startTime, a.timezone);
    const startB = createDateWithTimezone(b.displayOccurrenceDate, b.startTime, b.timezone);
    return startA.toMillis() - startB.toMillis();
  });

  // Sort past events reverse chronologically (latest first)
  past.sort((a, b) => {
    const startA = createDateWithTimezone(a.displayOccurrenceDate, a.startTime, a.timezone);
    const startB = createDateWithTimezone(b.displayOccurrenceDate, b.startTime, b.timezone);
    return startB.toMillis() - startA.toMillis();
  });

  // Re-evaluate 'isNextOccurrence'
  const firstUpcomingGlobal = upcoming.length > 0 ? upcoming[0] : undefined;
  upcoming.forEach((event) => {
    event.isNextOccurrence = firstUpcomingGlobal && event.occurrenceId === firstUpcomingGlobal.occurrenceId;
  });

  return { upcomingEvents: upcoming, previousEvents: past };
}
