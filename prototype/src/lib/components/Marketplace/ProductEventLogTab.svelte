<!-- lib/components/Marketplace/ProductEventLogTab.svelte -->
<script lang="ts">
  import type { ProductEventLogEntry } from '$lib/types/marketplace';
  import { formatMarketplaceDate } from '$lib/utils/dateUtils';

  // Chronological certification history for a CSP. Renders dated program actions
  // (certification milestones, phase changes, status changes, Corrective Action
  // Plan updates, remediation progress, etc.) newest-first.
  export let events: ProductEventLogEntry[] = [];

  // Sort newest-first; entries without a parseable date fall to the bottom.
  $: sortedEvents = [...events].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : -Infinity;
    const bTime = b.date ? new Date(b.date).getTime() : -Infinity;
    return bTime - aTime;
  });

  function formatDate(date: Date | string | null): string {
    if (!date) return 'Date unknown';
    return formatMarketplaceDate(
      date,
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      },
      'Date unknown'
    );
  }

  // Map an event category to a colorway so users can scan the timeline quickly.
  function categoryClass(category: string): string {
    switch (category) {
      case 'Certification Milestone':
        return 'event-log__marker--milestone';
      case 'Corrective Action Plan':
      case 'Remediation Progress':
        return 'event-log__marker--remediation';
      case 'Status Change':
      case 'Phase Change':
        return 'event-log__marker--change';
      default:
        return 'event-log__marker--other';
    }
  }
</script>

<div id="product-event-log-tab" role="region" aria-label="Certification History">
  <h3 id="event-log-label">Certification History</h3>
  <p>
    A chronological record of significant FedRAMP program actions for this Cloud Service Offering, including certification milestones, phase and
    status changes, and Corrective Action Plan updates.
  </p>

  {#if sortedEvents.length}
    <ol class="event-log">
      {#each sortedEvents as event, i (i)}
        <li class="event-log__item">
          <span class="event-log__marker {categoryClass(event.category)}" aria-hidden="true"></span>
          <div class="event-log__content">
            <div class="event-log__meta">
              <span class="event-log__date">{formatDate(event.date)}</span>
              <span class="event-log__category">{event.category}</span>
            </div>
            <p class="event-log__description margin-0">{event.description}</p>
          </div>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="text-center"><i>No certification history is available for this offering yet.</i></p>
  {/if}
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .event-log {
    list-style: none;
    margin: uswds.units(2) 0 0 0;
    padding: 0;
  }

  .event-log__item {
    position: relative;
    display: flex;
    gap: uswds.units(2);
    padding-bottom: uswds.units(3);

    // Vertical connector line between markers.
    &:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 1.25rem;
      bottom: 0;
      width: 2px;
      background-color: uswds.color('gray-20');
    }
  }

  .event-log__marker {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 0.25rem;
    border-radius: 50%;
    border: 2px solid;
    z-index: 1;

    &--milestone {
      background-color: #ecf3ec;
      border-color: #216e1f;
    }

    &--remediation {
      background-color: #faf3d1;
      border-color: #936f38;
    }

    &--change {
      background-color: #e7f6f8;
      border-color: #2e6276;
    }

    &--other {
      background-color: uswds.color('gray-5');
      border-color: uswds.color('gray-40');
    }
  }

  .event-log__content {
    display: flex;
    flex-direction: column;
    gap: uswds.units(0.5);
  }

  .event-log__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: uswds.units(1);
  }

  .event-log__date {
    font-weight: uswds.font-weight('bold');
    color: uswds.color('ink');
  }

  .event-log__category {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.1rem 0.5rem;
    border-radius: 0.25rem;
    background-color: uswds.color('gray-5');
    color: uswds.color('gray-70');
  }

  .event-log__description {
    color: uswds.color('ink');
  }
</style>
