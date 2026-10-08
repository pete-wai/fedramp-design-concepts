// Using a community custom adapter so that wwe can use TanStack Table with Svelte 5:
// https://github.com/TanStack/table/pull/5403 (see packages/svelte-table/src)
export * from '@tanstack/table-core';
export { default as FlexRender } from './FlexRender.svelte';
export { renderComponent } from './renderComponent';
export { createSvelteTable } from './table.svelte';
