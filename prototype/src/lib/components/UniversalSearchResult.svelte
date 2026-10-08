<!-- lib/components/UniversalSearchResult.svelte -->
<script lang="ts" generics="T">
  import { highlightSearchTerms } from '$lib/utils/universalSearch';
  import { asset } from '$lib/utils/paths';

  // Define props
  let {
    item,
    searchTerm = '',
    template = 'default',
    onaction,
    // Snippets for custom content - same as MarketplaceSearchResult
    content,
    details,
    actions,
    header,
    body,
    footer,
    list,
    custom
  }: {
    item: T;
    searchTerm?: string;
    template?: 'default' | 'card' | 'list' | 'custom';
    onaction?: (action: string, item: T) => void;
    // Snippet props with proper typing
    content?: (props: { item: T; searchTerm: string; highlight: typeof highlightSearchTerms; displayValue: typeof getDisplayValue }) => any;
    details?: (props: { item: T; displayValue: typeof getDisplayValue }) => any;
    actions?: (props: { item: T; onaction?: (action: string, item: T) => void }) => any;
    header?: (props: { item: T; searchTerm: string; highlight: typeof highlightSearchTerms; displayValue: typeof getDisplayValue }) => any;
    body?: (props: { item: T; searchTerm: string; highlight: typeof highlightSearchTerms; displayValue: typeof getDisplayValue }) => any;
    footer?: (props: { item: T; onaction?: (action: string, item: T) => void }) => any;
    list?: (props: { item: T; searchTerm: string; highlight: typeof highlightSearchTerms; displayValue: typeof getDisplayValue }) => any;
    custom?: (props: {
      item: T;
      searchTerm: string;
      highlight: typeof highlightSearchTerms;
      onaction?: (action: string, item: T) => void;
      displayValue: typeof getDisplayValue;
    }) => any;
  } = $props();

  // Generic display helper
  function getDisplayValue(value: any): string {
    if (value == null) return '';
    if (Array.isArray(value)) {
      return value.filter((v) => v != null).join(', ');
    }
    return String(value);
  }

  // Helper to safely get item property with fallback
  function getItemProperty(item: any, property: string, fallback: any = null): any {
    return item?.[property] ?? fallback;
  }

  // Smart property detection - tries common field names
  function getSmartProperty(item: any, ...properties: string[]): any {
    for (const prop of properties) {
      const value = getItemProperty(item, prop);
      if (value != null && value !== '') {
        return value;
      }
    }
    return null;
  }

  // Derived smart properties
  const itemTitle = $derived(getSmartProperty(item, 'title', 'name', 'heading') || 'Untitled');
  const itemDescription = $derived(getSmartProperty(item, 'description', 'summary', 'content', 'body'));
  const itemDate = $derived(getSmartProperty(item, 'date', 'created', 'updated', 'timestamp'));
  const itemTags = $derived(getSmartProperty(item, 'tags', 'categories', 'labels'));
  const itemUrl = $derived(getSmartProperty(item, 'url', 'link', 'href', 'filename'));

  // Format date nicely
  function formatDate(dateValue: any): string {
    if (!dateValue) return '';
    try {
      return new Date(dateValue).toLocaleDateString();
    } catch {
      return String(dateValue);
    }
  }
</script>

