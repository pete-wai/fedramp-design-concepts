// $lib/utils/universalSearch.ts
import Fuse from 'fuse.js';
import { SortedBiMultiMap } from '@rimbu/bimultimap';
import DOMPurify from 'dompurify';

export type SortOrder = 'asc' | 'desc';

export interface FilterConfig<T> {
  key: string;
  label: string;
  type: 'checkbox' | 'select' | 'date' | 'dateRange';
  field: keyof T | string | ((item: T) => any);
  filterFn?: (item: T, filterValue: any) => boolean;
  options?: FilterOption[] | ((data: T[]) => FilterOption[]);
  dateFields?: {
    from?: keyof T | string;
    to?: keyof T | string;
  };
  tooltip?: string;
}

export interface FilterOption {
  value: string;
  label: string;
  tooltip?: string;
}

export interface SearchResult<T> {
  item: T;
  score?: number;
}

export interface SearchConfig<T> {
  searchableFields: (keyof T | string)[];
  minSearchLength?: number;
  fuzzySearch?: boolean;
  threshold?: number;
  customSearch?: (items: T[], searchTerm: string) => T[];
  includeScore?: boolean;
  acronymDictionary?: SortedBiMultiMap<string, string>;
  /**
   * Optional predicate used to decide whether the current search term produced
   * an "exact" match (as opposed to a looser/relevant match). When provided and
   * it returns `false` while results still exist, the UI surfaces a
   * "Could not find exact match" notice. Receives the full dataset and the raw
   * search term.
   */
  hasExactMatch?: (items: T[], searchTerm: string) => boolean;
}

// Default FedRAMP acronym dictionary - can be overridden in config
const DEFAULT_ACRONYM_DICTIONARY: SortedBiMultiMap<string, string> = SortedBiMultiMap.of(
  ['csp', 'cloud service provider'],
  ['3pao', 'third party assessment organization'],
  ['ssp', 'system security plan'],
  ['sap', 'security assessment plan'],
  ['sar', 'security assessment results'],
  ['poa&m', 'plan of actions and milestones'],
  ['poam', 'plan of actions and milestones'],
  ['cso', 'cloud service offering'],
  ['ato', 'authority to operate'],
  ['conmon', 'continuous monitoring'],
  ['crm', 'customer responsibility matrix'],
  ['rar', 'readiness assessment report'],
  ['jab', 'joint authorization board'],
  ['isso', 'information system security officer'],
  ['ca', 'certifying authority'],
  ['ao', 'authorizing official']
);

export function normalizeSearch(term: string): string {
  return term.trim().toLowerCase();
}

export function getAllRelatedTerms(term: string, acronymDict: SortedBiMultiMap<string, string> = DEFAULT_ACRONYM_DICTIONARY): string[] {
  const normalized = normalizeSearch(term);
  const related = new Set<string>([normalized]);

  const descriptions = acronymDict.getValues(normalized);
  descriptions.forEach((desc) => related.add(desc));

  const acronyms = acronymDict.getKeys(normalized);
  acronyms.forEach((acronym) => related.add(acronym));

  return Array.from(related);
}

export function searchItemsWithScore<T>(items: T[], searchTerm: string, config: SearchConfig<T>): SearchResult<T>[] {
  const normalizedTerm = normalizeSearch(searchTerm);

  if (!normalizedTerm || normalizedTerm.length < (config.minSearchLength || 2)) {
    return items.map((item) => ({ item }));
  }

  if (config.customSearch) {
    const customResults = config.customSearch(items, normalizedTerm);
    return customResults.map((item) => ({ item }));
  }

  if (config.fuzzySearch !== false) {
    const searchTerms = getAllRelatedTerms(normalizedTerm, config.acronymDictionary);

    const fuse = new Fuse(items, {
      keys: config.searchableFields as string[],
      threshold: config.threshold || 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true
    });

    const results = fuse.search(searchTerms.join(' '));
    return results.map((result) => ({
      item: result.item,
      score: result.score
    }));
  }

  // Simple contains search
  const matchingItems = items.filter((item) => {
    return config.searchableFields.some((field) => {
      const value = getNestedValue(item, field as string);
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedTerm);
      }
      if (Array.isArray(value)) {
        return value.some((v) => String(v).toLowerCase().includes(normalizedTerm));
      }
      return false;
    });
  });

  return matchingItems.map((item) => ({ item }));
}

