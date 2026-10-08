<!-- lib/components/UniversalFilters.svelte -->
<script lang="ts" generics="T">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { extractUniqueValues, isValidFilterValue } from '$lib/utils/universalSearch';
  import type { FilterConfig } from '$lib/utils/universalSearch';
  import Tooltip from '$lib/components/Tooltip.svelte';
  // Live announcement store span will be present on in UniversalSearch.svelte
  import { announce } from '$lib/utils/a11yAnnouncer';

  let {
    data = [] as T[],
    filterConfig = [] as FilterConfig<T>[],
    filters = {} as Record<string, any>,
    filterCounts = {},
    onchange,
    defaultOpen = false
  }: {
    data: T[];
    filterConfig: FilterConfig<T>[];
    filters: Record<string, any>;
    filterCounts?: Record<string, Record<string, number>>;
    onchange?: (filters: Record<string, any>) => void;
    defaultOpen?: boolean;
  } = $props();

  // Use regular state variable instead of derived
  let localFilters = $state({} as Record<string, any>);
  let isUpdating = $state(false);

  // Initialize and sync with parent filters
  $effect(() => {
    if (isUpdating) return; // Prevent loops during updates

    // Deep clone and ensure proper array handling for checkbox filters
    const clonedFilters = JSON.parse(JSON.stringify(filters));

    // Ensure checkbox filters are arrays
    filterConfig.forEach((config) => {
      if (config.type === 'checkbox' && clonedFilters[config.key]) {
        const value = clonedFilters[config.key];
        if (!Array.isArray(value)) {
          clonedFilters[config.key] = [value];
        }
      }
    });

    localFilters = clonedFilters;
  });

  // Get filter options dynamically
  function getFilterOptions(config: FilterConfig<T>): { value: string; label: string; tooltip?: string }[] {
    if (config.options) {
      if (typeof config.options === 'function') {
        return config.options(data);
      }
      return config.options;
    }
    // Generate options from data using utility function
    const values = extractUniqueValues(data, config.field);
    return values.map((v) => ({ value: v, label: v }));
  }

  // Track which sections have active filters
  const activeFilterCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    filterConfig.forEach((config) => {
      const filterValue = localFilters[config.key];
      if (isValidFilterValue(filterValue)) {
        if (Array.isArray(filterValue)) {
          counts[config.key] = filterValue.length;
        } else if (config.type === 'dateRange' && (localFilters[`${config.key}From`] || localFilters[`${config.key}To`])) {
          counts[config.key] = 1;
        } else {
          counts[config.key] = 1;
        }
      } else {
        counts[config.key] = 0;
      }
    });
    return counts;
  });

  // Helper to get an option's label for announcements
  function getOptionLabel(config: FilterConfig<T>, value: string): string {
    if (!value) return '';
    const options = getFilterOptions(config);
    return options.find((o) => o.value === value)?.label || value;
  }

  // E.g. "<Added/Removed <filter rule name> filter: <filter option name>"
  function generateCheckboxAnnouncement(config: FilterConfig<T>, optionValue: string, isChecked: boolean): string {
    const filterLabel = config.label;
    const optionLabel = getOptionLabel(config, optionValue);
    return `${isChecked ? 'Added' : 'Removed'} ${filterLabel} filter: ${optionLabel}.`;
  }

  // E.g. "Set <filter rule name> filter to <filter option name>"
  function generateSelectAnnouncement(config: FilterConfig<T>, newFilterValue: string): string {
    const filterLabel = config.label;
    if (newFilterValue) {
      const newOptionLabel = getOptionLabel(config, newFilterValue);
      return `Set ${filterLabel} filter to ${newOptionLabel}.`;
    } else {
      return `Cleared ${filterLabel} filter.`;
    }
  }

  // E.g. "Set <filter rule name> date filter from <start date> to <end date>"
  function generateDateRangeAnnouncement(
    config: FilterConfig<T>,
    oldFilters: Record<string, any>,
    newFilters: Record<string, any>,
    changedType: 'From' | 'To',
    changedValue: string
  ): string {
    const filterLabel = config.label;
    const fromKey = `${config.key}From`;
    const toKey = `${config.key}To`;
    const oldFrom = oldFilters[fromKey];
    const oldTo = oldFilters[toKey];
    const newFrom = newFilters[fromKey];
    const newTo = newFilters[toKey];

    // If both are now set, provide a combined message
    if (newFrom && newTo) {
      return `Set ${filterLabel} date filter from ${newFrom} to ${newTo}.`;
    }
    // If one is set and the other is not
    else if (newFrom && !newTo) {
      return `Set ${filterLabel} date filter from ${newFrom} to indefinite end date.`;
    } else if (!newFrom && newTo) {
      return `Set ${filterLabel} date filter from indefinite start date to ${newTo}.`;
    }
    // If the filter was completely cleared
    else if (!newFrom && !newTo && (oldFrom || oldTo)) {
      return `Cleared ${filterLabel} date filter.`;
    }
    // Announce individual part change if it's not a complete range or clear
    else {
      let message = `${filterLabel} date filter: `;
      if (changedType === 'From') {
        message += changedValue ? `From date set to ${changedValue}.` : `From date cleared.`;
      } else {
        // 'To'
        message += changedValue ? `To date set to ${changedValue}.` : `To date cleared.`;
      }
      return message;
    }
  }

  // Handle filter updates
  function updateFilter(key: string, value: string, checked: boolean | undefined) {
    const config = filterConfig.find((c) => c.key === key);
    if (!config) return;

    const newFilters = { ...localFilters };

    if (checked !== undefined) {
      // Checkbox handling
      if (!newFilters[key]) {
        newFilters[key] = [];
      } else if (!Array.isArray(newFilters[key])) {
        newFilters[key] = [newFilters[key]];
      }

      if (checked) {
        if (!newFilters[key].includes(value)) {
          newFilters[key] = [...newFilters[key], value];
        }
      } else {
        newFilters[key] = newFilters[key].filter((v: string) => v !== value);
      }

      if (newFilters[key].length === 0) {
        delete newFilters[key];
      }

      announce(generateCheckboxAnnouncement(config, value, checked));
    } else {
      // Other input types
      if (value) {
        newFilters[key] = value;
      } else {
        delete newFilters[key];
      }
      announce(generateSelectAnnouncement(config, value));
    }

    // Update local state and notify parent
    isUpdating = true;
    localFilters = newFilters;

    if (onchange) {
      onchange(newFilters);
    } else {
      console.error('🔴 No onchange handler!');
    }

    // Allow parent sync after a tick
    setTimeout(() => {
      isUpdating = false;
    }, 0);
  }

  // Handle date range updates
  function updateDateFilter(baseKey: string, type: 'From' | 'To', value: string) {
    // Capture current state for comparison
    const oldFiltersForAnnouncement = JSON.parse(JSON.stringify(localFilters));
    const config = filterConfig.find((c) => c.key === baseKey);
    if (!config) return;

    const key = `${baseKey}${type}`;
    const newFilters = { ...localFilters };

    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }

    // Update local state and notify parent
    isUpdating = true;
    localFilters = newFilters;

    announce(generateDateRangeAnnouncement(config, oldFiltersForAnnouncement, newFilters, type, value));
    onchange?.(newFilters);

    // Allow parent sync after a tick
    setTimeout(() => {
      isUpdating = false;
    }, 0);
  }

  let accordionElement: HTMLElement;

  // Initialize USWDS accordion
  onMount(() => {
    let accordionInstance: any;
    const initAccordion = async () => {
      if (browser && accordionElement) {
        const { default: accordion } = await import('@uswds/uswds/js/usa-accordion');
        accordionInstance = accordion;
        accordion.on(accordionElement);
      }
    };

    initAccordion();

    return () => {
      if (accordionInstance && accordionElement) {
        accordionInstance.off(accordionElement);
      }
    };
  });
