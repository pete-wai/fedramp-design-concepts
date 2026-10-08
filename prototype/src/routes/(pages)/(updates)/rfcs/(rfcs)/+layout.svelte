<script lang="ts">
  import ColorfulBlockquote from '$lib/components/ColorfulBlockquote.svelte';
  import { asset } from '$lib/utils/paths';
  const IS_SHUTDOWN = import.meta.env.VITE_IS_SHUTDOWN === 'true';
  const SHUTDOWN_DATE = new Date(import.meta.env.VITE_SHUTDOWN_DATE);

  let { data, children } = $props();

  // Check if the current RFC is closed based on the close date
  let isRfcClosed = $derived(() => {
    const metadata = data?.metadata || {};
    if (!metadata.closeDate) return false;
    const currentDate = new Date();
    const closeDate = new Date(metadata.closeDate);
    // Add 36 hours to match the logic in the main +page.ts
    const adjustedCloseDate = new Date(closeDate.getTime() + 36 * 60 * 60 * 1000);
    // If shutdown, use a shutdown date to freeze the status, otherwise use current date
    const dateToCheck = IS_SHUTDOWN ? SHUTDOWN_DATE : currentDate;
    return dateToCheck > adjustedCloseDate;
  });

  // Format the close date for display
  let formattedCloseDate = $derived(() => {
    if (!data?.metadata?.closeDate) return '';
    return new Date(data.metadata.closeDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  });

  // Format the open date for display
  let formattedOpenDate = $derived(() => {
    if (!data?.metadata?.startDate) return '';
    return new Date(data.metadata.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  });

  // Create the markdown text for the blockquote
  let closedMessage = $derived(() => {
    const md = data?.metadata || {};
    const base = md.githubUrl
      ? `**This RFC is now closed.**\nThe comment period for this Request for Comments ended on ${formattedCloseDate()}. You can find the closed discussions [here](${md.githubUrl}).\n\nNone of the statements or requirements in this RFC should be applied or used by any cloud service provider or agency. Do not reference or implement any aspect of this content. This content is retained or historical reference only.`
      : `**This RFC is now closed.**\nThe comment period for this Request for Comments ended on ${formattedCloseDate()}.\n\nNone of the statements or requirements in this RFC should be applied or used by any cloud service provider or agency. Do not reference or implement any aspect of this content. This content is retained or historical reference only.`;

    if (md.outcome) {
      let outcomeText = `\n\n### Outcome\n${md.outcome}`;
      if (md.outcome_link) outcomeText += ` [More information](${md.outcome_link})`;
      return outcomeText + '\n\n---\n\n' + base;
    }

    return base;
  });

  let openMessage = $derived(() => {
    if (data.metadata.githubUrl) {
      return `**This RFC is open.**\nThe comment period for this Request for Comments started on ${formattedOpenDate()}. You can comment in the [GitHub RFC thread here](${data?.metadata.githubUrl}) (preferred) or using [this form](${data?.metadata.formUrl}).`;
    } else {
      return `**This RFC is currently open.**\nThe comment period for this Request for Comments started on ${formattedOpenDate()}.`;
    }
  });

  let rfcList = $derived(() => {
    if (data.metadata) {
      if (!isRfcClosed()) {
        return `- **Status:** Open\n- **Start Date:** ${formattedOpenDate()}\n- **Closing Date:** ${formattedCloseDate()}`;
      } else {
        return `- **Status:** Closed\n- **Start Date:** ${formattedOpenDate()}\n- **Closed:** ${formattedCloseDate()}`;
      }
    }
  });
</script>

{#if isRfcClosed()}
  <ColorfulBlockquote color="#D7632A4D" text={closedMessage()} />
{:else}
  <!-- Change this color later -->
  <ColorfulBlockquote color="#e7f3ff" text={openMessage()} />
{/if}

<h1>{data.metadata.title}</h1>

<ColorfulBlockquote color="#ffffff" text={rfcList()} />

{#if data.metadata.videos && data.metadata.videos.length > 0}
  <h2>Leadership RFC discussion</h2>
  <div class="video-buttons">
    {#each data.metadata.videos as video (video.link)}
      <button class="usa-button usa-button--dark-outline video-button-spacing" onclick={() => window.open(video.link, '_blank')}>
        <svg class="usa-icon" aria-hidden="true">
          <use href={asset('/uswds/img/sprite.svg#youtube')}></use>
        </svg>
        {video.title}
      </button>
    {/each}
  </div>
{/if}

{@render children()}

<style>
  .video-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem; /* Add some space between the heading and the buttons */
    margin-bottom: 1rem; /* Add some space between the buttons and the next section */
  }

  /* Add spacing to the buttons */
  .video-button-spacing {
    margin-bottom: 1rem;
  }
</style>
