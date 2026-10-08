<!-- lib/components/Marketplace/ConMonInfo.svelte -->
<script lang="ts">
  // TODO: This component can be refactored to a generic date pill
  // TODO: Support localized browser timezone? (e.g. Pacific Time, Mountain Time, Central Time, etc.)
  // TODO: Unused as of 2025-12-03
  export let conMonMeetingDate: Date = new Date(0);

  // Helper functions
  function formatFullDate(date: Date): string {
    return (
      date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }) + ' ET'
    ); // Eastern Time b/c that is where federal gov't is based
  }
  function formatConMonTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) + 'ET'; // Assuming ET for now
  }
  function formatConMonDateMonth(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short' });
  }
  function formatConMonDateDay(date: Date): string {
    return date.toLocaleDateString('en-US', { day: 'numeric' });
  }
</script>

<div id="conmon-info">
  <span class="usa-sr-only">{formatFullDate(conMonMeetingDate)}</span>
  <div class="display-flex flex-align-center padding-x-2 padding-y-1 radius-lg bg-base-lightest">
    <div id="conmon-meeting-date-container" class="display-flex flex-column margin-right-1">
      <div id="conmon-meeting-month">{formatConMonDateMonth(conMonMeetingDate)}</div>
      <div id="conmon-meeting-day">{formatConMonDateDay(conMonMeetingDate)}</div>
    </div>
    <div class="display-flex flex-column">
      <span id="conmon-meeting-label" class="text-bold">ConMon Meeting</span>
      <span id="conmon-meeting-time">{formatConMonTime(conMonMeetingDate)}</span>
    </div>
  </div>
</div>

<style lang="scss">
  #conmon-info {
    flex-shrink: 0; /* Prevent conmon box from shrinking too much */
  }
  #conmon-meeting-label {
    color: #1b1b1b;
    font-size: 1.25rem;
    letter-spacing: 0.01em;
  }
  #conmon-meeting-date-container {
    width: 3rem;
    height: 3rem;
    background-color: #531c40;
    border-radius: var(--usa-radius-pill);
    color: white;
  }
  #conmon-meeting-time {
    color: #1b1b1b;
    font-size: 1.125rem;
    letter-spacing: 0.01em;
  }
</style>
