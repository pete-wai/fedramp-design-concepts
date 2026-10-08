import type { PageServerLoad } from './$types';
import * as eventsData from '$lib/data/events/data.json';
import { CalendarEventManager, createDateWithTimezone } from '$lib/utils/calendarUtils';
import type { Event, FilteredEvent } from '$lib/types/events';
import type { FedRAMPData } from '$lib/types/marketplace';
import { DateTime } from 'luxon';
import { getReferenceHomeData } from '$lib/services';

export const load: PageServerLoad = async (): Promise<{ allEventOccurrences: FilteredEvent[]; fedRAMPData: FedRAMPData }> => {
  const rawEvents = (eventsData as { events: Event[] }).events;

  // Use the same approach as your events layout - generate from build time reference
  const buildTimeReference = DateTime.fromISO('2026-10-03T12:00:00-04:00');
  const allOccurrences: FilteredEvent[] = [];

  rawEvents.forEach((rawEvent: Event) => {
    // Generate occurrences with the same logic as your events layout
    const occurrences = CalendarEventManager.expandEventOccurrences(
      rawEvent,
      buildTimeReference.minus({ years: 2 }), // Generate from 2 years before build time
      50 // Generate up to 50 future occurrences per event series
    );
    allOccurrences.push(...occurrences);
  });

  // Sort all generated occurrences chronologically
  allOccurrences.sort((a, b) => {
    const startA = createDateWithTimezone(a.displayOccurrenceDate, a.startTime, a.timezone);
    const startB = createDateWithTimezone(b.displayOccurrenceDate, b.startTime, b.timezone);
    return startA.toMillis() - startB.toMillis();
  });

  const fedRAMPData = getReferenceHomeData();

  return {
    allEventOccurrences: allOccurrences,
    fedRAMPData
  };
};
