<script lang="ts">
  import ColorfulBlockquote from '$lib/components/ColorfulBlockquote.svelte';
  import MarketplaceTabs from '$lib/components/Marketplace/MarketplaceTabs.svelte';

  // Properly type the props
  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const tabs = [
    { name: 'Products', id: 'products', href: `/marketplace/products/` },
    { name: 'Agencies', id: 'agencies', href: `/marketplace/agencies/` },
    { name: 'Assessors', id: 'assessors', href: `/marketplace/assessors/` },
    { name: 'Advisors', id: 'advisors', href: `/marketplace/advisors/` }
  ];

  let currTab: string | undefined = $state();
</script>

<div class="usa-prose usa-section--light main-content--light">
  <section class="usa-section grid-container-desktop-lg padding-bottom-0">
    <h1 class="marketplace-header margin-0">FedRAMP Marketplace</h1>
    <ColorfulBlockquote
      color="#e8efff"
      text="**FedRAMP Terminology Update:** Effective immediately, &quot;FedRAMP Authorization&quot; is now called &quot;FedRAMP Certification,&quot; and Impact Levels have been replaced with Classes A-D for package specifications. For complete details on these changes, visit [Initial Outcome from RFC-0020 FedRAMP Authorization Designations](/notices/0004/). **FedRAMP will provide previous Impact Levels in parentheses after classes until December 31, 2026 to help stakeholders transition to the new terminology. Beginning in January 2027, &quot;Low&quot;, &quot;Moderate&quot;, and &quot;High&quot; Impact Levels will be removed and full transition to the class structure will take effect.**"
    />
    <MarketplaceTabs {tabs} bind:activeTab={currTab} />
  </section>
  <section class="grid-container-desktop-lg">
    {@render children()}
  </section>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .marketplace-header {
    font-size: 3rem;
    margin-bottom: 0 !important;
    padding-left: 0.813rem;
  }

  @media (max-width: uswds.units('tablet')) {
    .marketplace-header {
      font-size: 2rem;
    }
  }
</style>
