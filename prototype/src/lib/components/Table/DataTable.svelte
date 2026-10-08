<!-- lib/components/Table/DataTable.svelte -->
<script lang="ts" generics="TData extends Record<string, any>">
  import { asset } from '$lib/utils/paths';
  import type { ColumnDef, Table, TableOptions, PaginationState, SortingState } from '@tanstack/table-core';
  import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/table-core';
  import { createSvelteTable, FlexRender } from '$lib/utils/TanStackTableSvelte5Adapter';
  import DataTablePagination from './DataTablePagination.svelte';
  import USAButton from '../USAButton.svelte';
  import { exportToCSV } from '$lib/utils/exportUtils';

  type Props = {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    stickyFirstColumn?: boolean;
    caption?: string;
  };

  let { data, columns, stickyFirstColumn = false, caption }: Props = $props();

  let pagination: PaginationState = $state<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });

  let sorting: SortingState = $state<SortingState>([]);

  const options = $derived<TableOptions<TData>>({
    get data() {
      return data;
    },
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      get sorting() {
        return sorting;
      },
      get pagination() {
        return pagination;
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
      if (typeof updater === 'function') {
        pagination = updater(pagination);
      } else {
        pagination = updater;
      }
    }
  });

  const table: Table<TData> = createSvelteTable(options);

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

  let tableContainer: HTMLDivElement;

  function handleScroll() {
    if (stickyFirstColumn && tableContainer) {
      const isAtLeft = tableContainer.scrollLeft <= 0;
      tableContainer.classList.toggle('scrolled', !isAtLeft);
    }
  }

  $effect(() => {
    if (stickyFirstColumn && tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => {
        tableContainer.removeEventListener('scroll', handleScroll);
      };
    }
  });
</script>

<div class="button-wrapper">
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

