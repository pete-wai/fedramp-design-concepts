<!-- lib/components/Marketplace/MarketplaceSearch.svelte -->
<script lang="ts" generics="T extends Record<string, any>">
  import UniversalSearch from '../UniversalSearch.svelte';
  import type { SearchConfig, FilterConfig, SortOrder } from '$lib/utils/universalSearch';

  let {
    data = [] as T[],
    searchConfig,
    filterConfig,
    sortConfig = { field: 'name' as keyof T | string, order: 'asc' as SortOrder },
    searchPlaceholder = 'Search marketplace...',
    resultTemplate = 'default' as 'default' | 'card' | 'list' | 'custom',
    showSort = true,
    sortOptions = [] as { value: string; label: string }[],
    resultSnippet,
    onResultAction,
    enableURLSync = false,
    containerClass = 'marketplace-search',
    showFilterTags = true,
    itemKey = 'id' as keyof T | string | ((item: T) => any),
    exportAllowed = true,
    exportBaseName = 'marketplace',
    showCondensedToggle = false,
    condensedViewColumns = [] as { key: string; label: string; sortable?: boolean; customRender?: (value: any) => string; tooltip?: string }[],
    defaultView = 'cards' as 'cards' | 'table',
    getItemHref = undefined,
    // ATO export props
    enableATOExport = false,
    atoMapping = [] as any[],
    reuseMapping = [] as any[]
  }: {
    data: T[];
    searchConfig: SearchConfig<T>;
    filterConfig: FilterConfig<T>[];
    sortConfig?: { field: keyof T | string; order: SortOrder };
    searchPlaceholder?: string;
    resultTemplate?: 'default' | 'card' | 'list' | 'custom';
    showSort?: boolean;
    sortOptions?: { value: string; label: string }[];
    resultSnippet?: (item: T, searchTerm: string) => any;
    onResultAction?: (action: string, item: T) => void;
    enableURLSync?: boolean;
    containerClass?: string;
    showFilterTags?: boolean;
    itemKey?: keyof T | string | ((item: T) => any);
    exportAllowed?: boolean;
    exportBaseName?: string;
    showCondensedToggle?: boolean;
    condensedViewColumns?: { key: string; label: string; sortable?: boolean; customRender?: (value: any) => string; tooltip?: string }[];
    defaultView?: 'cards' | 'table';
    getItemHref?: (item: T) => string | undefined;
    enableATOExport?: boolean;
    atoMapping?: any[];
    reuseMapping?: any[];
  } = $props();
</script>

<UniversalSearch
  {data}
  {searchConfig}
  {filterConfig}
  {sortConfig}
  {searchPlaceholder}
  {resultTemplate}
  {showSort}
  {sortOptions}
  {onResultAction}
  {enableURLSync}
  {containerClass}
  {showFilterTags}
  {itemKey}
  {exportAllowed}
  {exportBaseName}
  {resultSnippet}
  {showCondensedToggle}
  {condensedViewColumns}
  {defaultView}
  {getItemHref}
  {enableATOExport}
  {atoMapping}
  {reuseMapping}
/>

<style>
  /* Integration with existing styles */
  :global(.search-header) {
    margin-bottom: 1rem;
    background-color: #f5f5fa !important;
  }

  :global(.sticky-filter-tags) {
    background-color: #f5f5fa !important;
  }

  @media (min-width: 64em) {
    :global(.desktop-search) {
      background: #f5f5fa !important;
    }
  }
</style>
