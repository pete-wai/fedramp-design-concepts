/* lib/types/events.ts */
/**
 * Defines the structure for a reference link with title and URL
 */
export interface ReferenceLink {
  title: string;
  url: string;
}
/**
 * Defines the structure for representing a time of day (hour and minute).
 */
export interface TimeOfDay {
  hour: number;
  minute: number;
}
/**
 * Defines a single event instance with optional overrides
 */
export interface EventInstance {
  /** The date of this specific instance (e.g., "1/7/2026") */
  date: string;
  /** Optional: Override description for this specific instance */
  description?: string;
  /** Optional: Recording link for this specific instance (if it's a past event) */
  recordingLink?: string;
  /** Optional: Instance-specific reference links */
  reference?: ReferenceLink[];
  /** Optional: Mark this occurrence as cancelled */
  isCancelled?: boolean;
  /** Optional: Reschedule this occurrence to a new date (e.g., "2/18/2026") */
  rescheduledTo?: string;
  /** Optional: Override start time for rescheduled occurrence */
  rescheduledStartTime?: TimeOfDay;
  /** Optional: Override end time for rescheduled occurrence */
  rescheduledEndTime?: TimeOfDay;
  /** Optional: Override title for this specific instance */
  title?: string;
}
/**
 * Defines the structure of a single event as it appears in the raw data.
 */
export interface Event {
  id: string;
  title: string;
  firstOccurrence: string; // e.g., "1/7/2026" - marks the start of the recurrence series or the date of a one-time event
  description: string; // Default description for all instances
  location: string;
  meetingLink: string; // Make required to match your JSON (can be empty string)
  playlistLink: string; // Make required to match your JSON (can be empty string)
  startTime: TimeOfDay;
  endTime: TimeOfDay;
  timezone: string; // e.g., "ET", "PST"
  registrationRequired: boolean;
  registrationLink: string; // Make required to match your JSON (can be empty string)
  reference?: ReferenceLink[]; // Optional top-level reference links for the event/series
  audience: string[]; // e.g., ["CSPs", "Assessors", "Government Agencies"]
  tag: string; // Make required to match your JSON (can be empty string)
  tagColor: string; // Make required to match your JSON (can be empty string)
  recurring: {
    isRecurring: boolean;
    frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    weekOfMonth?: 'first' | 'second' | 'third' | 'fourth' | 'last';
    dayOfWeek?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
    endDate?: string; // e.g., "12/31/2026"
    cadenceDescription?: string; // This stays here in the recurring object
  };
  /**
   * Array of all instances (past, present, and future) with optional overrides
   * If an instance date is not in this array but should exist based on the recurring pattern,
   * it will be generated with default values
   */
  instances: EventInstance[];
}
/**
 * Extends the base Event type with properties calculated during processing
 * Can represent either a single event or an individual occurrence of a recurring event
 */
export interface FilteredEvent extends Event {
  /**
   * The date string of the specific occurrence to display or use for calendar actions (e.g., "1/7/2026").
   */
  displayOccurrenceDate: string;
  /**
   * A boolean flag indicating whether this event (or its next occurrence) is in the future.
   */
  isUpcoming: boolean;
  /**
   * Derived field: The full start datetime string for the event occurrence,
   * combining `displayOccurrenceDate`, `startTime`, and `timezone`.
   * This is typically in ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ss-HH:mm")
   * and is useful for calendar integrations like ICS files.
   * Note: Precise timezone resolution (e.g., handling DST) will be done during implementation.
   */
  startDatetime: string;
  /**
   * Derived field: The full end datetime string for the event occurrence,
   * combining `displayOccurrenceDate`, `endTime`, and `timezone`.
   * This is typically in ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ss-HH:mm")
   * and is useful for calendar integrations like ICS files.
   * Note: Precise timezone resolution (e.g., handling DST) will be done during implementation.
   */
  endDatetime: string;
  // OCCURRENCE-SPECIFIC PROPERTIES (optional, only present for individual occurrences)
  /**
   * Unique ID for this specific occurrence (different from the parent event ID)
   * Only present when this represents an individual occurrence
   */
  occurrenceId?: string;
  /**
   * Reference to the parent event ID (same as Event.id for the original event)
   * Only present when this represents an individual occurrence
   */
  parentEventId?: string;
  /**
   * The specific date for this occurrence (e.g., "1/7/2026")
   * Same as displayOccurrenceDate but clearer naming for occurrences
   */
  occurrenceDate?: string;
  /**
   * Whether this occurrence is in the past
   * Same as !isUpcoming but clearer naming for occurrences
   */
  isPast?: boolean;
  /**
   * Occurrence-specific description (overrides base description if present)
   */
  occurrenceDescription?: string;
  /**
   * Occurrence-specific recording link (overrides base playlistLink if present)
   */
  occurrenceRecordingLink?: string;
  /**
   * Occurrence-specific reference links (in addition to or instead of base reference links)
   */
  occurrenceReference?: ReferenceLink[];
  /**
   * The sequential number of this occurrence (1st, 2nd, 3rd, etc.)
   */
  occurrenceNumber?: number;
  /**
   * Whether this is the immediate "next" occurrence for recurring events
   */
  isNextOccurrence?: boolean;
  /**
   * Whether this occurrence is cancelled
   */
  occurrenceCancelled?: boolean;
  /**
   * For rescheduled occurrences, stores the original date before rescheduling
   */
  originalOccurrenceDate?: string;
  /**
   * Whether this occurrence has been rescheduled to a different date
   */
  occurrenceRescheduled?: boolean;
  /**
   * Occurrence-specific title (overrides base title if present)
   */
  occurrenceTitle?: string;
}

// This interface defines the structure of the data returned by +layout.server.ts
// It contains all occurrences, regardless of upcoming/past, and static filter options.
export interface ServerEventsLayoutData {
  allOccurrences: FilteredEvent[]; // All individual event occurrences (expanded at build time)
  filters: {
    audiences: string[]; // Possible audience filters (derived from all occurrences)
    locations: string[]; // Possible location filters (derived from all occurrences)
  };
  sortOptions: Array<{ value: string; label: string }>; // Sorting configurations
  enhancedFilters: {
    audiences: string[];
    locations: string[];
    parentEvents: Array<{ value: string; label: string }>; // Filter by original event series
  };
}

// This interface defines the full data structure managed by the Svelte store.
// It includes server-provided data AND client-side derived upcoming/previous lists.
export interface ClientEventsData extends ServerEventsLayoutData {
  upcomingEvents: FilteredEvent[]; // Dynamically calculated client-side
  previousEvents: FilteredEvent[]; // Dynamically calculated client-side
}
