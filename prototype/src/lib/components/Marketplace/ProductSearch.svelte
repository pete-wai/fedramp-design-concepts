<!-- lib/components/Marketplace/ProductSearch.svelte -->
<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import MarketplaceSearch from './MarketplaceSearch.svelte';
  import MarketplaceSearchResult from './MarketplaceSearchResult.svelte';
  import type { Product, FedRAMPData, ATO, ReuseATO, ProductCertClass } from '$lib/types/marketplace';
  import type { SearchConfig, FilterConfig } from '$lib/utils/universalSearch';
  import { prioritizedProductSearch, hasExactOrWordMatch } from '$lib/utils/productSearch';
  import { asset, resolve } from '$lib/utils/paths';
  import { displayCertStatus, displayCertType, is20xCertType, displayCertClass } from '$lib/utils/marketplaceDisplay';
  import UniversalSearchSkeleton from './UniversalSearchSkeleton.svelte';
  import type { ProductCertStatus, ProductCertType } from '$lib/types/marketplace';
  import { PRODUCT_CERT_STATUSES } from '$lib/schemas/marketplace';
  // props
  interface Props {
    onProductSelect?: (product: Product) => void;
    data?: FedRAMPData;
  }

  let { onProductSelect, data }: Props = $props();

  const products = $derived((data?.data?.Products as Product[]) ?? []);
  const atoMapping = $derived((data?.data?.AtoMapping as ATO[]) ?? []);
  const reuseMapping = $derived((data?.data?.ReuseMapping as ReuseATO[]) ?? []);

  let isLoading = $state(true);

  // Certification Status options are a static, canonical list (like Deployment
  // Model) rather than being derived from the products present in the data. This
  // way every real marketplace status always appears in the filter — statuses
  // with 0 matching products render disabled with a "(0)" badge instead of
  // disappearing. Sourced from ProductCertStatusSchema so it stays in sync with
  // the data model. `Unknown` and `Delisted` are excluded: they are not
  // user-facing marketplace statuses (Delisted/Unknown products are filtered out
  // before render), so surfacing them as filters would be misleading.
  const HIDDEN_STATUS_FILTERS = new Set<ProductCertStatus>(['Unknown', 'Delisted']);
  const statusOptions = PRODUCT_CERT_STATUSES.filter((status) => !HIDDEN_STATUS_FILTERS.has(status)).map((status) => ({
    value: status,
    label: displayCertStatus(status)
  }));

  const businessCategoryOptions = $derived.by(() => {
    const f = new SvelteSet<string>();
    products.forEach((p: Product) => {
      if (Array.isArray(p.business_categories)) {
        p.business_categories.forEach((bf: string) => {
          if (bf) f.add(bf);
        });
      }
    });
    return Array.from(f)
      .sort()
      .map((v) => ({ value: v, label: v }));
  });
  // Navigation function for card clicks
  function handleCardClick(product: Product, event: Event) {
    // Prevent navigation if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    // Navigate to product detail page
    window.location.href = resolve(`/marketplace/products/${product.id}`);
    onProductSelect?.(product);
  }

  // Fields searched, in priority order, for every search tier. Each entry maps
  // to the underlying product key(s) searched. The tiers are evaluated in this
  // order — exact, word, contains, then fuzzy — see `prioritizedProductSearch`
  // in $lib/utils/productSearch.
  // Search configuration
  const searchConfig: SearchConfig<Product> = {
    searchableFields: [
      'id',
      'csp',
      'cso',
      'cert_class',
      'service_desc',
      'partnering_agency',
      'independent_assessor',
      'business_categories',
      'service_last_90',
      'all_others'
    ],
    minSearchLength: 2,
    fuzzySearch: true,
    threshold: 0.3,
    includeScore: true,
    customSearch: prioritizedProductSearch,
    hasExactMatch: hasExactOrWordMatch
  };
  const reactiveFilterConfig = $derived([
    {
      key: 'status',
      label: 'Certification Status',
      type: 'checkbox' as const,
      field: 'status',
      options: statusOptions
    },
    {
      key: 'business_categories',
      label: 'Business Categories',
      type: 'checkbox' as const,
      field: 'business_categories',
      filterFn: (item, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
        return Array.isArray(item.business_categories) && item.business_categories.some((func) => filterValue.includes(func));
      },
      options: businessCategoryOptions
    },
    {
      key: 'cert_class',
      label: 'Cert Class',
      type: 'checkbox' as const,
      field: 'cert_class',
      filterFn: (item, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
        return filterValue.includes(item.cert_class);
      },
      options: [
        { value: 'Class A', label: 'Class A (Pilot)' },
        { value: 'Class B', label: 'Class B (Low)' },
        { value: 'Class C', label: 'Class C (Moderate)' },
        { value: 'Class D', label: 'Class D (High)' }
      ],
      tooltip: 'Read more about the new security impact classes in the Consolidated Ruleset for 2026.'
    },
    {
      key: 'cert_type',
      label: 'Certification Type',
      type: 'checkbox' as const,
      field: 'cert_type',
      // Values MUST match the canonical cert_type enum casing exactly
      // ('Rev5', not 'rev5'), since the filter does an exact string match. A
      // filterFn keeps the Pilot variants grouped under their base type.
      filterFn: (item, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
        return filterValue.some((selected) => {
          if (selected === '20x') return item.cert_type === '20x' || item.cert_type === '20x Pilot';
          if (selected === 'Rev5') return item.cert_type === 'Rev5' || item.cert_type === 'Rev5 Pilot';
          return item.cert_type === selected;
        });
      },
      options: [
        { value: '20x', label: '20x' },
        { value: 'Rev5', label: 'Rev5' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      type: 'checkbox' as const,
      field: 'category',
      filterFn: (item, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
        return filterValue.some((category) => {
          switch (category) {
            case 'By Government': {
              const csp = item.csp.toLowerCase();
              return (
                csp.startsWith('department of ') ||
                csp.startsWith('dept of ') ||
                csp.startsWith('u.s. ') ||
                csp.startsWith('united states ') ||
                csp.includes('general services administration') ||
                csp.includes('.gov') ||
                csp.includes('.mil')
              );
            }
            default: {
              return false;
            }
          }
        });
      },
      options: [{ value: 'By Government', label: 'By Government, For Government' }]
    },
    {
      key: 'service_model',
      label: 'Service Model',
      type: 'checkbox' as const,
      field: 'service_model',
      filterFn: (item, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
        return Array.isArray(item.service_model) && item.service_model.some((model) => filterValue.includes(model));
      },
      options: [
        { value: 'SaaS', label: 'SaaS' },
        { value: 'PaaS', label: 'PaaS' },
        { value: 'IaaS', label: 'IaaS' }
      ]
    },
    {
      key: 'deployment_model',
      label: 'Deployment Model',
      type: 'checkbox' as const,
      field: 'deployment_model',
      options: [
        { value: 'Public Cloud', label: 'Public Cloud' },
        { value: 'Private Cloud', label: 'Private Cloud' },
        { value: 'Government Community Cloud', label: 'Government Community Cloud' },
        { value: 'Hybrid Cloud', label: 'Hybrid Cloud' }
      ]
    }
  ] satisfies FilterConfig<Product>[]);
  // Sort options
  const sortOptions = [
    { value: 'latest_marketplace-desc', label: 'Latest on Marketplace' },
    { value: 'authorization-desc', label: 'Most Authorizations' },
    { value: 'cert_date-desc', label: 'Newest Certified' },
    { value: 'cert_date-asc', label: 'Oldest Certified' },
    { value: 'cso-asc', label: 'Name Ascending (A-Z)' },
    { value: 'cso-desc', label: 'Name Descending (Z-A)' }
  ];
  // Handle product selection
  function handleProductAction(action: string, product: Product) {
    if (action === 'view') onProductSelect?.(product);
  }
  // New helper function to get status icon
  // TODO: TO CHANGE when we standardize statuses
  function getStatusIcon(status: ProductCertStatus): string {
    const statusIconMap: Record<ProductCertStatus, string> = {
      'FedRAMP Certified': 'authorized_status',
      'FedRAMP Certified (In Remediation)': 'authorized_status',
      'Initial Implementation': 'one_quarter_progress_status',
      'Legacy FedRAMP Ready': 'one_quarter_progress_status',
      'Agency Authorization In Process': 'half_progress_status',
      'FedRAMP In Process': 'three_quarters_progress_status',
      Delisted: '',
      Unknown: ''
    };
    return statusIconMap[status] || '';
  }

  const exportBaseName = 'products';

  $effect(() => {
    if (products.length > 0) {
      isLoading = false;
    }
  });
</script>

<div class="marketplace-search-wrapper">
  {#if isLoading}
    <UniversalSearchSkeleton cardCount={6} filterGroupCount={7} />
  {:else}
    <MarketplaceSearch
      data={products}
      {searchConfig}
      filterConfig={reactiveFilterConfig}
      {sortOptions}
      searchPlaceholder="Search products"
      resultTemplate="custom"
      onResultAction={handleProductAction}
      enableATOExport={true}
      {atoMapping}
      {reuseMapping}
      sortConfig={{ field: 'latest_marketplace', order: 'desc' }}
      {exportBaseName}
      enableURLSync={true}
      showCondensedToggle={true}
      defaultView="cards"
      condensedViewColumns={[
        {
          key: 'id',
          label: 'ID',
          sortable: true
        },
        { key: 'csp', label: 'CSP', sortable: true },
        { key: 'cso', label: 'Cloud Offering', sortable: true },
        {
          key: 'cert_type',
          label: 'Type',
          sortable: true,
          tooltip: 'Indicates whether the product is certified under the 20x persistent validation or Rev5 continuous monitoring framework.',
          customRender: (value: string) => {
            if (!value) return '';
            const displayValue = displayCertType(value as ProductCertType);
            const styles = is20xCertType(value as ProductCertType)
              ? 'padding: 0.25rem 0.75rem; border-radius: 0.4rem; font-size: 0.875rem; font-weight: 700; border: 2px solid rgb(110, 22, 78); background-color: rgba(110, 22, 78, 0.1); color: rgb(110, 22, 78);'
              : 'padding: 0.25rem 0.75rem; border-radius: 0.4rem; font-size: 0.875rem; font-weight: 700; border: 2px solid rgb(201, 70, 38); background-color: rgba(201, 70, 38, 0.1); color: rgb(201, 70, 38);';
            return `<span style="${styles}"><span>${displayValue}</span></span>`;
          }
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          tooltip: 'The current certification status of the product (Certified, In Process, Preparation, etc.).',
          customRender: (value: ProductCertStatus) => {
            if (!value) return '';
            return displayCertStatus(value);
          }
        },
        {
          key: 'cert_class',
          label: 'Class',
          sortable: true,
          tooltip:
            'The highest certification level of the product, categorized by the new security impact classes (Class A, B, C, D) in the Consolidated Ruleset for 2026.',
          customRender: (value: ProductCertClass) => {
            if (!value) return '';
            return displayCertClass(value);
          }
        },
        {
          key: 'authorization',
          label: 'Auths',
          sortable: true,
          tooltip: 'The total number of authorization letters issued for this product.'
        },
        {
          key: 'reuse',
          label: 'Uses',
          sortable: true,
          tooltip:
            'The number of ATO letters (initial and reuse) plus the number of ATO letters (initial and reuse) for certified services leveraging this offering.'
        }
      ]}
      getItemHref={(product) => resolve(`/marketplace/products/${product.id}`)}
    >
      {#snippet resultSnippet(product: Product, searchTerm: string)}
        <MarketplaceSearchResult item={product} {searchTerm} template="custom" onaction={handleProductAction}>
          {#snippet custom({ searchTerm, highlight }: { searchTerm: string; highlight: (text: string, query: string) => string })}
            <!-- Clickable card wrapper -->
            <!-- For screen readers, aria-hidden="true" on the wrapper so that it will read the contents inside -->
            <div
              class="fedramp-product-result {product.cert_type ? `fedramp-product-result--${displayCertType(product.cert_type)}` : ''}"
              onclick={(event) => handleCardClick(product, event)}
              role="button"
              tabindex="0"
              onkeydown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleCardClick(product, event);
                }
              }}
              aria-hidden="true"
            >
              <!-- Certification Type Tag (upper right) -->
              <div class="product-right-column">
                <!-- Certification Type Tag -->
                {#if product.cert_type}
                  <div class="auth-tag auth-tag--{displayCertType(product.cert_type)}">
                    <span>{displayCertType(product.cert_type)}</span>
                  </div>
                {/if}
                <!-- Logo -->
                {#if product.logo}
                  <div class="product-logo">
                    <img src={asset(product.logo.toString())} alt="{product.cso} logo" loading="lazy" decoding="async" />
                  </div>
                {/if}
              </div>
              <!-- Left Column -->
              <div class="product-left-column">
                <!-- CSP Name (smaller font) -->
                <div class="product-csp">
                  {@html highlight(product.csp, searchTerm)}
                </div>
                <!-- CSO Name (bigger font) -->
                <h3 class="product-cso">
                  {@html highlight(product.cso, searchTerm)}
                </h3>
                <!-- Status and Impact Level Badge and Package ID Row -->
                <div class="status-badges-row">
                  <!-- Status Badge -->
                  <div class="fedramp-info-badge">
                    <img
                      class="usa-icon status-icon"
                      src={asset(`/marketplace-icons/${getStatusIcon(product.status)}.svg`)}
                      alt=""
                      aria-hidden="true"
                    />
                    <span class="fedramp-info-badge-text">
                      {displayCertStatus(product.status)}
                    </span>
                  </div>
                  <div class="fedramp-info-badge">
                    <img class="usa-icon status-icon" src={asset('/marketplace-icons/impact_level.svg')} alt="" aria-hidden="true" />
                    <span class="fedramp-info-badge-text-small">
                      <b>{displayCertClass(product.cert_class)}</b> Certification
                    </span>
                  </div>
                  <div class="fedramp-info-badge">
                    <img class="usa-icon status-icon" src={asset('/marketplace-icons/package_id.svg')} alt="" aria-hidden="true" />
                    <span class="fedramp-info-badge-text" aria-label="FedRAMP Package ID {product.id}">{@html highlight(product.id, searchTerm)}</span
                    >
                  </div>
                </div>
                <!-- Authorizations and Reuse Counts-->
                <div class="authorizations-reuse-counts">
                  <div class="count-item">
                    <span class="count-number">{product.authorization}</span>
                    <span class="count-label">Authorizations</span>
                  </div>
                  <div class="count-item">
                    <span class="count-number">{product.reuse}</span>
                    <span class="count-label">Reuses</span>
                  </div>
                </div>
                <span class="usa-sr-only">Click button to see {product.cso} product page</span>
              </div>
            </div>
          {/snippet}
        </MarketplaceSearchResult>
      {/snippet}
    </MarketplaceSearch>
  {/if}
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .marketplace-search-wrapper {
    min-height: 80vh;
  }

  .fedramp-product-result {
    background: white;
    border: 1px solid uswds.color('gray-30');
    border-radius: 0.5rem;
    padding: 0.5rem;
    padding-left: 1rem;
    display: flex;
    flex-direction: row;
    gap: 2rem;
    min-height: 100px;
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: uswds.color('primary-light');
      transform: translateY(-1px);
    }

    &:focus {
      outline: 2px solid uswds.color('primary');
      outline-offset: 2px;
    }

    // Left border styling for auth categories
    &--20x {
      border-left: 6px solid #6e164e; // 20x purple color

      &:hover {
        border-left-color: #6e164e; // Maintain the left border color on hover
      }
    }

    &--rev5 {
      border-left: 6px solid #c94626; // Rev5 red/orange color

      &:hover {
        border-left-color: #c94626; // Maintain the left border color on hover
      }
    }
  }

  // Authorization tag (upper right corner)
  .auth-tag {
    align-self: flex-end; // Align to the right within the column
    padding: 0.25rem 0.75rem;
    border-radius: 0.4rem;
    font-size: 0.875rem;
    font-weight: 700;

    &--20x {
      border-color: rgb(110, 22, 78);
      border: 2px solid;
      background-color: rgb(110, 22, 78, 0.1);
      color: rgb(110, 22, 78);
    }

    &--rev5 {
      border-color: rgb(201, 70, 38);
      border: 2px solid;
      background-color: rgb(201, 70, 38, 0.1);
      color: rgb(201, 70, 38);
    }

    span {
      line-height: 1;
    }
  }

  // Right Column Styles (logo only now)
  .product-right-column {
    flex: 0 0 200px; // Reduced from 280px since no status row
    display: flex;
    gap: 1rem;
    flex-direction: column;
    order: 2; // Desktop order
  }

  // Left Column Styles
  .product-left-column {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 0.3rem; // Increased gap for better spacing
    min-width: 0;
    order: 1; // Desktop order
  }

  .product-csp {
    font-size: 1rem;
    color: black;
    font-weight: 800;
    margin-bottom: 0.25rem;

    :global(mark) {
      color: inherit !important;
    }
  }

  .product-cso {
    font-size: 1.25rem;
    font-weight: 100;
    color: uswds.color('primary-darker') !important;
    margin: 0 0 0.75rem 0;
    line-height: 1.2;

    :global(mark) {
      color: inherit !important;
    }
  }

  // Status badges row
  .status-badges-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 0rem;
    --status-badges-gap: 0.75rem;
    gap: var(--status-badges-gap);
    @media (max-width: 768px) {
      --status-badges-gap: 0rem;
    }
  }
  .status-badges-row > *:first-child {
    margin-left: calc(var(--status-badges-gap) * -1);
  }

  // Status + Impact Level + Package ID badge
  .fedramp-info-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    border-radius: 0.25rem;
    font-weight: 600;
    font-size: 0.875rem;

    .status-icon {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }
  }

  .fedramp-info-badge-text {
    font-weight: 400;
    background: none !important; // Override any tag background
    padding: 0 !important; // Override any tag padding
  }
  .fedramp-info-badge-text-small {
    font-weight: 200;
    background: none !important; // Override any tag background
    padding: 0 !important; // Override any tag padding
  }

  // Authorizations and Reuse Counts
  .authorizations-reuse-counts {
    padding-top: 0.6rem;
    display: flex;
    gap: 1rem; // Space between the two counts
    border-top: uswds.color('gray-20') solid 1px;
  }

  .count-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .count-number {
    font-size: 1.2rem; // Adjust as needed
    font-weight: bold;
    color: uswds.color('primary-darker');
  }

  .count-label {
    font-size: 0.95rem;
    color: uswds.color('gray-60');
  }

  .categories-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: center;
  }

  .category-tag {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    background-color: uswds.color('gray-5');
    color: uswds.color('gray-70') !important;
    border: 1px solid uswds.color('gray-20');
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .category-toggle {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    background: transparent;
    color: uswds.color('primary') !important;
    border: 1px dashed uswds.color('primary-light');
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: uswds.color('primary-lighter');
      border-style: solid;
    }
  }

  .product-logo {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: none;
    /* removed border per request */
    border-radius: 0.5rem;
    padding: 0.5rem;
    min-height: 120px;
    max-height: 120px;
    overflow: hidden;

    img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
    }

    .logo-date {
      display: none;
      /* show on mobile only via media query */
      margin-top: 0.5rem;
      text-align: center;
      width: 100%;
    }

    .logo-date-text {
      color: uswds.color('gray-60');
      font-style: italic;
      font-size: 0.85rem;
    }
  }

  // Ensure highlighted search terms are visible
  :global(mark) {
    background-color: uswds.color('yellow-20');
    padding: 0.1em 0.2em;
    border-radius: 0.125rem;
    font-weight: 500;
  }

  // Mobile responsive styles
  @media (max-width: 768px) {
    .fedramp-product-result {
      flex-direction: column;
      gap: 0.75rem;
      min-height: auto;
      padding: 1.5rem;

      // Keep the left border on mobile but make it thinner
      &--20x,
      &--rev5 {
        border-left-width: 4px;
      }
    }

    // Auth tag positioning on mobile
    .auth-tag {
      align-self: flex-end;
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
    }

    // Hide CSP name on mobile
    .desktop-only {
      display: none;
    }

    // Reverse order on mobile - right column first
    .product-right-column {
      flex: 0 0 100px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      order: 2; // Desktop order
    }

    .product-left-column {
      order: 2; // Second on mobile
    }

    .product-logo {
      max-height: 100px;
    }

    /* Show logo date on mobile and hide date-text on mobile */
    .logo-date {
      display: block;
    }

    .date-text {
      display: none;
    }

    // Stack status badges vertically on mobile if needed
    .status-badges-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    // Make badges full width on mobile
    .fedramp-info-badge,
    .continuous-monitoring-badge {
      width: 100%;
      justify-content: flex-start;
    }

    // Business categories stay at bottom on mobile too
    .business-categories {
      margin-top: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid uswds.color('gray-20');
    }
  }
</style>
