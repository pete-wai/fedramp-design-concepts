<!-- lib/components/Marketplace/MarketplaceSearchResult.svelte -->
<script lang="ts" generics="T">
  // Thin wrapper that forwards the marketplace result API to the universal result
  import UniversalSearchResult from '$lib/components/UniversalSearchResult.svelte';

  let {
    item,
    searchTerm = '',
    template = 'default',
    onaction,
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
    content?: any;
    details?: any;
    actions?: any;
    header?: any;
    body?: any;
    footer?: any;
    list?: any;
    custom?: any;
  } = $props();
</script>

<UniversalSearchResult {item} {searchTerm} {template} {onaction} {content} {details} {actions} {header} {body} {footer} {list} {custom} />
