<!-- routes/(pages)/+page.svelte -->
<script lang="ts">
  import { resolve } from '$lib/utils/paths';
  import ChangelogCard from '$lib/components/ChangelogCard.svelte';
  import { DateTime } from 'luxon';
  import { processEventsData } from '$lib/utils/eventProcessor';
  type PageData = any;
  import EventsWidget from '$lib/components/EventsWidget.svelte';
  import USAButtonLink from '$lib/components/USAButtonLink.svelte';

  let { data, copy }: { data: PageData; copy: Record<string,string> } = $props();

  // CLIENT-SIDE: Current time for dynamic calculation
  let currentTime = $state(DateTime.fromISO('2026-09-27T12:00:00-04:00'));

  // Update time periodically
  $effect(() => {
    const interval = setInterval(() => {
      currentTime = DateTime.fromISO('2026-09-27T12:00:00-04:00');
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  });

  // Process events data reactively
  const processedEvents = $derived.by(() => {
    if (data?.allEventOccurrences) {
      return processEventsData(data.allEventOccurrences, currentTime);
    }
    return { upcomingEvents: [], pastEvents: [] }; // or suitable default
  });

  const nextThreeEvents = $derived(processedEvents.upcomingEvents.slice(0, 3));
</script>

<svelte:head>
  <title>FedRAMP | FedRAMP.gov</title>
</svelte:head>

<main id="main-content" class="grid-container-desktop-lg usa-prose">
  <section class="usa-section">
    <div class="custom-grid">
      <div class="content-left">
        <h2 class="changelog-hero">{copy.updatesHeading}</h2>
        <ChangelogCard />
        <USAButtonLink
          href={resolve('/(pages)/(updates)/changelog')}
          class="usa-button margin-top-2"
          bgColor="#6469AC"
          bgColorVisited="#595E9E"
          bgColorHover="#4A4F8A">{copy.changelogCta}</USAButtonLink
        >
      </div>
      <div class="divider-col">
        <div class="divider-container"></div>
      </div>
      <div class="content-right">
        <EventsWidget events={nextThreeEvents} />
        <USAButtonLink href={resolve('/(pages)/(updates)/events')} class="margin-top-2">{copy.eventsCta}</USAButtonLink>
      </div>
    </div>
  </section>
</main>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;
  .content-left, .content-right { min-width: 0; overflow-wrap: anywhere; }
  main :global(.usa-button) { margin-right: 0; max-width: 100%; white-space: normal; }

  .custom-grid {
    display: grid;
    grid-template-columns: 1fr;

    @media screen and (min-width: 64em) {
      grid-template-columns: 55fr 5fr 40fr; // about 55% 5% 40%
    }
  }

  .divider-col {
    display: none;

    @media screen and (min-width: 64em) {
      display: block;
      margin-top: 3.5rem;
      margin-bottom: 3rem;
      position: relative;
    }
  }

  .divider-container {
    content: '';
    position: absolute;
    left: 50%;
    top: 3.2%;
    bottom: 0.6%;
    width: 2px;
    background: #878feb;
  }

  .changelog-hero {
    margin: 0 0 30px;
  }

  .content-right {
    @media screen and (min-width: 64em) {
      margin-top: calc(58px + 30px); // 78px total offset
    }
  }

  .table-dark {
    color: white;
    background-color: uswds.color('primary-darker');
  }

  .usa-prose {
    table {
      color: white !important;
      margin: 2rem 0;
      background-color: uswds.color('primary-darker') !important;
    }
    td {
      color: white !important;
      background-color: uswds.color('primary-darker') !important;
      padding: 1rem;
    }
    th {
      color: white !important;
      background-color: uswds.color('primary-darker') !important;
      color: white !important;
      padding: 1rem;
    }
    tr {
      color: white !important;
      background-color: uswds.color('primary-darker') !important;
    }
    tbody {
      color: white !important;
      background-color: uswds.color('primary-darker') !important;
    }
  }

  // mobile responsiveness
  @media (max-width: #{uswds.units('desktop') - 0.01rem}) {
    .content-right {
      padding: 5rem 5.25rem 0 5.25rem;
    }
  }

  @media (max-width: #{uswds.units('tablet') - 0.01rem}) {
    .content-right {
      padding: 3.125rem 0 0;
    }
  }
</style>
