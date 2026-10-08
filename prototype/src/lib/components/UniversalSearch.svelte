<!-- lib/components/UniversalSearch.svelte -->
<script lang="ts" generics="T extends Record<string, any>">
  // ===== IMPORTS =====
  import { page } from '$app/stores';
  import { asset } from '$lib/utils/paths';
  import { browser } from '$app/environment';
  import { tick } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { pushState, replaceState } from '$app/navigation';
  import { onMount } from 'svelte';
  import DOMPurify from 'dompurify';
  import { exportATOsToJSON } from '$lib/utils/exportUtils';
  import { VList } from 'virtua/svelte';

  // Universal search utilities
  import {
    searchItemsWithScore,
    calculateFilterCounts,
    filterItems,
    sortItemsWithRelevance,
    debounce,
    getActiveFilterCount,
    filtersToURLParams,
    urlParamsToFilters,
    parseSortFromURL,
    type SearchResult,
    highlightSearchTerms
  } from '$lib/utils/universalSearch';
  import type { SearchConfig, FilterConfig, SortOrder } from '$lib/utils/universalSearch';

  // Accessibility utilities
  import { announce, liveAnnouncementStore } from '$lib/utils/a11yAnnouncer';

  // Export utilities
  import { exportToCSV, exportToJSON } from '$lib/utils/exportUtils';

  // Components
  import UniversalFilters from './UniversalFilters.svelte';
  import UniversalSearchResult from './UniversalSearchResult.svelte';
  import PrettyDataTable from './Table/PrettyDataTable.svelte';
  import type { ColumnDef } from '@tanstack/table-core';

  // ===== COMPONENT PROPS =====
  let {
    data = [] as T[],
    searchConfig,
    filterConfig,
    sortConfig = { field: 'name' as keyof T | string, order: 'asc' as SortOrder },
    searchPlaceholder = 'Search...',
    resultTemplate = 'default' as 'default' | 'card' | 'list' | 'custom',
    showSort = true,
    sortOptions = [] as { value: string; label: string }[],
    resultSnippet,
    onResultAction,
    enableURLSync = false,
    containerClass = 'universal-search',
    showFilterTags = true,
    itemKey = 'id' as keyof T | string | ItemKeyFunction<T>,
    exportAllowed = false,
    exportBaseName = '',
    showCondensedToggle = false,
    condensedViewColumns = [] as { key: string; label: string; sortable?: boolean; customRender?: (value: any) => string; tooltip?: string }[],
    defaultView = 'cards' as ViewMode,
    getItemHref = undefined,
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
    itemKey?: keyof T | string | ItemKeyFunction<T>;
    exportAllowed?: boolean;
    exportBaseName?: string;
    showCondensedToggle?: boolean;
    condensedViewColumns?: { key: string; label: string; sortable?: boolean; customRender?: (value: any) => string; tooltip?: string }[];
    defaultView?: ViewMode;
    getItemHref?: (item: T) => string | undefined;
    enableATOExport?: boolean;
    atoMapping?: any[];
    reuseMapping?: any[];
  } = $props();

  // ===== TYPE DEFINITIONS =====
  type ItemKeyFunction<T> = (item: T) => any;
  type ViewMode = 'cards' | 'table';

  // ===== REACTIVE STATE =====
  // Search and Filter State
  let searchTerm = $state('');
  let currentInputValue = $state('');
  let filters = $state({} as Record<string, any>);
  let sortField = $state<keyof T | string | 'relevance'>(sortConfig.field);
  let sortOrder = $state<SortOrder>(sortConfig.order);

  // UI State
  let currentView = $state<ViewMode>(defaultView);
  let showExportDropdown = $state(false);
  let showAllTags = $state(false);
  let showMobileFilters = $state(false);
  let shouldShowToggleButton = $state(false);

  // URL State Management
  let isApplyingURLState = $state(false);

  // Layout Measurements
  let desktopSearchActualHeight = $state(0);
  let actuallyHiddenCount = $state(0);

  // DOM References
  let exportDropdownRef: HTMLElement | undefined;
  let filterTagsContainerRef: HTMLElement | undefined;
  let desktopSearchRef: HTMLElement | undefined;

  // Cache for performance
  let filterCountsCache: Record<string, Record<string, Record<string, number>>> = {};
  let filterCountsCacheVersion = $state(0);

  // ===== DERIVED COMPUTED VALUES =====
  const filtersPanelStickyTop = $derived(desktopSearchActualHeight);
  const hasActiveSearch = $derived(searchTerm.length >= (searchConfig.minSearchLength || 2));

  const searchedDataWithScores = $derived(searchItemsWithScore(data, searchTerm, searchConfig));

  const filteredDataWithScores = $derived.by(() => {
    const searchedItems = searchedDataWithScores.map((r) => r.item);
    const cleanedFilters = cleanFilters(filters);
    const filteredItems = filterItems(searchedItems, cleanedFilters, filterConfig);
    return searchedDataWithScores.filter((result: SearchResult<T>) => filteredItems.includes(result.item));
  });

  const sortedDataWithScores = $derived(sortItemsWithRelevance(filteredDataWithScores, sortField, sortOrder));
  const sortedData = $derived(sortedDataWithScores.map((r) => r.item));
  const resultCount = $derived(sortedData.length);

  // When the search config supplies a `hasExactMatch` predicate, surface a
  // notice if the active search returned results but none of them are an exact
  // match for the term.
  const showNoExactMatchNotice = $derived(
    hasActiveSearch && resultCount > 0 && typeof searchConfig.hasExactMatch === 'function' && !searchConfig.hasExactMatch(data, searchTerm)
  );
  const activeFilterCount = $derived(getActiveFilterCount(filters));

  const effectiveSortOptions = $derived.by(() => {
    const options = [...(sortOptions || [])];
    if (hasActiveSearch) options.unshift({ value: 'relevance-asc', label: 'Most Relevant' });
    return options;
  });

  const exportButtonText = $derived(searchTerm.trim() || activeFilterCount > 0 ? 'Export Results' : 'Export All');

  // Filter counts with caching
  const filterCounts = $derived.by(() => {
    void filterCountsCacheVersion;
    const cleanedFilters = cleanFilters(filters);
    const cacheKey = JSON.stringify({
      dataLength: data.length,
      dataFirstId: data[0] ? getItemKey(data[0]) : null,
      searchTerm,
      filters: cleanedFilters,
      configKeys: filterConfig.map((f) => f.key).sort()
    });
    if (filterCountsCache[cacheKey]) return filterCountsCache[cacheKey];
    return calculateFilterCounts(data, searchTerm, searchConfig, filterConfig, cleanedFilters);
  });

  // Active filter tags for display
  const activeFilterTags = $derived.by(() => {
    if (!showFilterTags) return [];
    const tags: { id: string; key: string; value: string; label: string }[] = [];
    const handledRangeKeys = new SvelteSet<string>();

    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return;
      if (handledRangeKeys.has(key)) return;

      const filterConf = filterConfig.find((f) => f.key === key);

      if (key.endsWith('From')) {
        const baseKey = key.replace('From', '');
        const toKey = `${baseKey}To`;
        const toValue = filters[toKey];
        if (toValue !== null && toValue !== undefined && toValue !== '') {
          tags.push({
            id: `${key}-${value}-${toKey}-${toValue}`,
            key: `${baseKey}Range`,
            value: `${String(value)}-${String(toValue)}`,
            label: `${baseKey}: ${String(value)} to ${String(toValue)}`
          });
          handledRangeKeys.add(toKey);
        } else {
          tags.push({ id: `${key}-${value}`, key, value: String(value), label: `${baseKey} from: ${value}` });
        }
      } else if (key.endsWith('To')) {
        const baseKey = key.replace('To', '');
        if (!filters[`${baseKey}From`] && !handledRangeKeys.has(key)) {
          tags.push({ id: `${key}-${value}`, key, value: String(value), label: `${baseKey} to: ${value}` });
        }
      } else if (Array.isArray(value)) {
        value.forEach((v) => {
          let label = v;
          if (filterConf?.options) {
            const options = typeof filterConf.options === 'function' ? filterConf.options(data) : filterConf.options;
            const option = options.find((opt) => opt.value === v);
            if (option) label = `${option.label}`;
          }
          tags.push({ id: `${key}-${v}`, key, value: v, label });
        });
      } else {
        let label = String(value);
        if (filterConf?.options) {
          const options = typeof filterConf.options === 'function' ? filterConf.options(data) : filterConf.options;
          const option = options.find((opt) => opt.value === value);
          if (option) label = `${option.label}`;
        }
        tags.push({ id: `${key}-${value}`, key, value: String(value), label });
      }
      handledRangeKeys.add(key);
    });
    return tags;
  });

  // Data table columns for table view
  const dataTableColumns = $derived.by((): ColumnDef<T, any>[] => {
    if (!showCondensedToggle || condensedViewColumns.length === 0) return [];
    return condensedViewColumns.map((col) => ({
      accessorKey: col.key as keyof T,
      header: col.label,
      cell: (info) => {
        const value = info.getValue();
        const displayValue = col.customRender ? col.customRender(value) : getDisplayValue(value);
        if (col.customRender) return displayValue;
        return highlightSearchTerms(displayValue, searchTerm);
      },
      enableSorting: col.sortable ?? true,
      meta: col.tooltip ? { tooltip: col.tooltip } : undefined
    }));
  });

  onMount(() => {
    if (enableURLSync) {
      const hasURLParams = $page.url.searchParams.size > 0;
      if (hasURLParams) {
        applyStateFromURL($page.url);
      } else {
        setTimeout(() => updateURL(true), 100); // Delay to ensure router is ready
      }
    }
  });
  // ===== UTILITY FUNCTIONS =====
  function cleanFilters(filtersObj: Record<string, any>): Record<string, any> {
    return Object.entries(filtersObj).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) acc[key] = value;
        return acc;
      },
      {} as Record<string, any>
    );
  }

  function getDisplayValue(value: any): string {
    if (value == null) return '';
    if (Array.isArray(value)) return value.filter((v) => v != null).join(', ');
    return String(value);
  }

  function getItemKey(item: T): string {
    if (typeof itemKey === 'function') return String((itemKey as ItemKeyFunction<T>)(item));
    return String((item as any)[itemKey]);
  }

  function preserveFocusWhile(fn: () => void) {
    const active = document.activeElement as HTMLElement | null;
    const isTextInput =
      active &&
      (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) &&
      typeof active.selectionStart === 'number' &&
      typeof active.selectionEnd === 'number';
    const selStart = isTextInput ? (active as HTMLInputElement).selectionStart : null;
    const selEnd = isTextInput ? (active as HTMLInputElement).selectionEnd : null;

    fn();

    requestAnimationFrame(() => {
      if (!active || !active.isConnected) return;
      active.focus({ preventScroll: true });
      if (isTextInput && selStart != null && selEnd != null) {
        try {
          (active as HTMLInputElement).setSelectionRange(selStart, selEnd);
        } catch {
          // ignore
        }
      }
    });
  }

  // ===== ACCESSIBILITY HELPERS =====
  async function announceResults({ context = '' } = {}) {
    await tick();

    let message: string;
    if (searchTerm.trim() || activeFilterCount > 0) {
      message = `${resultCount} ${resultCount === 1 ? 'result' : 'results'} found`;
      if (searchTerm.trim()) {
        message += ` for "${searchTerm}"`;
      }
      if (activeFilterCount > 0) {
        message += ` with ${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} applied`;
      }
      if (showNoExactMatchNotice) {
        message += `. Could not find exact match for "${searchTerm}". Showing relevant results`;
      }
      if (context) {
        message = `${context}. ${message}`;
      }
    } else {
      message = `Showing all items. ${resultCount} ${resultCount === 1 ? 'result' : 'results'} total`;
    }

    announce(message);
  }

  function preserveFocusForFilters<T>(fn: () => T): T {
    const activeElement = document.activeElement as HTMLElement;
    const result = fn();

    // Restore focus after DOM updates
    setTimeout(() => {
      if (activeElement && activeElement.isConnected) {
        activeElement.focus({ preventScroll: true });
      }
    }, 50);

    return result;
  }

  // ===== URL MANAGEMENT =====
  function buildSyncedURL(): URL {
    const url = new URL($page.url);

    if (searchTerm.trim()) url.searchParams.set('q', searchTerm.trim());
    else url.searchParams.delete('q');

    url.searchParams.set('view', currentView);

    Array.from(url.searchParams.keys()).forEach((key) => {
      if (key !== 'q' && key !== 'sort' && key !== 'view') {
        url.searchParams.delete(key);
      }
    });

    const filterParams = filtersToURLParams(filters);
    filterParams.forEach((value, key) => url.searchParams.set(key, value));

    const defaultSort = `${String(sortConfig.field)}-${sortConfig.order}`;
    const currentSort = `${String(sortField)}-${sortOrder}`;

    if (currentSort !== defaultSort) url.searchParams.set('sort', currentSort);
    else url.searchParams.delete('sort');

    return url;
  }

  function updateURL(replace = false) {
    if (!enableURLSync || !browser || isApplyingURLState) {
      return;
    }

    const next = buildSyncedURL();

    if (next.toString() === $page.url.toString()) {
      return;
    }

    preserveFocusWhile(() => {
      try {
        // Add a small delay to ensure SvelteKit router is ready
        setTimeout(() => {
          try {
            if (replace) {
              replaceState(next.toString(), { replace: true });
            } else {
              pushState(next.toString(), { replace: false });
            }
          } catch (e) {
            console.warn('❌ Could not update URL (delayed):', e);
          }
        }, 10);
      } catch (e) {
        console.warn('❌ Could not update URL silently', e);
      }
    });
  }

  function applyStateFromURL(url: URL) {
    if (!enableURLSync) return false;
    try {
      isApplyingURLState = true;

      // Sanitize search term
      const urlSearchTerm = DOMPurify.sanitize(url.searchParams.get('q') || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

      // Parse filters with validation against filterConfig and data
      const rawUrlFilters = urlParamsToFilters(url.searchParams, filterConfig, data);
      delete (rawUrlFilters as any).view;

      // Parse sort with validation against allowed options
      const { field, order } = parseSortFromURL(url.searchParams.get('sort'), effectiveSortOptions, String(sortConfig.field), sortConfig.order);

      // Rest of your existing code...
      const urlFilters = Object.entries(rawUrlFilters).reduce(
        (acc, [key, value]) => {
          const config = filterConfig.find((f) => f.key === key);
          if (config?.type === 'checkbox') {
            acc[key] = Array.isArray(value) ? value : [value];
          } else if (key.endsWith('From') || key.endsWith('To')) {
            acc[key] = Array.isArray(value) ? value[0] : value;
          } else {
            acc[key] = Array.isArray(value) && value.length === 1 ? value[0] : value;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      const urlView = url.searchParams.get('view');
      const sanitizedView = DOMPurify.sanitize(urlView || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      const nextView: ViewMode = ['table', 'cards'].includes(sanitizedView) ? (sanitizedView as ViewMode) : defaultView;

      searchTerm = urlSearchTerm;
      currentInputValue = urlSearchTerm;
      filters = cleanFilters(urlFilters);
      sortField = field;
      sortOrder = order;
      currentView = nextView;

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize from URL:', error);
      return false;
    } finally {
      isApplyingURLState = false;
    }
  }

  // ===== DEBOUNCED FUNCTIONS =====
  const debouncedSearch = debounce((value: string) => {
    // Sanitize here as well to be absolutely sure
    value = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    searchTerm = value;
    if (value.length >= (searchConfig.minSearchLength || 2) && sortField !== 'relevance') {
      sortField = 'relevance';
      sortOrder = 'asc';
    }
  }, 300);

  const debouncedMeasureHeights = debounce(() => {
    const isDesktopSearchVisible = desktopSearchRef && desktopSearchRef.offsetParent !== null && desktopSearchRef.offsetWidth > 0;
    desktopSearchActualHeight = isDesktopSearchVisible ? desktopSearchRef!.offsetHeight : 0;
    calculateHiddenTags();
  }, 50);

  const debouncedCalculateHiddenTags = debounce(() => {
    calculateHiddenTags();
  }, 100);

  const debouncedClearFilterCache = debounce(() => {
    filterCountsCache = {};
    filterCountsCacheVersion++;
  }, 100);

  // ===== LAYOUT CALCULATIONS =====
  function calculateHiddenTags() {
    if (!filterTagsContainerRef || activeFilterTags.length === 0) {
      actuallyHiddenCount = 0;
      shouldShowToggleButton = false;
      return;
    }

    requestAnimationFrame(() => {
      if (!filterTagsContainerRef) return;
      const container = filterTagsContainerRef;
      const tags = container.querySelectorAll('.filter-tag');
      if (tags.length === 0) {
        actuallyHiddenCount = 0;
        shouldShowToggleButton = false;
        return;
      }

      const wasExpanded = showAllTags;
      if (wasExpanded) showAllTags = false;

      setTimeout(() => {
        if (!filterTagsContainerRef) return;
        let hiddenCount = 0;
        const containerRect = container.getBoundingClientRect();
        const maxVisibleBottom = containerRect.top + 40;

        tags.forEach((tag) => {
          const tagRect = tag.getBoundingClientRect();
          if (tagRect.bottom > maxVisibleBottom) hiddenCount++;
        });

        actuallyHiddenCount = hiddenCount;
        shouldShowToggleButton = hiddenCount > 0;
        if (wasExpanded) showAllTags = true;
      }, 10);
    });
  }

  // ===== EXPORT UTILITIES =====
  function generateExportFilename(fileType: 'csv' | 'json'): string {
    const today = new Date().toISOString().split('T')[0];
    let filenameParts: string[] = [];

    if (exportBaseName) filenameParts.push(exportBaseName.replace(/[/\\]/g, '-'));

    const filterValueStrings: string[] = [];
    const processedFilterKeys = new SvelteSet<string>();

    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return;
      if (processedFilterKeys.has(key)) return;

      if (key.endsWith('From')) {
        const baseKey = key.replace('From', '');
        const toKey = `${baseKey}To`;
        const toValue = filters[toKey];
        if (toValue !== null && toValue !== undefined && toValue !== '') {
          filterValueStrings.push(`${String(value).replace(/\s+/g, '-')}_to_${String(toValue).replace(/\s+/g, '-')}`);
          processedFilterKeys.add(toKey);
        } else {
          filterValueStrings.push(`from_${String(value).replace(/\s+/g, '-')}`);
        }
      } else if (key.endsWith('To')) {
        const baseKey = key.replace('To', '');
        if (!filters[`${baseKey}From`] && !processedFilterKeys.has(key)) {
          filterValueStrings.push(`to_${String(value).replace(/\s+/g, '-')}`);
        }
      } else if (Array.isArray(value)) {
        filterValueStrings.push(...value.map((v) => String(v).replace(/\s+/g, '-')));
      } else {
        filterValueStrings.push(String(value).replace(/\s+/g, '-'));
      }
      processedFilterKeys.add(key);
    });

    if (filterValueStrings.length > 0) filenameParts.push(filterValueStrings.join('+'));
    filenameParts.push(today);

    let finalFilename = filenameParts.filter(Boolean).join('+');
    if (!finalFilename) finalFilename = 'export';

    return `${finalFilename}.${fileType}`;
  }

  function handleClickOutside(event: MouseEvent) {
    if (exportDropdownRef && !exportDropdownRef.contains(event.target as Node)) {
      showExportDropdown = false;
    }
  }
  async function handleSearch(event: Event) {
    event.preventDefault();
    // Sanitize search input
    currentInputValue = DOMPurify.sanitize(currentInputValue, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    searchTerm = currentInputValue;
    if (enableURLSync) updateURL();
    await announceResults({ context: 'Search applied' });
  }

  function handleInputChange() {
    // Sanitize on input
    currentInputValue = DOMPurify.sanitize(currentInputValue, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    if (currentInputValue === '' && searchTerm !== '') {
      searchTerm = '';
      sortField = sortConfig.field;
      sortOrder = sortConfig.order;
      if (enableURLSync) updateURL();
    } else {
      debouncedSearch(currentInputValue);
    }
  }

  async function handleFilterChange(newFilters: Record<string, any>) {
    if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
      preserveFocusForFilters(() => {
        filters = cleanFilters(newFilters);
        if (enableURLSync) {
          updateURL();
        }
      });
      await announceResults({ context: 'Filters updated' });
    }
  }

  async function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const [field, order] = target.value.split('-') as [string, SortOrder];
    const selectedOption = effectiveSortOptions.find((opt) => opt.value === target.value);
    const sortLabel = selectedOption?.label || 'Unknown sort';

    sortField = field;
    sortOrder = order;

    if (enableURLSync) {
      updateURL();
    }

    await tick();
    const message = `Results sorted by ${sortLabel}. ${resultCount} ${resultCount === 1 ? 'result' : 'results'} found.`;
    announce(message);

    setTimeout(() => {
      target.focus({ preventScroll: true });
    }, 50);
  }

  function setView(next: ViewMode) {
    if (currentView === next) return;
    currentView = next;
    announce(next === 'table' ? 'Switched to table view' : 'Switched to card view');
    if (enableURLSync) updateURL();
  }

  function handleExportJSON() {
    const filename = generateExportFilename('json');
    exportToJSON(sortedData, filename);
    showExportDropdown = false;
    announce(`Exported ${sortedData.length} results to JSON file`);
  }

  function handleExportCSV() {
    try {
      const filename = generateExportFilename('csv');
      exportToCSV(sortedData, filename);
      showExportDropdown = false;
      announce(`Exported ${sortedData.length} results to CSV file`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      announce('Error exporting CSV file');
    }
  }

  // Add this function with the other export functions
  function handleATOExport() {
    try {
      const filename = generateExportFilename('json').replace('.json', '-ato.json');
      exportATOsToJSON(sortedData, atoMapping, reuseMapping, filename);
      showExportDropdown = false;
      announce(`Exported ATO data for ${sortedData.length} products to JSON file`);
    } catch (error) {
      console.error('Error exporting ATO data:', error);
      announce('Error exporting ATO data');
    }
  }

  function removeFilter(key: string, value: string) {
    const newFilters = { ...filters };

    if (key.endsWith('Range')) {
      const baseKey = key.replace('Range', '');
      delete newFilters[`${baseKey}From`];
      delete newFilters[`${baseKey}To`];
    } else if (key.endsWith('From') || key.endsWith('To')) {
      delete newFilters[key];
    } else if (Array.isArray(newFilters[key])) {
      newFilters[key] = newFilters[key].filter((v: string) => v !== value);
      if (newFilters[key].length === 0) delete newFilters[key];
    } else {
      delete newFilters[key];
    }

    filters = newFilters;
    if (enableURLSync) updateURL();

    setTimeout(() => {
      announce(`Removed filter`);
    }, 100);
  }

  async function clearAllFilters() {
    const filterCount = activeFilterCount;
    filters = {};
    showAllTags = false;
    if (enableURLSync) updateURL();

    await tick();
    announce(`Cleared all ${filterCount} filters`);
  }

  async function clearSearch() {
    announce('Search cleared');

    setTimeout(() => {
      searchTerm = '';
      currentInputValue = '';
      sortField = sortConfig.field;
      sortOrder = sortConfig.order;
      if (enableURLSync) updateURL();
    }, 100);

    setTimeout(() => {
      const searchInput = document.getElementById('universal-search-field-desktop') || document.getElementById('universal-search-field-mobile');
      searchInput?.focus();
    }, 150);
  }

  function toggleShowAllTags() {
    showAllTags = !showAllTags;
    const action = showAllTags ? 'Showing all filter tags' : 'Hiding extra filter tags';
    announce(action);

    setTimeout(() => {
      if (!showAllTags) debouncedCalculateHiddenTags();
    }, 100);
  }

  // ===== REACTIVE EFFECTS =====

  // Handle export dropdown click outside
  $effect(() => {
    if (showExportDropdown) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });

  // Handle table action events
  $effect(() => {
    if (browser && currentView === 'table' && onResultAction) {
      const handleTableAction = (e: Event) => {
        const customEvent = e as CustomEvent;
        const { action, item } = customEvent.detail;
        onResultAction(action, item);
      };
      document.addEventListener('table-action', handleTableAction);
      return () => {
        document.removeEventListener('table-action', handleTableAction);
        if ((window as any).__tableRowData) delete (window as any).__tableRowData;
      };
    }
  });

  // Measure heights and handle resize
  $effect(() => {
    if (browser) {
      const timeoutId = setTimeout(debouncedMeasureHeights, 0);

      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(debouncedMeasureHeights);
        if (desktopSearchRef) resizeObserver.observe(desktopSearchRef);
        window.addEventListener('resize', debouncedMeasureHeights);

        return () => {
          clearTimeout(timeoutId);
          resizeObserver.disconnect();
          window.removeEventListener('resize', debouncedMeasureHeights);
        };
      } else {
        window.addEventListener('resize', debouncedMeasureHeights);
        return () => {
          clearTimeout(timeoutId);
          window.removeEventListener('resize', debouncedMeasureHeights);
        };
      }
    }
  });

  // Calculate hidden tags
  $effect(() => {
    if (activeFilterTags.length > 0) debouncedCalculateHiddenTags();
    else {
      actuallyHiddenCount = 0;
      shouldShowToggleButton = false;
    }
  });

  // Handle filter tags container resize
  $effect(() => {
    if (browser && filterTagsContainerRef && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => debouncedCalculateHiddenTags());
      resizeObserver.observe(filterTagsContainerRef);
      return () => resizeObserver.disconnect();
    }
  });

  // Update filter counts cache
  $effect(() => {
    const cleanedFilters = cleanFilters(filters);
    const cacheKey = JSON.stringify({
      dataLength: data.length,
      dataFirstId: data[0] ? getItemKey(data[0]) : null,
      searchTerm,
      filters: cleanedFilters,
      configKeys: filterConfig.map((f) => f.key).sort()
    });

    if (!filterCountsCache[cacheKey]) {
      const counts = calculateFilterCounts(data, searchTerm, searchConfig, filterConfig, cleanedFilters);
      filterCountsCache = { ...filterCountsCache, [cacheKey]: counts };

      const cacheKeys = Object.keys(filterCountsCache);
      if (cacheKeys.length > 20) {
        const newCache: typeof filterCountsCache = {};
        cacheKeys.slice(-20).forEach((key) => (newCache[key] = filterCountsCache[key]));
        filterCountsCache = newCache;
      }
    }
  });

  // Clear filter cache when data changes
  $effect(() => {
    void data;
    void searchTerm;
    void filterConfig;
    debouncedClearFilterCache();
  });

  // Handle browser back/forward
  $effect(() => {
    if (!browser || !enableURLSync) return;

    const onPopState = () => {
      const url = new URL(window.location.href);
      preserveFocusWhile(() => {
        applyStateFromURL(url);
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  });

  // Clean up undefined filter values
  $effect(() => {
    const cleaned = cleanFilters(filters);
    if (JSON.stringify(cleaned) !== JSON.stringify(filters)) {
      filters = cleaned;
    }
  });
</script>

<div class={containerClass}>
  <!-- Live announcements for screen readers -->
  <div aria-live="polite" class="usa-sr-only" role="status">
    <span>{$liveAnnouncementStore}</span>
  </div>

  <!-- Search Header (Mobile only) -->
  <section class="search-header mobile-only" aria-label="Search controls">
    <div class="mobile-action-buttons">
      <button
        class="usa-button mobile-filter-toggle"
        onclick={() => (showMobileFilters = true)}
        aria-expanded={showMobileFilters}
        aria-label="Open filters and sort menu"
      >
        <svg class="usa-icon" aria-hidden="true">
          <use href={asset('/uswds/img/sprite.svg#filter_list')}></use>
        </svg>
        Filter & Sort
      </button>
    </div>

    <form class="usa-search usa-search--big" role="search" onsubmit={handleSearch}>
      <label class="usa-sr-only" for="universal-search-field-mobile">{searchPlaceholder}</label>
      <input
        class="usa-input"
        id="universal-search-field-mobile"
        type="search"
        name="search"
        placeholder={searchPlaceholder}
        bind:value={currentInputValue}
        oninput={handleInputChange}
      />
      <button class="usa-button" type="submit" aria-label="Execute search">
        <span class="usa-search__submit-text">Search</span>
        <svg class="usa-icon usa-search__submit-icon" aria-hidden="true" focusable="false" role="img">
          <use href={asset('/uswds/img/sprite.svg#search')}></use>
        </svg>
      </button>
    </form>

    {#if hasActiveSearch}
      <div class="active-search" role="status" aria-live="polite">
        <span>Searching for: <strong>{searchTerm}</strong></span>
        <button type="button" class="usa-button usa-button--unstyled" onclick={clearSearch}> Clear search </button>
      </div>
    {/if}
  </section>

  <!-- Main Content -->
  <main id="main-content">
    <div class="grid-row grid-gap">
      <!-- Filters Sidebar -->
      <div class="grid-col-12 desktop:grid-col-3">
        <div class="sidebar">
          <!-- Desktop Search -->
          <div class="desktop-search desktop-only" bind:this={desktopSearchRef}>
            <form class="usa-search usa-search--big" role="search" onsubmit={handleSearch}>
              <label class="usa-sr-only" for="universal-search-field-desktop">{searchPlaceholder}</label>
              <input
                class="usa-input"
                id="universal-search-field-desktop"
                type="search"
                name="search"
                placeholder={searchPlaceholder}
                bind:value={currentInputValue}
                oninput={handleInputChange}
              />
              <button class="usa-button desktop-search-button" type="submit" aria-label="Execute search">
                <span class="usa-search__submit-text">Search</span>
                <svg class="usa-icon usa-search__submit-icon" aria-hidden="true" focusable="false" role="img">
                  <use href={asset('/uswds/img/sprite.svg#search')}></use>
                </svg>
              </button>
            </form>

            {#if hasActiveSearch}
              <div class="active-search" role="status" aria-live="polite">
                <span>Searching for: <strong>{searchTerm}</strong></span>
                <button class="usa-button usa-button--unstyled" onclick={clearSearch}> Clear search </button>
              </div>
            {/if}
          </div>

          <!-- Filters Panel -->
          <div class="filters-panel" class:mobile-hidden={!showMobileFilters} style:top="{filtersPanelStickyTop}px">
            <div class="filters-section">
              <div class="filters-header">
                <h2 class="filters-title">Filter & Sort</h2>
                <div class="mobile-filter-actions">
                  <button
                    type="button"
                    class="usa-button usa-button--unstyled mobile-close"
                    onclick={() => (showMobileFilters = false)}
                    aria-label="Close filters menu"
                  >
                    <svg class="usa-icon" aria-hidden="true">
                      <use href={asset('/uswds/img/sprite.svg#close')}></use>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Active Filter Tags -->
              {#if showFilterTags && activeFilterTags.length > 0}
                <div class="filter-tags-section" role="region" aria-label="Active filters">
                  <div class="filter-tags" class:expanded={showAllTags} bind:this={filterTagsContainerRef}>
                    {#each activeFilterTags as tag (tag.id)}
                      <span class="filter-tag">
                        <span class="filter-tag__text">{tag.label}</span>
                        <button
                          type="button"
                          class="filter-tag__remove"
                          onclick={() => removeFilter(tag.key, tag.value)}
                          aria-label="Remove {tag.label} filter"
                        >
                          <svg class="usa-icon" aria-hidden="true">
                            <use href={asset('/uswds/img/sprite.svg#close')}></use>
                          </svg>
                        </button>
                      </span>
                    {/each}
                  </div>

                  <div class="filter-tag-actions">
                    {#if shouldShowToggleButton}
                      <button class="usa-button usa-button--unstyled view-more-btn" onclick={toggleShowAllTags}>
                        {showAllTags ? 'Show less' : `View ${actuallyHiddenCount} more`}
                      </button>
                    {/if}
                    <button type="button" class="usa-button usa-button--unstyled clear-all-btn" onclick={clearAllFilters}> Clear all filters </button>
                  </div>
                </div>
              {/if}

              <!-- Sort Controls -->
              {#if showSort && effectiveSortOptions.length > 0}
                <div class="sort-controls-section" role="region" aria-label="Sort options">
                  <label for="sort-select-sidebar" class="usa-label sort-label">Sort results by:</label>
                  <select
                    id="sort-select-sidebar"
                    class="usa-select"
                    onchange={handleSortChange}
                    value="{String(sortField)}-{sortOrder}"
                    aria-describedby="sort-description"
                  >
                    {#each effectiveSortOptions as option (option.value)}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                  <div id="sort-description" class="usa-sr-only">
                    Use this dropdown to change how results are sorted. Results will update automatically when you make a selection.
                  </div>
                </div>
              {/if}

              <!-- Filters -->
              <div role="region" aria-label="Search filters">
                <UniversalFilters {data} {filterConfig} {filters} {filterCounts} onchange={handleFilterChange} defaultOpen={true} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile overlay -->
      {#if showMobileFilters}
        <div class="mobile-overlay" onclick={() => (showMobileFilters = false)} aria-hidden="true"></div>
      {/if}

      <!-- Results Section -->
      <div role="region" class="grid-col-12 desktop:grid-col-9 results-column" aria-label="Search results" aria-live="polite" aria-atomic="false">
        <div class="results-container">
          <header class="results-header">
            <h2 class="results-title margin-y-0">
              {#if searchTerm || activeFilterCount > 0}
                {resultCount}
                {resultCount === 1 ? 'result' : 'results'} found
                {#if sortField === 'relevance' && hasActiveSearch}
                  <span class="relevance-indicator">(sorted by relevance)</span>
                {/if}
              {:else}
                All Items ({resultCount} results)
              {/if}
            </h2>

            <div class="results-controls">
              <!-- View Toggle -->
              {#if showCondensedToggle}
                <div class="view-toggle" role="radiogroup" aria-label="View format">
                  <div class="view-toggle-switch">
                    <button
                      type="button"
                      class="view-toggle-option"
                      class:active={currentView === 'cards'}
                      onclick={() => setView('cards')}
                      role="radio"
                      aria-checked={currentView === 'cards'}
                      aria-label="Card view"
                    >
                      <svg class="usa-icon" aria-hidden="true">
                        <use href={asset('/uswds/img/sprite.svg#check_box_outline_blank')}></use>
                      </svg>
                      Card
                    </button>
                    <button
                      type="button"
                      class="view-toggle-option"
                      class:active={currentView === 'table'}
                      onclick={() => setView('table')}
                      role="radio"
                      aria-checked={currentView === 'table'}
                      aria-label="Table view"
                    >
                      <svg class="usa-icon" aria-hidden="true">
                        <use href={asset('/uswds/img/sprite.svg#list')}></use>
                      </svg>
                      Table
                    </button>
                  </div>
                </div>
              {/if}

              <!-- Export Controls -->
              {#if exportAllowed}
                <div class="export-dropdown desktop-export" bind:this={exportDropdownRef}>
                  <button
                    class="usa-button"
                    onclick={() => (showExportDropdown = !showExportDropdown)}
                    aria-expanded={showExportDropdown}
                    aria-label="Export results menu"
                    aria-haspopup="menu"
                  >
                    {exportButtonText}
                    <svg class="usa-icon" aria-hidden="true">
                      <use href={asset('/uswds/img/sprite.svg#expand_more')}></use>
                    </svg>
                  </button>
                  {#if showExportDropdown}
                    <div class="export-dropdown-menu" role="menu">
                      <button class="export-option" role="menuitem" onclick={handleExportJSON}>Export JSON</button>
                      <button class="export-option" role="menuitem" onclick={handleExportCSV}>Export CSV</button>
                      {#if enableATOExport && atoMapping.length > 0}
                        <button class="export-option" role="menuitem" onclick={handleATOExport}>Export ATO Data</button>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </header>

          <!-- Results Content -->
          <div class="results-content">
            {#if showNoExactMatchNotice}
              <div class="usa-alert usa-alert--info usa-alert--slim no-exact-match-notice" role="status">
                <div class="usa-alert__body">
                  <p class="usa-alert__text">
                    Could not find exact match for "{searchTerm}". Showing relevant results.
                  </p>
                </div>
              </div>
            {/if}
            {#if sortedData.length > 0}
              {#if currentView === 'cards'}
                <VList data={sortedData} style="height: 80vh;">
                  {#snippet children(product)}
                    <div class="result-item">
                      {#if resultSnippet}
                        {@render resultSnippet(product, searchTerm)}
                      {:else}
                        <UniversalSearchResult item={product} {searchTerm} template={resultTemplate} onaction={onResultAction} />
                      {/if}
                    </div>
                  {/snippet}
                </VList>
              {:else if showCondensedToggle && currentView === 'table'}
                <div class="table-view-container">
                  <PrettyDataTable
                    data={sortedData}
                    columns={dataTableColumns as ColumnDef<T, any>[]}
                    rowHref={getItemHref}
                    enablePagination={true}
                    onRowClick={!getItemHref && onResultAction ? (row) => onResultAction('view', row) : undefined}
                  />
                </div>
              {/if}
            {:else}
              <!-- No results message -->
              <div class="usa-alert usa-alert--info" role="status">
                <div class="usa-alert__body">
                  <h2 class="usa-alert__heading">No Results Found</h2>
                  <p class="usa-alert__text">
                    {#if searchTerm || activeFilterCount > 0}
                      No items found matching your search criteria. Try adjusting your filters or search terms.
                    {:else}
                      No items available.
                    {/if}
                  </p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  // ===== BASE STYLES =====
  .universal-search {
    width: 100%;
    min-height: 100vh;
  }

  #main-content {
    width: 100%;
  }

  // ===== VISIBILITY HELPERS =====
  .desktop-only {
    display: none;
  }
  .mobile-only {
    display: block;
  }

  @media (min-width: 64em) {
    .desktop-only {
      display: block;
    }
    .mobile-only {
      display: none;
    }
  }

  // ===== MOBILE SEARCH HEADER =====
  .search-header {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 1.5rem 0 1rem;
    background-color: white;
    border-bottom: 1px solid uswds.color('gray-10');
  }

  .mobile-action-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: stretch;

    @media (max-width: 64em) {
      .export-dropdown {
        min-width: 0;

        .usa-button {
          white-space: normal;
        }
      }

      .mobile-filter-toggle {
        white-space: nowrap;
      }
    }
  }

  .mobile-filter-toggle {
    background-color: #f5b755 !important;
    border-color: #f5b755 !important;
    color: uswds.color('ink') !important;
    display: flex !important;
    align-items: center !important;
    gap: 0.5rem !important;

    &:hover {
      background-color: #f2af44 !important;
      border-color: #f2af44 !important;
    }

    .usa-icon {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }
  }

  // ===== SEARCH FORM =====
  .usa-search--big {
    margin: 0 auto 1rem;

    .usa-input,
    .usa-button {
      height: 3rem;
    }

    .usa-input {
      max-width: none;
      font-size: 1.06rem;
    }

    .usa-button {
      padding: 0 2rem;
    }
  }

  .active-search {
    margin-top: 1rem;
    font-size: 0.875rem;

    strong {
      font-weight: 700;
    }

    button {
      color: uswds.color('primary');
      text-decoration: underline;
      margin-left: 0.5rem;

      &:hover {
        color: uswds.color('primary-darker');
        text-decoration: none;
      }
    }
  }

  // ===== DESKTOP SEARCH =====
  .desktop-search {
    position: sticky;
    top: 0;
    z-index: 102;
    background: white;
    padding-bottom: 1rem;
    margin-bottom: 1rem;

    .usa-search--big {
      margin: 0;
      display: flex;

      .usa-input {
        font-size: 1rem;
        flex: 1;
      }

      .desktop-search-button {
        padding: 0 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        height: 3rem;
        min-width: 3rem;

        .usa-search__submit-text {
          @include uswds.at-media(desktop) {
            display: none !important;
          }
        }
        .usa-search__submit-icon {
          width: 1.5rem !important;
          height: 1.5rem !important;
          margin: 0 !important;
          flex-shrink: 0;
          display: block !important;
        }

        svg {
          fill: currentColor;
        }

        &:hover,
        &:focus {
          background-color: uswds.color('primary-darker');
        }
      }
    }
  }

  // ===== SIDEBAR & FILTERS =====
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .filter-tag__text {
    display: inline-block;
    font-size: 0.8rem;
  }

  /* Filters Panel */
  .filters-panel {
    z-index: 101;
    position: sticky;
    background-color: white;
    border: 1px solid uswds.color('gray-30');
    border-radius: 0.5rem;
    max-height: calc(100vh - var(--sticky-top, 120px));
    overflow-y: auto;
    overflow-x: hidden;
    margin-bottom: 2rem;

    @media (min-width: 64em) {
      top: calc(var(--sticky-top, 120px) + 1rem);
    }

    // Mobile styles
    @media (max-width: 64em) {
      position: fixed;
      inset: 0;
      z-index: 200;
      border-radius: 0;
      max-height: 100vh;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
      background-color: #782b65;
      overflow-x: hidden;
      color: white;

      &:not(.mobile-hidden) {
        transform: translateX(0);
      }
    }
  }

  .filters-section {
    padding: 0.75rem 1rem;

    @media (max-width: 64em) {
      background-color: white;
      color: #1b1b1b;
    }
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    @media (max-width: 64em) {
      background-color: #782b65;
      color: white;
      position: sticky;
      top: 0;
      padding: 1rem;
      margin: -1.5rem -1.5rem 1rem -1.5rem;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      z-index: 10;
    }
  }

  .filters-title {
    margin: 0;
    font-size: 1.25rem;
    color: black;

    @media (max-width: 64em) {
      color: white;
    }
  }

  .mobile-filter-actions {
    display: flex;
    align-items: center;
  }

  .mobile-close {
    display: none;
    padding: 0.5rem;
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    color: white;

    @media (max-width: 64em) {
      display: flex;
    }

    .usa-icon {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  // ===== FILTER TAGS =====
  .filter-tags-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid uswds.color('gray-20');
  }

  .filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;

    &:not(.expanded) {
      max-height: 2.5rem;
      overflow: hidden;
    }
  }

  .filter-tag {
    display: inline-flex;
    align-items: center;
    background-color: uswds.color('orange-20');
    color: uswds.color('ink');
    padding: 0.25rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    border: 1px solid uswds.color('orange-30');
    white-space: nowrap;

    &__text {
      padding: 0 0.25rem 0 0.5rem;
    }

    &__remove {
      background: none;
      border: none;
      padding: 0.25rem;
      margin: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: uswds.color('gray-60');
      border-radius: 50%;
      transition: all 0.15s ease;

      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
        color: uswds.color('gray-90');
      }

      .usa-icon {
        width: 0.875rem;
        height: 0.875rem;
      }
    }
  }

  .filter-tag-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .view-more-btn {
    color: uswds.color('primary') !important;
    text-decoration: underline;
    font-size: 0.875rem;

    &:hover {
      color: uswds.color('primary-darker') !important;
      text-decoration: none;
    }
  }

  .clear-all-btn {
    color: uswds.color('error') !important;
    text-decoration: underline;
    font-size: 0.875rem;

    &:hover {
      color: uswds.color('error-darker') !important;
      text-decoration: none;
    }
  }

  // ===== SORT CONTROLS =====
  .sort-controls-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid uswds.color('gray-20');
  }

  .sort-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: uswds.color('ink');
  }

  .usa-select {
    margin: 0;
    width: 100%;
  }

  // ===== MOBILE OVERLAY =====
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 199;
  }

  // ===== RESULTS SECTION =====
  .results-column {
    display: flex;
    flex-direction: column;
  }

  .results-container {
    flex: 1;
  }

  .result-item {
    // Symmetric vertical padding + horizontal breathing room so the
    // result box's hover box-shadow renders inside the virtua-measured
    // row instead of being clipped by / overlapping the adjacent item.
    padding: 0.5rem 0.25rem 0.75rem;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    place-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid uswds.color('gray-30');
    gap: 1rem;

    @media (max-width: 64em) {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .results-title {
    font-size: 1.5rem;
    line-height: 1.3;
    margin: 0;
  }

  .relevance-indicator {
    font-size: 1rem;
    color: uswds.color('gray-60');
    font-weight: normal;
  }

  .results-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;

    @media (max-width: 64em) {
      width: 100%;
      justify-content: space-between;
    }
  }

  // ===== VIEW TOGGLE =====
  .view-toggle-switch {
    display: flex;
    background: uswds.color('gray-5');
    border: 1px solid uswds.color('gray-30');
    border-radius: 0.25rem;
    overflow: hidden;
  }

  .view-toggle-option {
    background: transparent;
    border: none;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    color: uswds.color('gray-60');
    font-size: 0.875rem;

    &:hover {
      color: uswds.color('gray-90');
    }

    &.active {
      background: white;
      color: uswds.color('primary');
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    .usa-icon {
      width: 1rem;
      height: 1rem;
    }
  }

  // ===== EXPORT DROPDOWN =====
  .export-dropdown {
    position: relative;
    display: inline-block;

    .usa-button {
      background-color: uswds.color('primary') !important;
      border-color: uswds.color('primary') !important;
      color: white !important;

      &:hover {
        background-color: uswds.color('primary-darker') !important;
        border-color: uswds.color('primary-darker') !important;
      }

      .usa-icon {
        transition: transform 0.2s ease;
        margin-left: 0.5rem;
      }
    }

    &[aria-expanded='true'] .usa-button .usa-icon {
      transform: rotate(180deg);
    }
  }

  .export-dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    min-width: 160px;
    background: white;
    border: 1px solid uswds.color('gray-30');
    border-radius: 0.25rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    margin-top: 0.25rem;
  }

  .export-option {
    display: flex;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: uswds.color('ink');
    transition: background-color 0.15s ease;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      background-color: uswds.color('gray-5');
    }

    &:first-child {
      border-radius: 0.25rem 0.25rem 0 0;
    }

    &:last-child {
      border-radius: 0 0 0.25rem 0.25rem;
    }

    .usa-icon {
      width: 1rem;
      height: 1rem;
    }
  }

  // ===== RESULTS CONTENT =====
  .results-content {
    min-height: 400px;
  }

  .no-exact-match-notice {
    margin-bottom: 1rem;
  }

  .virtual-scroll-container {
    height: 80vh;
    overflow-y: auto;
  }

  .results-grid {
    display: grid;
    gap: 0;
    grid-template-columns: 1fr;
    // Standard gap below the last result so it doesn't touch the footer
    padding-bottom: 1rem;
  }

  .table-view-container {
    :global(.table-wrapper) {
      width: 100%;
    }

    :global(.usa-table td) {
      :global(mark) {
        background-color: uswds.color('yellow-10');
        color: inherit;
        font-weight: 600;
        padding: 0.1em 0.2em;
        border-radius: 0.125rem;
      }
    }
  }

  // ===== NO RESULTS ALERT =====
  .usa-alert {
    margin: 2rem 0;

    .usa-alert__heading {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
  }

  // ===== ICON SIZING =====
  .usa-icon {
    width: 1.5rem;
    height: 1.5rem;
    fill: currentColor;
  }

  // ===== FOCUS STYLES =====
  .results-container:focus {
    outline: 2px solid uswds.color('primary');
    outline-offset: 2px;
  }
</style>
