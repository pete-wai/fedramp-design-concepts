<!-- lib/components/Table/DataTablePagination.svelte -->
<script lang="ts" generics="TData extends Record<string, any>">
  import type { Table } from '@tanstack/table-core';
  import USAButton from '../USAButton.svelte';
  let { table }: { table: Table<TData> } = $props();
  // Derived state from the table instance
  let pageIndex = $derived(table.getState().pagination.pageIndex);
  let pageSize = $derived(table.getState().pagination.pageSize);
  let pageCount = $derived(table.getPageCount());
  let canPreviousPage = $derived(table.getCanPreviousPage());
  let canNextPage = $derived(table.getCanNextPage());
  let totalItems = $derived(table.getFilteredRowModel().rows.length); // Use filtered row model for total items

  // Flag to ensure we only set the default "All Items" once on initial load
  let isInitialPageSizeSet: boolean = false;

  // Helper function to generate the page size options dynamically
  // This function is outside the $derived block to help TypeScript inference.
  function getDynamicPageSizeOptions(currentTotalItems: number): number[] {
    const fixedOptions = [10, 50];
    let options = [...fixedOptions]; // Start with fixed options

    // Add currentTotalItems as an 'All' option if it's not already in fixedOptions
    // and if there are actual items to display (currentTotalItems > 0)
    if (currentTotalItems > 0 && !fixedOptions.includes(currentTotalItems)) {
      options.push(currentTotalItems);
    }

    // Sort the options numerically for consistent display
    return options.sort((a, b) => a - b);
  }

  // Page size options (can be passed as a prop if dynamic)
  const pageSizeOptions = $derived(getDynamicPageSizeOptions(totalItems));
  // Helper to get the range of items currently displayed
  let displayedItemStart = $derived(totalItems === 0 ? 0 : pageIndex * pageSize + 1);
  let displayedItemEnd = $derived(
    totalItems === 0
      ? 0
      : pageSize === totalItems // If 'All' is selected
        ? totalItems // Display the total number of items
        : Math.min((pageIndex + 1) * pageSize, totalItems) // Otherwise, calculate normally
  );

  // Use an effect to set the default page size to "All Items" on initial load
  $effect(() => {
    // We only want to do this once, when totalItems is first available and not zero,
    // and if the page size hasn't already been explicitly set by the user or an external source.
    if (!isInitialPageSizeSet && totalItems > 0) {
      // Set the table's page size to display all items
      table.setPageSize(totalItems);
      // Ensure it's on the first page when "All" is selected
      table.setPageIndex(0);
      // Mark as set to prevent re-triggering this logic
      isInitialPageSizeSet = true;
    }
  });
</script>

<nav class="usa-pagination-bar" aria-label="Table pagination controls">
  <div class="pagination-page-size-select">
    <label for="page-size-select" class="usa-sr-only">Items per page:</label>
    <select
      class="usa-select"
      aria-label="Select number of items per page"
      bind:value={pageSize}
      onchange={() => table.setPageSize(Number(pageSize))}
    >
      {#each pageSizeOptions as size (size)}
        <option value={size}>{size === totalItems ? 'All' : size} items</option>
      {/each}
    </select>
  </div>

  <div class="pagination-info">
    Showing {displayedItemStart}-{displayedItemEnd} of {totalItems} items (Page {pageIndex + 1} of {pageCount})
  </div>

  <div class="pagination-buttons">
    <USAButton onclick={() => table.previousPage()} disabled={!canPreviousPage} aria-label="Previous page">Previous</USAButton>
    <USAButton onclick={() => table.nextPage()} disabled={!canNextPage} aria-label="Next page">Next</USAButton>
  </div>
</nav>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .usa-pagination-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 10px 15px;
    margin: 5px;
    width: 100%;
    height: 50px;
    background: #f6f6f6;
    border-top: none;
    border-radius: 5px;
    box-sizing: border-box;
    font-size: 14px;
    color: #1b1b1b;
    gap: 20px;
  }

  .pagination-page-size-select {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .usa-select {
    padding: 5px 10px;
    border: 1px solid #bbb8bc;
    border-radius: 3px;
    font-size: 14px;
    min-width: 100px;
    margin-top: 0;
  }

  .pagination-info {
    text-align: center;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.01em;
    color: rgba(27, 27, 27, 0.75);
    white-space: nowrap;
  }

  .pagination-buttons {
    display: flex;
    gap: 8px;
  }

  @media (max-width: 768px) {
    .usa-pagination-bar {
      flex-direction: column;
      height: auto;
      padding: 15px;
      gap: 10px;
    }

    .pagination-info {
      order: -1;
      text-align: center;
    }

    .pagination-page-size-select {
      order: 1;
    }

    .pagination-buttons {
      order: 2;
    }
  }

  @media (max-width: uswds.units('mobile-lg')) {
    .pagination-info {
      font-size: 12px;
    }

    .usa-select {
      font-size: 12px;
    }
  }
</style>