export function filterItems<T>(items: T[], filters: Record<string, any>, filterConfigs: FilterConfig<T>[]): T[] {
  return items.filter((item) => {
    for (const config of filterConfigs) {
      const filterValue = filters[config.key];

      if (!isValidFilterValue(filterValue)) {
        continue;
      }
      // Use custom filter function if provided
      if (config.filterFn) {
        if (!config.filterFn(item, filterValue)) return false;
        continue;
      }

      // Handle date range filters specially
      if (config.type === 'dateRange') {
        const fromValue = filters[`${config.key}From`];
        const toValue = filters[`${config.key}To`];

        if (fromValue || toValue) {
          const itemValue = typeof config.field === 'function' ? config.field(item) : getNestedValue(item, config.field as string);

          const itemDate = new Date(itemValue);
          if (fromValue && itemDate < new Date(fromValue)) return false;
          if (toValue && itemDate > new Date(toValue)) return false;
        }
        continue;
      }

      // Default filter logic
      const itemValue = typeof config.field === 'function' ? config.field(item) : getNestedValue(item, config.field as string);

      switch (config.type) {
        case 'checkbox': {
          let filterValues: string[];
          if (Array.isArray(filterValue)) {
            filterValues = filterValue;
          } else {
            filterValues = [String(filterValue)]; // Convert single value to array
          }

          if (Array.isArray(itemValue)) {
            const hasMatch = itemValue.some((v) => filterValues.includes(String(v)));
            if (!hasMatch) return false;
          } else {
            if (!filterValues.includes(String(itemValue))) return false;
          }
          break;
        }
        case 'select':
          if (String(itemValue) !== String(filterValue)) return false;
          break;

        case 'date':
          // Single date comparison
          if (new Date(itemValue).toDateString() !== new Date(filterValue).toDateString()) {
            return false;
          }
          break;
      }
    }
    return true;
  });
}

