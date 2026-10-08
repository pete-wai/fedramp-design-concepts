<!-- lib/components/Table/PrettyDataTable.svelte -->
<script lang="ts" generics="TData extends Record<string, any>">
  import { asset } from '$lib/utils/paths';
  import type { ColumnDef, Table, TableOptions, PaginationState, SortingState } from '@tanstack/table-core';
  import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/table-core';
  import { createSvelteTable } from '$lib/utils/TanStackTableSvelte5Adapter';
  import DataTablePagination from './DataTablePagination.svelte';
  import Tooltip from '../Tooltip.svelte';
  import USAButton from '../USAButton.svelte';
  import { exportToCSV } from '$lib/utils/exportUtils';
  import { browser } from '$app/environment';
  import { debounce } from '$lib/utils/universalSearch';

  interface Props {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    stickyFirstColumn?: boolean;
    enablePagination?: boolean;
    caption?: string;
    onRowClick?: (row: TData) => void;
    rowHref?: (row: TData) => string | undefined;
  }

  let { data, columns, stickyFirstColumn = false, enablePagination = false, caption, onRowClick, rowHref }: Props = $props();

  let pagination: PaginationState = $state<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });

  let sorting: SortingState = $state<SortingState>([]);

  // Add refs for sticky header functionality
  let tableContainer: HTMLDivElement;
  let tableElement: HTMLTableElement;
  let theadElement: HTMLTableSectionElement;
  let stickyHeader: HTMLTableSectionElement | undefined;
  let isHeaderStuck = $state(false);

  const options = $derived<TableOptions<TData>>({
    get data() {
      return data;
    },
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      get sorting() {
        return sorting;
      },
      get pagination() {
        return enablePagination ? pagination : undefined;
      }
    },
    onSortingChange: (updater) => {
      if (typeof updater === 'function') {
        sorting = updater(sorting);
      } else {
        sorting = updater;
      }
    },
    onPaginationChange: (updater) => {
      if (enablePagination) {
        if (typeof updater === 'function') {
          pagination = updater(pagination);
        } else {
          pagination = updater;
        }
      }
    }
  });

  const table: Table<TData> = $derived.by(() => {
    return createSvelteTable(options as any);
  });

  function getAriaSort(sortState: false | 'asc' | 'desc' | undefined): 'ascending' | 'descending' | 'none' | undefined {
    if (sortState === 'asc') {
      return 'ascending';
    } else if (sortState === 'desc') {
      return 'descending';
    } else if (sortState === false) {
      return 'none';
    }
    return undefined;
  }

  function handleScroll() {
    if (stickyFirstColumn && tableContainer) {
      const isAtLeft = tableContainer.scrollLeft <= 0;
      tableContainer.classList.toggle('scrolled', !isAtLeft);
    }
  }

  function handleRowClick(row: TData) {
    if (rowHref) {
      const href = rowHref(row);
      if (href) {
        window.location.href = href;
      }
    } else if (onRowClick) {
      onRowClick(row);
    }
  }
  const debouncedHandleWindowScroll = debounce(handleWindowScroll, 100); // Adjust the delay as needed
  // Sticky header scroll handler
  function handleWindowScroll() {
    if (!browser || !tableElement || !theadElement) return;
    const tableRect = tableElement.getBoundingClientRect();
    const shouldStick = tableRect.top <= 0 && tableRect.bottom > 60; // 60px for header height

    if (shouldStick && !isHeaderStuck) {
      createStickyHeader();
      isHeaderStuck = true;
    } else if (!shouldStick && isHeaderStuck) {
      removeStickyHeader();
      isHeaderStuck = false;
    }

    // Update sticky header position if it exists
    if (stickyHeader && isHeaderStuck) {
      const containerRect = tableContainer.getBoundingClientRect();
      stickyHeader.style.left = `${containerRect.left}px`;
      stickyHeader.style.width = `${containerRect.width}px`;
    }
  }

  function createStickyHeader() {
    if (!theadElement || stickyHeader) return;

    // Clone the header
    stickyHeader = theadElement.cloneNode(true) as HTMLTableSectionElement;
    stickyHeader.classList.add('sticky-header-clone');

    // Create wrapper table for the cloned header
    const stickyTable = document.createElement('table');
    stickyTable.className = tableElement.className + ' sticky-header-table';
    stickyTable.appendChild(stickyHeader);

    // Position it
    const containerRect = tableContainer.getBoundingClientRect();
    stickyTable.style.position = 'fixed';
    stickyTable.style.top = '0px';
    stickyTable.style.left = `${containerRect.left}px`;
    stickyTable.style.width = `${containerRect.width}px`;
    stickyTable.style.zIndex = '1000';
    stickyTable.style.backgroundColor = 'white';
    stickyTable.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';

    // Copy column widths
    const originalCells = theadElement.querySelectorAll('th');
    const clonedCells = stickyHeader.querySelectorAll('th');

    originalCells.forEach((cell, index) => {
      if (clonedCells[index]) {
        const width = cell.getBoundingClientRect().width;
        (clonedCells[index] as HTMLElement).style.width = `${width}px`;
      }
    });

    document.body.appendChild(stickyTable);
  }

  function removeStickyHeader() {
    if (stickyHeader) {
      const stickyTable = stickyHeader.parentElement;
      if (stickyTable && stickyTable.parentElement) {
        stickyTable.parentElement.removeChild(stickyTable);
      }
      stickyHeader = undefined;
    }
  }

  // Effects for scroll handling
  $effect(() => {
    if (stickyFirstColumn && tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => {
        tableContainer.removeEventListener('scroll', handleScroll);
      };
    }
  });

  $effect(() => {
    if (browser) {
      window.addEventListener('scroll', debouncedHandleWindowScroll);
      window.addEventListener('resize', debouncedHandleWindowScroll);

      return () => {
        window.removeEventListener('scroll', debouncedHandleWindowScroll);
        window.removeEventListener('resize', debouncedHandleWindowScroll);
        removeStickyHeader(); // Clean up on unmount
      };
    }
  });

  // Clean up sticky header when component unmounts or data changes
  $effect(() => {
    // Watch for data changes that might affect table structure
    void data;
    void pagination;

    if (isHeaderStuck) {
      removeStickyHeader();
      isHeaderStuck = false;
      // Recalculate on next frame
      setTimeout(handleWindowScroll, 0);
    }
  });
