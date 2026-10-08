// $lib/utils/TanStackTableSvelteAdapter/table.svelte.ts
// This adapter is needed to marry Svelte 5's reactivity model with TanStack's state management
// For another implementation see https://github.com/huntabyte/shadcn-svelte/blob/7ff65b48922969d587279920e0fa9b202277e7d0/docs/src/lib/registry/ui/data-table/data-table.svelte.ts
import { createTable, type RowData, type TableOptions, type TableState, type TableOptionsResolved } from '@tanstack/table-core';

/**
 * Creates a reactive TanStack table object for Svelte 5.
 * @param options Table options to create the table with.
 * @returns A reactive table object.
 * @example
 * ```svelte
 * <script>
 *   const table = createSvelteTable({ ... })
 * </script>
 *
 * <table>
 *   <thead>
 *     {#each table.getHeaderGroups() as headerGroup}
 *       <tr>
 *         {#each headerGroup.headers as header}
 *           <th colspan={header.colSpan}>
 *         	   <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
 *         	 </th>
 *         {/each}
 *       </tr>
 *     {/each}
 *   </thead>
 * 	 <!-- ... -->
 * </table>
 * ```
 */
export function createSvelteTable<TData extends RowData>(options: TableOptions<TData>) {
  // Define a robust default TableState to handle all required properties.
  // This ensures `reactiveTableState` is always a full `TableState` object,
  // satisfying TypeScript's strictness for `TableState`.
  // const defaultTableState: TableState = {
  //   columnFilters: [],
  //   columnOrder: [],
  //   columnPinning: { left: [], right: [] },
  //   columnSizing: {},
  //   columnSizingInfo: {
  //     deltaOffset: null,
  //     deltaPercentage: null,
  //     isResizingColumn: false,
  //     startOffset: null,
  //     startSize: null,
  //     columnSizingStart: []
  //   },
  //   columnVisibility: {},
  //   grouping: [],
  //   expanded: {},
  //   pagination: { pageIndex: 0, pageSize: 10 }, // Common default pagination
  //   rowSelection: {},
  //   sorting: [],
  //   rowPinning: {},
  //   globalFilter: undefined // Can be undefined, string, or array
  // };

  // Construct the `TableOptionsResolved` object.
  //    This object must have all properties defined as required by TanStack Table's
  //    `createTable` function. We ensure `state` and `onStateChange` are explicitly
  //    set to our Svelte reactive ones. Other model getters and options are
  //    provided with sensible defaults if not present in the user's `options`.
  const resolvedOptions: TableOptionsResolved<TData> = mergeObjects(options, {
    // Explicitly set `state` and `onStateChange` to our Svelte reactive ones.
    // These are the core integration points between Svelte and TanStack Table.
    state: {},
    onStateChange() {},

    // Provide robust defaults for other properties that are required by `TableOptionsResolved`
    // but might be optional in the user-provided `TableOptions`.
    getCoreRowModel: options.getCoreRowModel || ((rowModel) => rowModel.getCoreRowModel()),
    getFilteredRowModel: options.getFilteredRowModel || undefined,
    getExpandedRowModel: options.getExpandedRowModel || undefined,
    getGroupedRowModel: options.getGroupedRowModel || undefined,
    getPaginationRowModel: options.getPaginationRowModel || undefined,
    getSortedRowModel: options.getSortedRowModel || undefined,
    getFacetedRowModel: options.getFacetedRowModel || undefined,
    getFacetedUniqueValues: options.getFacetedUniqueValues || undefined,
    getFacetedMinMaxValues: options.getFacetedMinMaxValues || undefined,
    getIsRowExpanded: options.getIsRowExpanded || undefined,
    getRowCanExpand: options.getRowCanExpand || undefined,
    renderFallbackValue: options.renderFallbackValue ?? null,
    mergeOptions: options.mergeOptions || ((defaultOpts, userOpts) => mergeObjects(defaultOpts, userOpts))
  });

  // Create the TanStack table instance.
  //    This function is called **only once** during the component's initialization.
  //    - `resolvedOptions.state` (our `reactiveTableState`) provides the initial state.
  //    - `resolvedOptions.onStateChange` (our `onStateChangeHandler`) handles all subsequent
  //      state updates originating from TanStack Table's internal logic.
  //    - If `options.data` and `options.columns` are provided as reactive Svelte getters
  //      (e.g., `get data() { return myReactiveData; }`), TanStack Table will automatically
  //      access these getters when it needs to re-process data/columns, making it reactive
  //      to changes in those props.
  const table = createTable(resolvedOptions);

  // Initialize a Svelte reactive state variable (`$state`).
  //    This variable will serve as the "source of truth" for the table's state
  //    within your Svelte components. It's initialized by merging the user's
  //    `initialState` (if any) with our robust defaults.
  let state = $state<Partial<TableState>>(table.initialState);

  function updateTableOptions() {
    const currentOptions = options;
    table.setOptions((prev) => {
      return mergeObjects(prev, currentOptions, {
        state: mergeObjects(state, currentOptions.state || {}), // Use currentOptions.state
        onStateChange: (updater: any) => {
          // Determine the new state based on the `updater` function or partial object.
          if (updater instanceof Function) {
            state = updater(state); // Updates adapter's internal `state`
          } else {
            // Update the Svelte reactive state. This assignment triggers Svelte's reactivity system,
            // causing any components that read `reactiveTableState` to re-render.
            state = mergeObjects(state, updater);
          }
          // If the user provided their own `onStateChange` handler in the `options`,
          // call it here to ensure their logic is also executed.
          currentOptions.onStateChange?.(updater);
        }
      });
    });
  }

  // Initial update call
  updateTableOptions();

  // Use a Svelte $effect to react to changes in the optionsGetter's return value
  // This effect will run whenever the object returned by optionsGetter changes (due to its internal dependencies)
  $effect(() => {
    updateTableOptions();
  });

  return table;
}

/**
 * Merges objects together while keeping their getters alive.
 * Taken from SolidJS: {@link https://github.com/solidjs/solid/blob/24abc825c0996fd2bc8c1de1491efe9a7e743aff/packages/solid/src/server/rendering.ts#L82-L115}
 * */
export function mergeObjects<T>(source: T): T;
export function mergeObjects<T, U>(source: T, source1: U): T & U;
export function mergeObjects<T, U, V>(source: T, source1: U, source2: V): T & U & V;
export function mergeObjects<T, U, V, W>(source: T, source1: U, source2: V, source3: W): T & U & V & W;
export function mergeObjects(...sources: any): any {
  const target = {};
  for (let i = 0; i < sources.length; i++) {
    let source = sources[i];
    if (typeof source === 'function') source = source();
    if (source) {
      const descriptors = Object.getOwnPropertyDescriptors(source);
      for (const key in descriptors) {
        if (key in target) continue;
        Object.defineProperty(target, key, {
          enumerable: true,
          get() {
            for (let i = sources.length - 1; i >= 0; i--) {
              let s = sources[i];
              if (typeof s === 'function') s = s();
              const v = (s || {})[key];
              if (v !== undefined) return v;
            }
          }
        });
      }
    }
  }
  return target;
}