export function sortItemsWithRelevance<T>(
  items: SearchResult<T>[],
  sortField: keyof T | string | 'relevance',
  sortOrder: SortOrder = 'desc'
): SearchResult<T>[] {
  return [...items].sort((a, b) => {
    // Handle relevance sorting
    if (sortField === 'relevance') {
      const scoreA = a.score ?? 1;
      const scoreB = b.score ?? 1;
      if (scoreA < scoreB) return sortOrder === 'asc' ? -1 : 1;
      if (scoreA > scoreB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    }

    // Handle special marketplace date sorting
    if (sortField === 'latest_marketplace') {
      const dateA = getLatestMarketplaceDate(a.item);
      const dateB = getLatestMarketplaceDate(b.item);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const timeA = dateA.getTime();
      const timeB = dateB.getTime();
      if (timeA < timeB) return sortOrder === 'asc' ? -1 : 1;
      if (timeA > timeB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    }

    // Regular field sorting
    const aVal = getNestedValue(a.item, sortField as string);
    const bVal = getNestedValue(b.item, sortField as string);

    // Handle dates
    if (isDateString(aVal) && isDateString(bVal)) {
      const dateA = new Date(aVal);
      const dateB = new Date(bVal);

      const isValidDateA = !isNaN(dateA.getTime());
      const isValidDateB = !isNaN(dateB.getTime());

      if (!isValidDateA && !isValidDateB) {
        // Fall back to relevance
        const scoreA = a.score ?? 1;
        const scoreB = b.score ?? 1;
        return scoreA < scoreB ? -1 : 1;
      }

      if (!isValidDateA) return 1;
      if (!isValidDateB) return -1;

      const timeA = dateA.getTime();
      const timeB = dateB.getTime();
      if (timeA < timeB) return sortOrder === 'asc' ? -1 : 1;
      if (timeA > timeB) return sortOrder === 'asc' ? 1 : -1;

      // Tiebreaker with relevance
      const scoreA = a.score ?? 1;
      const scoreB = b.score ?? 1;
      return scoreA < scoreB ? -1 : 1;
    }

    // Handle strings
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const lowerA = aVal.toLowerCase();
      const lowerB = bVal.toLowerCase();
      if (lowerA < lowerB) return sortOrder === 'asc' ? -1 : 1;
      if (lowerA > lowerB) return sortOrder === 'asc' ? 1 : -1;

      // Tiebreaker with relevance
      const scoreA = a.score ?? 1;
      const scoreB = b.score ?? 1;
      return scoreA < scoreB ? -1 : 1;
    }

    // Handle nullish values
    if (aVal == null && bVal == null) {
      const scoreA = a.score ?? 1;
      const scoreB = b.score ?? 1;
      return scoreA < scoreB ? -1 : 1;
    }
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // Handle numbers and other comparisons
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;

    // Final tiebreaker with relevance
    const scoreA = a.score ?? 1;
    const scoreB = b.score ?? 1;
    return scoreA < scoreB ? -1 : 1;
  });
}

export function calculateFilterCounts<T>(
  data: T[],
  searchTerm: string,
  searchConfig: SearchConfig<T>,
  filterConfig: FilterConfig<T>[],
  currentFilters: Record<string, any>
): Record<string, Record<string, number>> {
  // Apply search first if there's a search term
  let baseData = data;
  if (searchTerm && searchTerm.length >= (searchConfig.minSearchLength || 2)) {
    const searchResults = searchItemsWithScore(data, searchTerm, searchConfig);
    baseData = searchResults.map((r) => r.item);
  }

  const counts: Record<string, Record<string, number>> = {};

  filterConfig.forEach((config) => {
    counts[config.key] = {};

    // Get options for this filter
    let options: { value: string; label: string }[];
    if (typeof config.options === 'function') {
      options = config.options(data);
    } else if (Array.isArray(config.options)) {
      options = config.options;
    } else {
      // Generate options from data
      const uniqueValues = extractUniqueValues(data, config.field);
      options = uniqueValues.map((value) => ({ value, label: value }));
    }

    // Calculate counts for each option
    //
    // Count semantics for multi-select checkbox categories:
    //  - No selection yet in this category  -> absolute count of items matching
    //    this option (AND-combined with filters in OTHER categories).
    //  - Category already has a selection, option NOT selected -> ADDITIVE DELTA:
    //    how many NEW items checking this option would add on top of the current
    //    selection, i.e. |current ∪ option| − |current|. Rendered as "+N".
    //    Computing a true set difference (rather than the option's standalone
    //    count) is important for categories whose items can match multiple
    //    values (e.g. business categories), where standalone counts would
    //    overlap and overcount.
    //  - Option IS selected -> current filtered total (so unchecking is legible).
    options.forEach((option) => {
      // Create test filters by adding the current option
      const testFilters = { ...currentFilters };

      // Skip if this filter is already applied with this value
      if (config.type === 'checkbox') {
        const currentValues = currentFilters[config.key] || [];
        const hasSelectionInCategory = Array.isArray(currentValues) && currentValues.length > 0;

        // If this value is already selected, count should be the current filtered count
        if (Array.isArray(currentValues) && currentValues.includes(option.value)) {
          // Just use the current filtered data count
          const currentFilteredData = filterItemsForCount(baseData, currentFilters, filterConfig);
          counts[config.key][option.value] = currentFilteredData.length;
          return;
        }

        // Add this option to the test (union with any current same-category values)
        testFilters[config.key] = [...currentValues, option.value];
        const unionCount = filterItemsForCount(baseData, testFilters, filterConfig).length;

        if (hasSelectionInCategory) {
          // Additive delta: new items this option contributes over the current
          // same-category selection. Isolate the category by counting the
          // current selection alone (with all other categories still applied).
          const currentSelectionCount = filterItemsForCount(baseData, currentFilters, filterConfig).length;
          counts[config.key][option.value] = unionCount - currentSelectionCount;
        } else {
          counts[config.key][option.value] = unionCount;
        }
        return;
      }

      // For select/radio, just set the value
      testFilters[config.key] = option.value;

      // Count items that would match with this filter applied
      const filteredData = filterItemsForCount(baseData, testFilters, filterConfig);
      counts[config.key][option.value] = filteredData.length;
    });
  });

  return counts;
}

// Helper function specifically for counting (without logs)
function filterItemsForCount<T>(items: T[], filters: Record<string, any>, filterConfigs: FilterConfig<T>[]): T[] {
  return items.filter((item) => {
    for (const config of filterConfigs) {
      const filterValue = filters[config.key];

      // Skip invalid filter values
      if (!isValidFilterValue(filterValue)) {
        continue;
      }

      // Use custom filter function if provided
      if (config.filterFn) {
        if (!config.filterFn(item, filterValue)) {
          return false;
        }
        continue;
      }

      // Handle date range filters
      if (config.type === 'dateRange') {
        const fromValue = filters[`${config.key}From`];
        const toValue = filters[`${config.key}To`];

        if (fromValue || toValue) {
          const itemValue = typeof config.field === 'function' ? config.field(item) : getNestedValue(item, config.field as string);
          const itemDate = new Date(itemValue);

          if (fromValue && itemDate < new Date(fromValue)) return false;
          if (toValue && itemDate > new Date(toValue)) return false;
        }
        continue;
      }

      // Get item value
      const itemValue = typeof config.field === 'function' ? config.field(item) : getNestedValue(item, config.field as string);

      // Apply filter based on type
      switch (config.type) {
        case 'checkbox': {
          const filterValues = Array.isArray(filterValue) ? filterValue : [filterValue];

          if (Array.isArray(itemValue)) {
            // Item has multiple values, check if any match
            const hasMatch = itemValue.some((v) => filterValues.includes(String(v)));
            if (!hasMatch) return false;
          } else {
            // Item has single value
            if (!filterValues.includes(String(itemValue))) return false;
          }
          break;
        }

        case 'select':
          if (String(itemValue) !== String(filterValue)) return false;
          break;

        case 'date':
          if (new Date(itemValue).toDateString() !== new Date(filterValue).toDateString()) {
            return false;
          }
          break;
      }
    }

    return true;
  });
}

// Helper functions
function getNestedValue(obj: any, path: string | keyof any): any {
  // Handle non-string paths (direct property access)
  if (typeof path !== 'string') {
    return obj?.[path];
  }

  // Handle string paths with dot notation
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function isDateString(value: any): boolean {
  if (typeof value !== 'string') return false;
  if (!value.trim()) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && (value.includes('-') || value.includes('/') || value.includes(' '));
}

export function isValidFilterValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

export function getActiveFilterCount(filters: Record<string, any>): number {
  let count = 0;
  Object.values(filters).forEach((value) => {
    if (isValidFilterValue(value)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else {
        count += 1;
      }
    }
  });
  return count;
}

export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function highlightSearchTerms(text: string, searchTerm: string): string {
  if (!text || !searchTerm?.trim()) return text || '';
  const escapedTerm = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

export function extractUniqueValues<T>(items: T[], field: keyof T | string | ((item: T) => any)): string[] {
  const values = new Set<string>();
  items.forEach((item) => {
    const value = typeof field === 'function' ? field(item) : getNestedValue(item, field as string);
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v != null) values.add(String(v));
      });
    } else if (value != null) {
      values.add(String(value));
    }
  });
  return Array.from(values).sort();
}