<div class="table-wrapper" class:has-sticky={stickyFirstColumn}>
  <div bind:this={tableContainer} class="table-scroll-container" class:sticky-enabled={stickyFirstColumn}>
    <table class="usa-table usa-table--borderless" role="grid">
      {#if caption}
        <caption id="Table caption" class="table-caption">{caption}</caption>
      {/if}
      <thead>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <tr>
            {#each headerGroup.headers as header, index (header.id)}
              <th
                scope="col"
                class:sortable={header.column.getCanSort()}
                class:first-col={index === 0}
                role="columnheader"
                aria-sort={header.column.getCanSort() ? getAriaSort(header.column.getIsSorted()) : undefined}
                style="min-width: {index === 0 ? '200px' : '150px'};"
              >
                {#if !header.isPlaceholder}
                  {#if header.column.getCanSort()}
                    <button
                      class="sort-button"
                      type="button"
                      tabindex="0"
                      onclick={header.column.getToggleSortingHandler()}
                      aria-label="Sort by {typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : ''}"
                    >
                      <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                      <span class="sort-icon usa-icon" aria-hidden="true">
                        {#if header.column.getIsSorted() === 'asc'}
                          <svg class="usa-icon__svg" aria-hidden="true" role="img">
                            <use xlink:href={asset('/uswds/img/sprite.svg#arrow_upward')}></use>
                          </svg>
                        {:else if header.column.getIsSorted() === 'desc'}
                          <svg class="usa-icon__svg" aria-hidden="true" role="img">
                            <use xlink:href={asset('/uswds/img/sprite.svg#arrow_downward')}></use>
                          </svg>
                        {:else}
                          <svg class="usa-icon__svg" aria-hidden="true" role="img">
                            <use xlink:href={asset('/uswds/img/sprite.svg#unfold_more')}></use>
                          </svg>
                        {/if}
                      </span>
                    </button>
                  {:else}
                    <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                  {/if}
                {/if}
              </th>
            {/each}
          </tr>
        {/each}
      </thead>
      <tbody>
        {#each table.getRowModel().rows as row (row.id)}
          <tr>
            {#each row.getVisibleCells() as cell, index (cell.id)}
              <td role="gridcell" class:first-col={index === 0} style="min-width: {index === 0 ? '200px' : '150px'};">
                <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
              </td>
            {/each}
          </tr>
        {:else}
          <tr>
            <td colspan={columns.length} class="usa-sr-only" role="gridcell"> No data available.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <DataTablePagination {table} />
</div>

<style lang="scss">
  /* super long, double check for redundant/unnecessary styling  */
  .table-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 5px;
    background: rgba(187, 184, 188, 0.25);
    border-radius: 5px;
    box-sizing: border-box;
    width: 100%;
    max-width: none;
    margin: 0 auto;
    gap: 10px;
  }

  .table-caption {
    padding: 8px 12px;
    margin-top: 0.75rem;
  }

  .table-wrapper.has-sticky {
    max-width: 100%;
  }

  .table-scroll-container {
    width: 100%;
    overflow-x: auto;
    background: white;
    border-radius: 5px;
  }

  .table-scroll-container.sticky-enabled {
    max-width: 100%;
  }

  .usa-table {
    width: 100%;
    min-width: 600px;
    border-collapse: separate;
    border-spacing: 0;
    background: transparent;
    margin: 0;
  }

  .sticky-enabled .usa-table {
    min-width: 800px;
  }

  /* Sticky column styles - only active on tablet and under */
  @media (max-width: 1023.99px) {
    .sticky-enabled th.first-col,
    .sticky-enabled td.first-col {
      position: sticky;
      left: 0;
      z-index: 10;
      background: white;
      border-right: 2px solid #ddd;
    }

    .sticky-enabled tbody tr:nth-child(odd) td.first-col {
      background: #f6f6f6;
    }

    .sticky-enabled tbody tr:nth-child(even) td.first-col {
      background: #ffffff;
    }
  }

  /* Desktop: no sticky behavior */
  @media (min-width: 1024px) {
    .sticky-enabled th.first-col,
    .sticky-enabled td.first-col {
      position: static;
      background: inherit;
      border-right: none;
    }
  }

  thead tr {
    background: #ffffff;
    height: 50px;
  }

  thead th {
    padding: 10px 15px;
    height: 40px;
    border-top: 1.5px solid #1b1b1b;
    border-bottom: 1.5px solid #1b1b1b;
    background: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 20px;
    letter-spacing: -0.01em;
    color: rgba(27, 27, 27, 0.75);
  }

  thead th:first-child {
    border-left: 1.5px solid #1b1b1b;
    border-top-left-radius: 5px;
  }

  thead th:last-child {
    border-right: 1.5px solid #1b1b1b;
    border-top-right-radius: 5px;
  }

  tbody tr {
    height: 40px;
    border: 0.5px solid #bbb8bc;
    border-top: none;
    box-sizing: border-box;
  }

  tbody tr:nth-child(odd) {
    background: #f6f6f6;
  }

  tbody tr:nth-child(even) {
    background: #ffffff;
  }

  tbody td {
    padding: 10px 15px;
    height: 40px;
    border: none;
    background: transparent;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 20px;
    letter-spacing: -0.01em;
    color: #000000;
  }

  .sort-button {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    color: rgba(27, 27, 27, 0.75);
  }

  .sort-button:focus-visible {
    outline: 2px solid #1b1b1b;
    outline-offset: 2px;
  }

  .sort-button:hover {
    color: rgba(27, 27, 27, 0.9);
  }

  .sort-icon {
    flex-shrink: 0;
    transform: scale(1.5);
  }

  .sort-icon .usa-icon__svg {
    width: 18px;
    height: 18px;
  }

  .sort-icon .usa-icon__svg use {
    fill: rgba(27, 27, 27, 0.65);
  }

  tbody td a {
    text-decoration-line: underline;
    color: #000000;
  }

  tbody tr:has(.usa-sr-only) {
    background: #ffffff;
    text-align: center;
  }

  tbody tr:has(.usa-sr-only) td {
    padding: 20px;
  }

  @media (max-width: 1024px) {
    .table-wrapper {
      margin-left: 0;
      margin-right: 0;
      padding: 5px; /* Keep consistent padding */
    }

    .table-scroll-container {
      width: 100%;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
  }

  @media (max-width: 768px) {
    .table-wrapper {
      padding: 3px; /* Slightly reduce padding on mobile */
    }

    .sticky-enabled .usa-table {
      min-width: 500px;
    }

    thead th,
    tbody td {
      padding: 8px 12px;
      font-size: 14px;
    }
  }

  .usa-table thead th[aria-sort].sortable,
  table thead th[aria-sort].sortable {
    background-color: #fff;
  }

  .button-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 1rem; /* Add some spacing before the table */
    @media (max-width: 332px) {
      flex-direction: column;
    }
  }

  .button-wrapper h2 {
    margin: 0;
    font-size: 1.5rem;
  }
</style>
