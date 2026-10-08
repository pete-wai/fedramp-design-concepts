<!-- routes/marketplace/(pages)/products/[frid]/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  import ProductHeader from '$lib/components/Marketplace/ProductHeader.svelte';
  import ProductOverviewTab from '$lib/components/Marketplace/ProductOverviewTab.svelte';
  import ProductAuthDetailsTab from '$lib/components/Marketplace/ProductAuthDetailsTab.svelte';
  import ProductDepProductsTab from '$lib/components/Marketplace/ProductDepProductsTab.svelte';
  import ProductEventLogTab from '$lib/components/Marketplace/ProductEventLogTab.svelte';
  import USABreadcrumb from '$lib/components/USABreadcrumb.svelte';
  import MarketplaceTabs from '$lib/components/Marketplace/MarketplaceTabs.svelte';

  let { data }: { data: PageData } = $props();

  const product = $derived(data.product);

  let tabs = [
    { name: 'Overview', id: 'overview' },
    { name: 'Agency Authorization Details', id: 'auth_details' },
    { name: 'Dependent Products', id: 'dep_products' },
    { name: 'Certification History', id: 'event_log' }
  ];

  let currTab: string | undefined = $state();

  // let conMonMeetingDate: Date = $state(new Date(0));
</script>

<svelte:head>
  <title>{product.cso} | FedRAMP Marketplace</title>
</svelte:head>

<div id="product-detail-page" class="grid-container padding-bottom-3">
  <USABreadcrumb items={data.breadcrumbItems || ['Return']} rdfa={true} wrap={false} />
  <!-- Product Header / CSO Info Section -->

  <!-- default for Rev5/unknown -->
  <ProductHeader
    status={product.status}
    statusDate={product.status_date}
    certClass={product.cert_class}
    csp={product.csp}
    name={product.cso}
    productUrl={product.website}
    id={product.id}
    logoUrl={product.logo}
    agencyUrl={product.partnering_agency}
    certType={product.cert_type}
    authNumber={product.authorization}
    phase={product.phase}
    underCap={product.under_cap}
    capDate={product.cap_date}
    certPath={product.cert_path}
    certifiedDate={product.cert_date}
    website={product.website}
  />

  <!-- Tab Navigation Section -->
  <div class="grid-row margin-bottom-7">
    <div class="grid-col-12">
      <MarketplaceTabs {tabs} bind:activeTab={currTab} />
    </div>
  </div>

  <div id="product-content-area">
    {#if currTab === 'overview'}
      <ProductOverviewTab
        serviceDescription={product.service_desc}
        serviceModelArray={product.service_model}
        deploymentModel={product.deployment_model}
        uei={product.uei}
        businessCategoryArray={product.business_categories}
        certifiedServices={product.certified_services}
        serviceLast90={product.service_last_90}
        allOtherServices={product.all_others}
        salesEmail={product.sales_email}
        securityEmail={product.security_email}
        website={product.website}
      />
    {:else if currTab === 'auth_details'}
      <!-- TODO: Partnering agency URL not defined in the CSP data? Have to do a cross reference with Agencies data -->
      <ProductAuthDetailsTab
        productId={product.id}
        agencyAuthorizations={data.agencyAuthorizations}
        readyDate={product.ready_date}
        inProcessAgencyDate={product.ip_agency_date}
        inProcessJABDate={product.ip_jab_date}
        inProcessProgramReviewDate={product.ip_prog_date}
        inProcessProgramFinalizationDate={product.ip_prog_date2}
        certDate={product.cert_date}
        certPath={product.cert_path}
        partneringAgency={product.partnering_agency}
        partneringAgencyUrl={product.partnering_agency}
        independentAssessor={product.independent_assessor}
        annualAssessmentDate={product.annual_assessment}
      />
      <!-- TODO: We are missing/not collecting last assessment date in the marketplace JSON for CSPs-->
    {:else if currTab === 'dep_products'}
      <ProductDepProductsTab dependentProducts={product.leveraged_systems} />
    {:else if currTab === 'event_log'}
      <ProductEventLogTab events={product.event_log} />
    {/if}
  </div>
</div>

<style lang="scss">
  /* Tab Navigation */
  #product-navigation {
    border-bottom: 1px solid var(--usa-color-base-lighter);
    padding-bottom: 0.5rem;
  }
  #product-navigation {
    gap: 1rem;
    border-bottom: 2px solid #e1e1e1;
  }
  .product-navigation-tab {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .tab-button {
    background: none;
    border: none;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    color: var(--usa-color-base);
    transition: color 0.2s ease-in-out; /* Smooth transition for hover */
  }
  .tab-button:hover {
    color: var(--usa-color-primary-dark);
  }
  .tab-button:focus {
    outline: 2px solid var(--usa-color-primary);
    outline-offset: 2px; /* Add a little space between the text and outline */
  }
  .tab-button.active {
    color: var(--usa-color-primary-dark);
    /* Add an underline or other visual indicator for the active state */
    border-bottom: 3px solid var(--usa-color-primary-dark);
  }
</style>