</script>

<div class="pretty-table-container">
  {#if caption}
    <div class="table-header">
      <h2>{caption}</h2>
      <USAButton
        marketplace
        handleClick={() => {
          exportToCSV(data, `${caption || 'table'}-export`);
        }}
      >
        <svg class="usa-icon" aria-hidden="true" focusable="false" role="img">
          <use href={asset('/uswds/img/sprite.svg#file_download')}></use>
        </svg>Export CSV
      </USAButton>
    </div>
  {/if}
  {#if enablePagination}
    <!-- Only want to define one region for pagination controls for screen readers -->
    <div aria-hidden="true">
      <DataTablePagination {table} />
    </div>
  {/if}
  <div class="table-wrapper">
    <div bind:this={tableContainer} class="table-scroll-wrapper" class:sticky-enabled={stickyFirstColumn}>
      <table bind:this={tableElement} class="usa-table usa-table--borderless pretty-data-table" role="grid">
        <thead bind:this={theadElement}>
          {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
            <tr>
              {#each headerGroup.headers as header, index (header.id)}
                <th
                  scope="col"
                  class:sortable={header.column.getCanSort()}
                  class:first-col={stickyFirstColumn && index === 0}
                  role="columnheader"
                  aria-sort={header.column.getCanSort() ? getAriaSort(header.column.getIsSorted()) : undefined}
                >
                  {#if !header.isPlaceholder}
                    {#if header.column.getCanSort()}
                      <button
                        class="sort-btn"
                        type="button"
                        onclick={header.column.getToggleSortingHandler()}
                        aria-label="Sort by {typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : ''}"
                      >
                        <div class="header-content">
                          <span>{header.column.columnDef.header}</span>
                          {#if (header.column.columnDef.meta as any)?.tooltip}
                            <Tooltip
                              text={(header.column.columnDef.meta as any).tooltip}
                              ariaLabel="More information about {typeof header.column.columnDef.header === 'string'
                                ? header.column.columnDef.header
                                : 'this column'}"
                              position="bottom"
                            />
                          {/if}
                        </div>
                        <svg class="sort-icon" aria-hidden="true">
                          {#if header.column.getIsSorted() === 'asc'}
                            <use href={asset('/uswds/img/sprite.svg#arrow_upward')}></use>
                          {:else if header.column.getIsSorted() === 'desc'}
                            <use href={asset('/uswds/img/sprite.svg#arrow_downward')}></use>
                          {:else}
                            <use href={asset('/uswds/img/sprite.svg#unfold_more')}></use>
                          {/if}
                        </svg>
                      </button>
                    {:else}
                      <div class="header-content">
                        <span>{header.column.columnDef.header}</span>
                        {#if (header.column.columnDef.meta as any)?.tooltip}
                          <Tooltip
                            text={(header.column.columnDef.meta as any).tooltip}
                            ariaLabel="More information about {typeof header.column.columnDef.header === 'string'
                              ? header.column.columnDef.header
                              : 'this column'}"
                            position="bottom"
                          />
                        {/if}
                      </div>
                    {/if}
                  {/if}
                </th>
              {/each}
            </tr>
          {/each}
        </thead>
        <tbody>
          {#each table.getRowModel().rows as row, rowIndex (row.id)}
            <tr
              class:clickable={!!(onRowClick || rowHref)}
              class:odd-row={rowIndex % 2 === 0}
              class:even-row={rowIndex % 2 === 1}
              onclick={() => handleRowClick(row.original)}
              onkeydown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && (onRowClick || rowHref)) {
                  e.preventDefault();
                  handleRowClick(row.original);
                }
              }}
              tabindex={onRowClick || rowHref ? 0 : undefined}
              role={onRowClick || rowHref ? 'button' : undefined}
            >
              {#each row.getVisibleCells() as cell, index (cell.id)}
                <td role="gridcell" class:first-col={stickyFirstColumn && index === 0}>
                  {@html cell.column.columnDef.cell
                    ? String(typeof cell.column.columnDef.cell === 'function' ? cell.column.columnDef.cell(cell.getContext()) : cell.getValue())
                    : String(cell.getValue())}
                </td>
              {/each}
            </tr>
          {:else}
            <tr>
              <td colspan={columns.length} class="empty-cell"> No data available. </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  {#if enablePagination}
    <DataTablePagination {table} />
  {/if}
</div>

<style>
  .pretty-table-container {
    width: 100%;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .table-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1b1b1b;
  }

  .table-wrapper {
    border-radius: 8px;
    border: 1px solid #dfe1e2;
    position: relative;
    overflow: hidden;
  }

  .table-scroll-wrapper {
    width: 100%;
    overflow-x: auto;
    overflow-y: auto;
    max-height: 100rem;
    -webkit-overflow-scrolling: touch;
  }

  .pretty-data-table {
    width: 100%;
    min-width: 600px;
    border-collapse: collapse;
    margin: 0;
    table-layout: auto;
  }

  /* Regular header styles */
  .pretty-data-table thead {
    background-color: #ffffff;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .pretty-data-table thead tr {
    height: 48px;
  }

  .pretty-data-table th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
    color: #1b1b1b;
    border-bottom: 2px solid #dfe1e2;
    white-space: nowrap;
    background-color: white;
  }

  /* Sticky header clone styles */
  :global(.sticky-header-table) {
    border-collapse: collapse;
    margin: 0;
    table-layout: fixed !important;
  }

  :global(.sticky-header-clone th) {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
    color: #1b1b1b;
    border-bottom: 2px solid #dfe1e2;
    white-space: nowrap;
    background-color: white;
    box-sizing: border-box;
  }

  .sort-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font: inherit;
    color: inherit;
    width: 100%;
    justify-content: space-between;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sort-btn:hover {
    color: #005ea2;
  }

  .sort-icon {
    width: 16px;
    height: 16px;
    fill: currentColor;
    flex-shrink: 0;
  }

  /* Body */
  .pretty-data-table tbody tr {
    height: 48px;
  }

  .pretty-data-table tbody tr.odd-row {
    background-color: #f6f8fa;
  }

  .pretty-data-table tbody tr.even-row {
    background-color: #ffffff;
  }

  .pretty-data-table tbody tr.clickable {
    cursor: pointer;
  }

  .pretty-data-table tbody tr.clickable:hover {
    background-color: #e7f3ff;
    border-left: 3px solid #005ea2 !important;
  }

  .pretty-data-table tbody tr.clickable {
    border-left: 3px solid transparent !important;
  }

  .pretty-data-table td {
    padding: 12px 16px;
    font-size: 14px;
    color: #1b1b1b;
    border-bottom: 1px solid #f0f0f0;
  }

  .empty-cell {
    text-align: center;
    padding: 3rem !important;
    color: #71767a;
    font-style: italic;
  }

  /* Sticky first column */
  @media (max-width: 1023px) {
    .sticky-enabled .first-col {
      position: sticky;
      left: 0;
      background-color: inherit;
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
      z-index: 101;
    }
  }

  /* Mobile */
  @media (max-width: 768px) {
    .table-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .pretty-data-table {
      min-width: 500px;
    }

    .pretty-data-table th,
    .pretty-data-table td {
      padding: 10px 12px;
      font-size: 13px;
    }

    .arrow-cell,
    .arrow-header {
      display: none;
    }
  }
</style>