// Special marketplace date handling (prioritized per marketplace rules)
export function getLatestMarketplaceDate(item: any): Date | null {
  // Priority order (first non-null valid date wins):
  // 1) cert_date
  // 2) ip_pmo_date
  // 3) ip_prog_date2
  // 4) ip_prog_date
  // 5) ip_agency_date
  // 6) ready_date
  // 7) ip_jab_date
  const fieldsInOrder = ['cert_date', 'ip_pmo_date', 'ip_prog_date2', 'ip_prog_date', 'ip_agency_date', 'ready_date', 'ip_jab_date'];

  for (const field of fieldsInOrder) {
    const value = getNestedValue(item, field);
    if (value == null || value === '') continue;

    let date: Date | null;
    if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }

    if (date && !isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

// URL parameter helpers (from DocumentSearch)
export function filtersToURLParams(filters: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (isValidFilterValue(value)) {
      if (Array.isArray(value)) {
        // Always join arrays with commas
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    }
  });

  return params;
}

export function urlParamsToFilters(
  searchParams: URLSearchParams,
  filterConfig: FilterConfig<any>[],
  data: any[] = [] // Add data parameter for dynamic options
): Record<string, any> {
  const filters: Record<string, any> = {};
  const allowedKeys = filterConfig.map((f) => f.key);

  for (const [key, value] of searchParams.entries()) {
    if (key === 'q' || key === 'sort' || key === 'view') continue;

    // Only process allowed filter keys
    if (!allowedKeys.includes(key)) {
      console.warn(`Ignoring invalid filter key: ${key}`);
      continue;
    }

    // Find the filter config for this key
    const config = filterConfig.find((f) => f.key === key);
    if (!config) continue;

    // Sanitize the value
    const sanitizedValue = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    // Get allowed values for this filter
    let allowedValues: string[] = [];
    if (config.options) {
      const options = typeof config.options === 'function' ? config.options(data) : config.options;
      allowedValues = options.map((opt) => opt.value);
    }

    // Parse and validate values
    if (sanitizedValue.includes(',')) {
      const values = sanitizedValue
        .split(',')
        .map((v: string) => v.trim())
        .filter((v: string) => v);
      // Only keep values that are in the allowed list (if allowedValues exists)
      const validValues = allowedValues.length > 0 ? values.filter((v: string) => allowedValues.includes(v)) : values;

      if (validValues.length > 0) {
        filters[key] = validValues;
      } else {
        console.warn(`Ignoring invalid filter values for ${key}: ${values.join(', ')}`);
      }
    } else {
      // Single value - check if it's allowed
      if (allowedValues.length === 0 || allowedValues.includes(sanitizedValue)) {
        filters[key] = [sanitizedValue];
      } else {
        console.warn(`Ignoring invalid filter value for ${key}: ${sanitizedValue}`);
      }
    }
  }

  return filters;
}

export function parseSortFromURL(
  sortParam: string | null,
  allowedSortOptions: { value: string; label: string }[] = [],
  defaultField: string = 'date',
  defaultOrder: SortOrder = 'desc'
): { field: string; order: SortOrder } {
  if (!sortParam) {
    return { field: defaultField, order: defaultOrder };
  }

  // Sanitize the input
  const sanitizedParam = DOMPurify.sanitize(sortParam, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  // Check if this sort option is in the allowed list
  if (allowedSortOptions.length > 0 && !allowedSortOptions.some((opt) => opt.value === sanitizedParam)) {
    console.warn(`Ignoring invalid sort option: ${sanitizedParam}`);
    return { field: defaultField, order: defaultOrder };
  }

  const [field, order] = sanitizedParam.split('-') as [string, SortOrder];

  // Basic validation for field and order structure
  if (!field || !order || !['asc', 'desc'].includes(order)) {
    console.warn(`Invalid sort format: ${sanitizedParam}`);
    return { field: defaultField, order: defaultOrder };
  }

  return { field, order };
}

// Assessor-specific helpers (keep if needed for marketplace assessors)
export function extractAssessorImpactLevels(assessors: any[]): string[] {
  const levels = new Set<string>();
  for (const assessor of assessors) {
    for (const client of assessor.clients || []) {
      if (client.impact_level) levels.add(client.impact_level);
    }
  }
  return Array.from(levels).sort();
}

export function extractAssessorOfferingStatuses(assessors: any[]): string[] {
  const statuses = new Set<string>();
  for (const assessor of assessors) {
    for (const client of assessor.clients || []) {
      if (client.status) statuses.add(client.status);
    }
  }
  return Array.from(statuses).sort();
}

export function assessorHasImpactLevel(assessor: any, level: string): boolean {
  return (assessor.clients || []).some((client: any) => client.impact_level === level);
}

export function assessorHasOfferingStatus(assessor: any, status: string): boolean {
  return (assessor.clients || []).some((client: any) => client.status === status);
}

export function advisorHasImpactLevel(advisor: any, level: string): boolean {
  return (advisor.clients || []).some((client: any) => client.impact_level === level);
}

export function advisorHasOfferingStatus(advisor: any, status: string): boolean {
  return (advisor.clients || []).some((client: any) => client.status === status);
}
