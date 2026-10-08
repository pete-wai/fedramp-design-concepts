<!-- lib/components/ChangelogCard.svelte -->
<script lang="ts">
  import type { Entry } from '$lib/types/changelog'; // Import the Entry type
  import { getOverview, formatDate } from '$lib/utils/changelog'; // Import getDetails
  import * as data from '$lib/data/changelog/data.json'; // Import the data
  import { resolve } from '$lib/utils/paths';

  const cardDetails = getOverview(data);

  const entries: Entry[] = data.entries.slice(0, 3).map((entry, index) => ({
    id: entry.id,
    date: cardDetails[0][index],
    details: cardDetails[1][index],
    tag: cardDetails[2][index],
    links: entry.links
  }));
</script>

<div class="changelog-items">
  <h3 class="changelog-header">Latest Updates and Changelog</h3>
  {#each entries as entry (entry.id)}
    <div class="changelog-entry">
      <div class="header-container">
        <p class="date"><b>{formatDate(entry.date)}</b></p>
        {#if entry.tag}
          <span class="tag">{entry.tag}</span>
        {/if}
      </div>
      <h4 class="description">{entry.details}</h4>
      {#if entry.links && entry.links.length > 0}
        <ul class="links-container">
          {#each entry.links as link (link)}
            <li><a href={(resolve as (path: string) => string)(link.link ?? '/')}>{link.name}</a></li>
          {/each}
        </ul>
      {/if}
    </div>
  {/each}
</div>

<style lang="scss">
  .changelog-header {
    margin: 0;
  }

  .changelog-entry {
    border-bottom: 2px solid rgba(120, 104, 147, 0.65);
    padding: 0 15px;
  }

  .changelog-items {
    border: 1px solid #878feb;
    padding: 17px 30px 15px;
  }

  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .date {
    color: white;
    font-size: 0.875rem;
    font-weight: 100;
    margin: 15px 0 0 0;
  }

  .tag {
    color: #878feb;
    border: 1px solid #878feb;
    padding: 0.05rem 0.5rem;
    border-radius: 7px;
    font-size: 0.9rem;
    background-color: rgba(135, 143, 235, 0.2);
  }

  .description {
    color: white;
    font-size: 1.125rem;
    font-weight: 400;
    margin: 5px 0;
    padding: 0 0 0.25rem 0;
  }

  .links-container {
    padding: 0 0 15px 15px; // Combined padding
    margin: 0 0 0 15px; // Just left margin for extra spacing
    font-size: 1rem;
    font-weight: 400;

    li {
      display: list-item;
      list-style: disc;
      color: #f5b755;
      margin-bottom: 0.1rem;

      a {
        color: #f5b755;
      }
    }
  }
</style>