{#if template === 'default'}
  <!-- Default template - similar to MarketplaceSearchResult -->
  <div class="search-result">
    <div class="result-content">
      {#if content}
        {@render content({ item, searchTerm, highlight: highlightSearchTerms, displayValue: getDisplayValue })}
      {:else}
        <!-- Smart default content -->
        <div class="result-body">
          {#if itemDate}
            <div class="result-date">{formatDate(itemDate)}</div>
          {/if}

          <h3 class="result-title">
            {@html highlightSearchTerms(getDisplayValue(itemTitle), searchTerm)}
          </h3>

          {#if itemDescription}
            <p class="result-description">
              {@html highlightSearchTerms(getDisplayValue(itemDescription), searchTerm)}
            </p>
          {/if}

          {#if itemTags && Array.isArray(itemTags) && itemTags.length > 0}
            <div class="tags">
              {#each itemTags as tag (tag)}
                <span class="tag">{@html highlightSearchTerms(String(tag), searchTerm)}</span>
              {/each}
            </div>
          {/if}

          <div class="result-details">
            {#if details}
              {@render details({ item, displayValue: getDisplayValue })}
            {:else}
              <!-- Auto-generate metadata from item properties -->
              <div class="metadata">
                {#each Object.entries(item || {}) as [key, value] (key)}
                  {#if !['id', 'title', 'name', 'description', 'summary', 'tags', 'date', 'url', 'filename', 'link'].includes(key) && value != null && value !== ''}
                    <span class="meta-item">
                      <strong
                        >{key
                          .replace(/_/g, ' ')
                          .replace(/([A-Z])/g, ' $1')
                          .trim()}:</strong
                      >
                      {@html highlightSearchTerms(getDisplayValue(value), searchTerm)}
                    </span>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <div class="result-actions">
      {#if actions}
        {@render actions({ item, onaction })}
      {:else}
        <!-- Smart default actions -->
        {#if itemUrl}
          {#if String(itemUrl).startsWith('http')}
            <a href={String(itemUrl)} class="usa-button" target="_blank" rel="noopener noreferrer"> View Resource </a>
          {:else if String(itemUrl).includes('.')}
            <!-- Looks like a file -->
            <a href={asset(`/resources/${itemUrl}`)} class="usa-button" download>
              Download {String(itemUrl).split('.').pop()?.toUpperCase() ?? 'File'}
            </a>
          {:else}
            <button class="usa-button" onclick={() => onaction?.('view', item)}> View Details </button>
          {/if}
        {:else}
          <button class="usa-button usa-button--outline" onclick={() => onaction?.('view', item)}> View Details </button>
        {/if}
      {/if}
    </div>
  </div>
{:else if template === 'card'}
  <!-- Card template -->
  <div class="usa-card">
    <div class="usa-card__container">
      <div class="usa-card__header">
        {#if header}
          {@render header({ item, searchTerm, highlight: highlightSearchTerms, displayValue: getDisplayValue })}
        {:else}
          {#if itemDate}
            <div class="card-date">{formatDate(itemDate)}</div>
          {/if}
          <h3 class="usa-card__heading">
            {@html highlightSearchTerms(getDisplayValue(itemTitle), searchTerm)}
          </h3>
        {/if}
      </div>

      <div class="usa-card__body">
        {#if body}
          {@render body({ item, searchTerm, highlight: highlightSearchTerms, displayValue: getDisplayValue })}
        {:else}
          {#if itemDescription}
            <p>{@html highlightSearchTerms(getDisplayValue(itemDescription), searchTerm)}</p>
          {/if}

          {#if itemTags && Array.isArray(itemTags) && itemTags.length > 0}
            <div class="tags">
              {#each itemTags as tag (tag)}
                <span class="tag">{@html highlightSearchTerms(String(tag), searchTerm)}</span>
              {/each}
            </div>
          {/if}
        {/if}
      </div>

      <div class="usa-card__footer">
        {#if footer}
          {@render footer({ item, onaction })}
        {:else if itemUrl}
          {#if String(itemUrl).startsWith('http')}
            <a href={String(itemUrl)} class="usa-button" target="_blank" rel="noopener noreferrer"> View Resource </a>
          {:else}
            <button class="usa-button" onclick={() => onaction?.('select', item)}> Select </button>
          {/if}
        {:else}
          <button class="usa-button" onclick={() => onaction?.('select', item)}> Select </button>
        {/if}
      </div>
    </div>
  </div>
{:else if template === 'list'}
  <!-- List template -->
  <div class="list-item">
    {#if list}
      {@render list({ item, searchTerm, highlight: highlightSearchTerms, displayValue: getDisplayValue })}
    {:else}
      <div class="list-item-content">
        <div class="list-item-header">
          <span class="list-item-title">
            {@html highlightSearchTerms(getDisplayValue(itemTitle), searchTerm)}
          </span>
          {#if itemDate}
            <span class="list-item-date">{formatDate(itemDate)}</span>
          {/if}
        </div>

        {#if itemDescription}
          <span class="list-item-description">
            {@html highlightSearchTerms(getDisplayValue(itemDescription), searchTerm)}
          </span>
        {/if}

        {#if itemTags && Array.isArray(itemTags) && itemTags.length > 0}
          <div class="list-item-tags">
            {#each itemTags.slice(0, 3) as tag (tag)}
              <span class="tag tag--small">{String(tag)}</span>
            {/each}
            {#if itemTags.length > 3}
              <span class="tag tag--small tag--more">+{itemTags.length - 3} more</span>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{:else if template === 'custom'}
  <!-- Fully custom template -->
  {#if custom}
    {@render custom({ item, searchTerm, highlight: highlightSearchTerms, onaction, displayValue: getDisplayValue })}
  {:else}
    <div class="custom-placeholder">No custom template provided</div>
  {/if}
{/if}

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .search-result {
    background: uswds.color('gray-5');
    border: 1px solid uswds.color('gray-30');
    border-radius: 0.25rem;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 1rem;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-color: uswds.color('gray-40');
    }
  }

  .result-content {
    flex: 1;
    min-width: 0;
  }

  .result-date,
  .card-date {
    font-size: 0.875rem;
    color: uswds.color('gray-60');
    margin-bottom: 0.5rem;
  }

  .result-title {
    margin: 0 0 0.75rem 0;
    font-size: 1.25rem;
    color: uswds.color('primary-darker');
    word-wrap: break-word;
  }

  .result-description {
    margin-bottom: 1rem;
    color: uswds.color('gray-90');
    line-height: 1.5;
  }

  .tags {
    margin: 1rem 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    background: white;
    color: uswds.color('gray-60');
    border: 1px solid uswds.color('gray-50');
    border-radius: 0.25rem;
    padding: 0.2rem 0.6rem;
    font-size: 0.875rem;

    &--small {
      font-size: 0.75rem;
      padding: 0.1rem 0.4rem;
    }

    &--more {
      background: uswds.color('gray-10');
      color: uswds.color('gray-70');
    }
  }

  .metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
  }

  .meta-item {
    font-size: 0.875rem;
    color: uswds.color('gray-80');

    strong {
      color: uswds.color('gray-90');
      text-transform: capitalize;
    }
  }

  .result-actions {
    flex-shrink: 0;
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }

  // List template styles
  .list-item {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid uswds.color('gray-30');
    transition: background-color 0.2s ease;

    &:hover {
      background-color: uswds.color('gray-5');
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .list-item-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .list-item-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
  }

  .list-item-title {
    font-weight: 600;
    color: uswds.color('primary-darker');
    flex: 1;
  }

  .list-item-date {
    font-size: 0.875rem;
    color: uswds.color('gray-60');
    flex-shrink: 0;
  }

  .list-item-description {
    font-size: 0.875rem;
    color: uswds.color('gray-70');
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .list-item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  // Custom template placeholder
  .custom-placeholder {
    padding: 2rem;
    text-align: center;
    color: uswds.color('gray-50');
    background-color: uswds.color('gray-5');
    border: 1px dashed uswds.color('gray-30');
    border-radius: 0.25rem;
  }

  // Highlight styles
  :global(mark) {
    background-color: uswds.color('yellow-20');
    padding: 0.1em 0.2em;
    border-radius: 0.125rem;
    font-weight: 500;
  }

  // Card overrides for consistent styling
  .usa-card {
    border-color: uswds.color('gray-30');
    background-color: #f5f5f5; // Match DocumentSearchResult styling

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .usa-card__heading {
    color: uswds.color('primary-darker');
    margin-bottom: 0.5rem;
  }

  // Button styling - match DocumentSearchResult
  a.usa-button {
    color: white;
    border: none;
    background-color: uswds.color('violet-70');

    &:visited,
    &:hover {
      color: white;
      background-color: uswds.color('violet-80');
      text-decoration: none;
    }
  }

  // Responsive styles
  @media (max-width: uswds.units('tablet')) {
    .search-result {
      flex-direction: column;
      gap: 1rem;
    }

    .result-actions {
      width: 100%;

      :global(.usa-button) {
        width: 100%;
        justify-content: center;
      }
    }

    .list-item-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .metadata {
      flex-direction: column;
      gap: 0.5rem;
    }

    .tags {
      gap: 0.25rem;
    }
  }

  @media (max-width: uswds.units('mobile-lg')) {
    .search-result {
      padding: 1rem;
    }

    .list-item {
      padding: 0.75rem 1rem;
    }

    .result-title {
      font-size: 1.125rem;
    }
  }
</style>