</script>

<div class="universal-filters light-theme-section">
  <fieldset class="filters-fieldset">
    <legend class="usa-sr-only">Filter by:</legend>
    <div class="usa-accordion usa-accordion--bordered" data-allow-multiple bind:this={accordionElement}>
      {#each filterConfig as config (config.key)}
        {@const options = getFilterOptions(config)}
        {@const activeCount = activeFilterCounts[config.key] || 0}
        {#if options.length > 0 || config.type === 'dateRange'}
          <div class="usa-accordion__item" class:open={activeCount > 0 || defaultOpen}>
            <h4 class="usa-accordion__heading">
              <button
                class="usa-accordion__button"
                aria-expanded={activeCount > 0 || defaultOpen ? 'true' : 'false'}
                aria-controls="{config.key}-filter"
              >
                <span class="filter-label-container">
                  {config.label}
                  <!-- Remove tooltip from here - move it outside the button or make it non-interactive -->
                </span>
                {#if activeCount > 0}
                  <span class="filter-count" aria-label="{activeCount} selected filter rules in this category">({activeCount})</span>
                {/if}
              </button>
              <!-- Move tooltip outside the button -->
              {#if config.tooltip}
                <div class="filter-tooltip-wrapper">
                  <Tooltip text={config.tooltip} ariaLabel="More information about the {config.label} filter" position="right" />
                </div>
              {/if}
            </h4>
            <div id="{config.key}-filter" class="usa-accordion__content">
              <fieldset class="usa-fieldset">
                {#if config.type === 'checkbox'}
                  {@const selectedInCategory = Array.isArray(localFilters[config.key]) ? localFilters[config.key] : []}
                  {@const categoryHasSelection = selectedInCategory.length > 0}
                  {#each options as option (option.value)}
                    {@const count = filterCounts[config.key]?.[option.value]}
                    {@const isChecked = Array.isArray(localFilters[config.key])
                      ? localFilters[config.key]?.includes(option.value)
                      : localFilters[config.key] === option.value}
                    <!-- When the category has an active selection, an unselected
                         option's count is an additive delta ("+N"). A 0 count is
                         disabled and grayed out in both cases: an absolute 0 (no
                         matching items) and a "+0" delta (adds nothing new to the
                         current selection). Already-checked options stay
                         toggleable so users can always uncheck them. -->
                    {@const showAsDelta = categoryHasSelection && !isChecked}
                    {@const isDisabled = count === 0 && !isChecked}
                    <div class="usa-checkbox" class:disabled={isDisabled}>
                      <input
                        class="usa-checkbox__input"
                        id="{config.key}-{option.value}"
                        type="checkbox"
                        name={config.key}
                        value={option.value}
                        checked={isChecked}
                        disabled={isDisabled && !isChecked}
                        onchange={(e) => updateFilter(config.key, option.value, e.currentTarget.checked)}
                      />
                      <label class="usa-checkbox__label" for="{config.key}-{option.value}" class:disabled={isDisabled}>
                        <span class="label-text-container">
                          <span class="label-text">{option.label}</span>
                          <!-- Individual option tooltip -->
                          {#if option.tooltip}
                            <Tooltip text={option.tooltip} ariaLabel="More information about {option.label}" position="right" />
                          {/if}
                        </span>
                        {#if count !== undefined}
                          <span
                            class="option-count"
                            class:zero-count={count === 0}
                            aria-label={showAsDelta ? `${count} additional results if this filter is added` : `${count} results match this filter`}
                          >
                            ({showAsDelta ? `+${count}` : count})
                          </span>
                        {/if}
                      </label>
                    </div>
                  {/each}
                {:else if config.type === 'select'}
                  <select
                    class="usa-select"
                    id="{config.key}-select"
                    value={localFilters[config.key] || ''}
                    onchange={(e) => updateFilter(config.key, e.currentTarget.value, undefined)}
                  >
                    <option value="">All</option>
                    {#each options as option (option.value)}
                      <!-- Note: Tooltips in select options are limited by browser support -->
                      <option value={option.value} title={option.tooltip || undefined}>
                        {option.label}
                      </option>
                    {/each}
                  </select>
                  <!-- Optional: Show tooltip info below select for better accessibility -->
                  {#if options.some((opt) => opt.tooltip)}
                    <div class="select-tooltips">
                      {#each options.filter((opt) => opt.tooltip) as option (option.label)}
                        <div class="select-tooltip-item">
                          <strong>{option.label}:</strong>
                          {option.tooltip}
                        </div>
                      {/each}
                    </div>
                  {/if}
                {:else if config.type === 'dateRange'}
                  <div class="date-range-filters">
                    <div class="usa-form-group">
                      <label class="usa-label" for="{config.key}-from">From:</label>
                      <input
                        type="date"
                        id="{config.key}-from"
                        class="usa-input"
                        value={localFilters[`${config.key}From`] || ''}
                        onchange={(e) => updateDateFilter(config.key, 'From', e.currentTarget.value)}
                      />
                    </div>
                    <div class="usa-form-group">
                      <label class="usa-label" for="{config.key}-to">To:</label>
                      <input
                        type="date"
                        id="{config.key}-to"
                        class="usa-input"
                        value={localFilters[`${config.key}To`] || ''}
                        onchange={(e) => updateDateFilter(config.key, 'To', e.currentTarget.value)}
                      />
                    </div>
                  </div>
                {/if}
              </fieldset>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </fieldset>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .universal-filters {
    width: 100%;
  }

  .filters-fieldset {
    border: none;
    margin: 0;
    padding: 0;
  }

  /* Ensure fieldsets inside accordion content don't cause overflow */
  .usa-fieldset {
    margin: 0;
    padding: 0;

    legend {
      margin: 0;
      padding: 0;
    }
  }

  .usa-accordion__content {
    max-height: none;
    overflow-x: visible; // Prevent horizontal scroll
    overflow-y: visible;
    padding: 0.75rem;

    // Create a scrollable container that doesn't interfere with tooltips
    .filter-options-container {
      min-height: 0; // Allow shrinking

      // Only show scrollbar when content actually overflows
      &:not(:hover) {
        overflow: hidden;
      }
    }
  }

  /* When defaultOpen or active filters indicate open, ensure content is visible before JS initializes */
  .usa-accordion__item.open .usa-accordion__content {
    max-height: none;
  }

  /* Responsive adjustments for narrower layouts (like grid-col-3) 
  @media (max-width: 75em) {
    .usa-accordion__content {
      padding: 0.5rem;
      max-height: 280px;
    }
  }*/

  .usa-checkbox {
    position: relative;
    margin-bottom: 0.25rem;

    &:hover {
      z-index: 1000; // Bring hovered items above scroll container
    }
  }

  .usa-radio {
    margin-bottom: 0.5rem;
  }

  .usa-form-group {
    margin-bottom: 0.75rem;
    &:last-child {
      margin-bottom: 0;
    }
  }

  .date-range-filters {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .date-range-filters .usa-label {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }

  .date-range-filters .usa-input {
    font-size: 0.85rem;
    padding: 0.4rem 0.5rem;
  }

  .label-text-container {
    align-items: center;
    gap: 0.3rem;
    flex: 1;
    min-width: 0;

    :global(.tooltip-container) {
      // Ensure tooltip doesn't extend beyond reasonable bounds
      max-width: 200px;

      // Position tooltip to avoid edges
      &[data-position='left'] {
        transform: translateX(-10px); // Pull back slightly from edge
      }
    }
  }

  /* Responsive date inputs for narrow viewports */
  @media (max-width: 75em) {
    .date-range-filters {
      gap: 0.25rem;
    }
  }

  .range-filters {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-tooltip-wrapper {
    position: absolute;
    left: 4.5rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1000;
  }

  .usa-accordion__heading {
    position: relative;
  }

  .clear-range {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: uswds.color('primary');
    &:hover {
      text-decoration: underline;
    }
  }

  /* Scrollbar styling */
  .usa-accordion__content::-webkit-scrollbar {
    width: 8px;
  }

  .usa-accordion__content::-webkit-scrollbar-track {
    background: uswds.color('gray-5');
  }

  .usa-accordion__content::-webkit-scrollbar-thumb {
    background: uswds.color('gray-30');
    border-radius: 4px;
    &:hover {
      background: uswds.color('gray-40');
    }
  }

  /* Ensure accordion button text aligns properly */
  .usa-accordion__button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.6rem 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  @media (max-width: 75em) {
    .usa-accordion__button {
      padding: 0.5rem 0.4rem;
      font-size: 0.8rem;
    }
  }

  /* Custom styling for select elements */
  .usa-select {
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.85rem;
  }

  .usa-checkbox__label {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    cursor: pointer;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
    &.disabled {
      color: uswds.color('gray-50');
      cursor: not-allowed;
    }
    .label-text {
      flex: 1;
      min-width: 0;
      word-break: break-word;
    }
    .option-count {
      color: uswds.color('gray-50');
      font-weight: normal;
      font-size: 0.75rem;
      flex-shrink: 0;
      white-space: nowrap;
      &.zero-count {
        color: uswds.color('gray-30');
      }
    }
  }

  .light-theme-section {
    background-color: white;
    color: #1b1b1b;
    :global {
      .usa-accordion__content,
      .usa-checkbox__label,
      .usa-checkbox,
      .usa-label {
        background-color: white;
        color: #1b1b1b;
      }
      .usa-accordion__button {
        color: #1b1b1b;
        background-color: uswds.color('base-lightest');
      }
      .usa-checkbox__label::before {
        background-color: white;
        border: 1px solid #1b1b1b;
      }
    }
  }

  .usa-checkbox__input:disabled + .usa-checkbox__label {
    color: uswds.color('gray-50');
    cursor: not-allowed;
    &::before {
      border-color: uswds.color('gray-30');
      background-color: uswds.color('gray-5');
    }
  }

  // Update the filter-count for accordion headers
  .filter-count {
    color: uswds.color('primary-vivid');
    font-weight: bold;
    margin-left: 0.25rem;
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  .filter-label-container {
    display: flex;
    align-items: center; /* Vertically align label and tooltip */
    gap: 0.3rem; /* Adjust spacing between label and tooltip */
    /* flex-grow: 1; Remove this line */
    position: relative; /* Add this line */
    white-space: nowrap; /* Prevent wrapping of label and tooltip */
    /* overflow: hidden; Remove this line */
    /* text-overflow: ellipsis; Remove this line */
  }

  .usa-accordion__button {
    display: flex;
    justify-content: left;
    align-items: center;
    width: 100%;
    padding: 0.6rem 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    text-align: left; /* Ensure text is left-aligned */
  }
</style>
