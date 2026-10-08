<!-- lib/components/Marketplace/MarketplaceHeroBanner.svelte -->
<script lang="ts">
  import { resolve } from '$lib/utils/paths';
  import MarketplaceTicker from './HomeTicker.svelte';
  import type { ClassValue, HTMLAttributes } from 'svelte/elements';
  import type { FedRAMPData, Product } from '$lib/types/marketplace';
  import { is20xCertType } from '$lib/utils/marketplaceDisplay';

  type Props = {
    copy: Record<string,string>;
    class?: ClassValue;
    other?: HTMLAttributes<HTMLDivElement>;
    data?: FedRAMPData;
  };
  type Metrics = {
    authorized?: number;
    tickerLogos?: {
      id: string;
      logo: string;
      name: string;
    }[];
  };
  let { class: className, data, copy, ...other }: Props = $props();

  const authorizedNum = $derived((data?.data?.Metrics as Metrics)?.authorized ?? 0);

  const authorized20xNum = $derived(
    (data?.data?.Products as Product[])?.filter((product: Product) => is20xCertType(product.cert_type) && product.status === 'FedRAMP Certified')
      .length ?? 0
  );

  const tickerLogosData = $derived((data?.data?.Metrics as Metrics)?.tickerLogos);
</script>

<!-- Keep the hero and ticker in normal flow when text grows. -->
<div class="hero-and-ticker-container">
  <div class="usa-section {className}" {...other}>
    <div class="grid-container-desktop-lg">
      <div class="grid-row margin-bottom-3"></div>
      <div class="grid-row flex-align-center usa-prose margin-bottom-4">
        <div class="grid-col-12 desktop:grid-col-6">
          <h1 class="margin-bottom-0">{copy.fedrampMarketplaceYourFastTrackTo}</h1>
          <p>{copy.theFedRAMPMarketplaceIsASearchable}</p>
          <div class="grid-row grid-gap-lg">
            <div class="grid-col-12 tablet:grid-col-5">
              <a href={resolve('/marketplace/(docs)/guide')} class="usa-button width-full" rel="noopener noreferrer">{copy.learnMore}</a>
            </div>
            <div class="grid-col-12 tablet:grid-col-5">
              <a href={resolve('/marketplace')} class="usa-button usa-button--secondary width-full" rel="noopener noreferrer">{copy.browseMarketplace}</a>
            </div>
          </div>
        </div>
        <div class="grid-col-6 desktop:grid-col-2 desktop:grid-offset-1 margin-top-0 text-center metric-block">
          <h2 class="marketplace-metric-text">{copy.totalFedRAMPCertifiedServices}</h2>
          <p class="marketplace-metric-number" aria-label="{authorizedNum} total FedRAMP Certified Services">{authorizedNum}</p>
        </div>
        <div class="grid-col-6 desktop:grid-col-2 desktop:grid-offset-1 margin-top-0 text-center metric-block">
          <h2 class="marketplace-metric-text">{copy.totalFedRAMP20xCertifiedServices}</h2>
          <p class="marketplace-metric-number" aria-label="{authorized20xNum} total FedRAMP 20x Certified Services">{authorized20xNum}</p>
        </div>
      </div>
    </div>
  </div>
  <!-- Wrapper for the MarketplaceTicker component -->
  <div class="marketplace-ticker-wrapper">
    {#if tickerLogosData && tickerLogosData.length > 0}
      <MarketplaceTicker {copy} logos={tickerLogosData} durationPerLogo={4} logoSize="7rem" />
    {:else}
      <p style="text-align: center;">{copy.noRecentMarketplaceUpdatesToDisplay}</p>
    {/if}
  </div>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;
  .hero-and-ticker-container { overflow-wrap: anywhere; }
  .usa-button { margin-right: 0; white-space: normal; }
  @media (max-width: 39.99em) { .grid-gap-lg { margin-inline: 0; } .grid-gap-lg > div { padding-inline: 0; } }

  .hero-and-ticker-container {
    /* Default for smaller screens: allow content to flow naturally */
    display: block;
  }

  @media (min-width: uswds.units('desktop')) {
    .hero-and-ticker-container {
      display: flex;
      flex-direction: column;
    }

    .hero-and-ticker-container > .marketplace-ticker-wrapper {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .marketplace-ticker-wrapper {
      flex-shrink: 0;
    }
  }

  .marketplace-metric-number {
    font-size: 4rem;
    white-space: nowrap;
    overflow-wrap: normal;
  }
  @media (min-width: uswds.units('desktop')) {
    .marketplace-metric-number {
      font-size: clamp(3rem, 5vw, 6rem);
    }
  }
  // Style similarly to <h2> tags
  .marketplace-metric-number {
    font-weight: bold;
    margin: 0;
  }
  // Style similar to <p> tags
  .marketplace-metric-text {
    font-size: 1em;
    font-weight: normal;
    margin: 0;
  }
  // Add space between first and second button when stacked vertically on small viewports
  @media (max-width: uswds.units('tablet')) {
    .usa-button:first-of-type {
      margin-bottom: 1rem;
    }
  }
  .metric-block {
    display: flex;
    flex-direction: column; /* Stack children vertically */
    justify-content: center; /* Center content vertically if space allows */
    align-items: center; /* Center content horizontally */
  }
  .metric-block .marketplace-metric-number {
    order: 1; /* Make the p appear first (above the h2) */
  }
  .metric-block .marketplace-metric-text {
    order: 2; /* Make the h2 second (below the p) */
  }
</style>
