<!-- lib/components/Marketplace/ProductHeader.svelte -->
<script lang="ts">
  import { asset } from '$lib/utils/paths';
  // TODO: 2025-12-16 For Marketplace 2.0 launch, not including ConMon
  // import ConMonInfo from './ConMonInfo.svelte';
  import USAButtonLink from '../USAButtonLink.svelte';
  import type { ProductCertClass, ProductCertStatus, ProductCertType, ProductPhase } from '$lib/types/marketplace';
  import { is20xCertType } from '$lib/utils/marketplaceDisplay';
  import StatsCard from './StatsCard.svelte';
  import USAButton from '../USAButton.svelte';
  import CopyableText from '../CopyableText.svelte';
  import Tooltip from '../Tooltip.svelte';
  import { t } from '$lib/stores/L10nStore';

  export let status: ProductCertStatus = 'Unknown';
  export let statusDate: Date | null = null;
  export let certClass: ProductCertClass = 'Unknown';
  export let csp: string = '[Placeholder CSP Name]';
  export let name: string = '[Placeholder Product Name]';
  export let productUrl: URL | null;
  export let id: string = 'FRXXXXXXXXXX';
  export let logoUrl: URL | null = null;
  export let agencyUrl: string | null = null; // TODO: Need to be a URL object here and upstream type definition too
  export let certType: ProductCertType = 'Unknown';
  export let authNumber: number;
  export let phase: ProductPhase = 'Unknown';
  export let underCap: boolean = false;
  export let capDate: Date | null = null;
  export let website: URL | null;
  // Certification path (JAB | Agency | Program | Unknown), sourced directly from
  // product.cert_path. Previously derived from the certification type; now wired
  // to the real data field.
  export let certPath: string = 'Unknown';
  export let certifiedDate: Date | null = null;
  // export let conMonMeetingDate: Date = new Date(0);

  const packageRequestDownloadUrl: string = `${asset('/resources/documents/Agency_Package_Request_Form.pdf')}`;
</script>

<div class="grid-row flex-align-center margin-bottom-2 flex-justify header-row">
  <div class="desktop:grid-col-7 grid-col-12">
    <div class="grid-row grid-gap mobile-logo-top">
      <div class="grid-col-auto flex-align-self-center logo-container">
        {#snippet logoWithAltText()}
          <img class="logo" src={asset(logoUrl?.href ?? "")} alt="{name} logo" />
        {/snippet}
        {#if website}
          <a href={website.href} target="_blank" rel="noopener noreferrer">
            {@render logoWithAltText()}
          </a>
        {:else}
          {@render logoWithAltText()}
        {/if}
      </div>
      <div class="grid-col-fill">
        <div class="name-container">
          <div class="name-block">
            <p class="margin-0" id="cloud-service-provider-name">{csp}</p>
            <h1 class="product-name margin-0">{name}</h1>
          </div>
          <div class="product-meta">
            <div class="package-id-block">
              <p class="margin-0 package-id-label" id="package-id-heading">Package ID</p>
              <p class="margin-0 display-flex flex-align-center package-id-value" id="package-id-number">
                <CopyableText textToCopy={id}>{id}</CopyableText>
              </p>
            </div>
            <div class="package-request-block">
              <!-- Disable button if not Certified or Remediation phase -->
              {#if is20xCertType(certType)}
                <p class="margin-0">Contact vendor for Package</p>
              {:else}
                <USAButton
                  marketplace
                  handleClick={function () {
                    window.open(packageRequestDownloadUrl);
                  }}
                  aria-label="Download Package Request Form"
                  class="margin-0"
                >
                  <svg class="usa-icon" aria-hidden="true" focusable="false" role="img">
                    <use href={asset('/uswds/img/sprite.svg#file_download')}></use>
                  </svg>
                  Package Request Form
                </USAButton>
              {/if}
            </div>
            <div class="website-block">
              <USAButtonLink href={productUrl?.href} unstyled class="display-inline-flex">
                Visit their website
                <svg class="usa-icon" aria-hidden="true" role="img">
                  <use href={asset('/uswds/img/sprite.svg#launch')}></use>
                </svg>
              </USAButtonLink>
              <!-- TODO: Enable trust center button once finalized -->
              <!--
              <USAButton marketplace disabled={true} aria-label="Visit external Trust Center">
                <svg class="usa-icon" aria-hidden="true" focusable="false" role="img">
                  <use href="{asset('/uswds/img/sprite.svg#launch')}"></use>
                </svg>
                Visit their Trust Center
              </USAButton>
              -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="grid-col-12 desktop:grid-col-auto stats-card-col">
    <StatsCard {status} {statusDate} {certClass} {certType} authorizations={authNumber} {phase} {certPath} {certifiedDate} />
  </div>
</div>

{#if underCap}
  <!-- Corrective Action Plan (CAP) notice. Deliberately separate from the
       certification Status tile so it is clear the CSP remains FedRAMP Certified
       while operating under a CAP. -->
  <div class="cap-banner" role="status" aria-label="Corrective Action Plan notice">
    <svg class="usa-icon cap-banner__icon" aria-hidden="true" focusable="false" role="img">
      <use href={asset('/uswds/img/sprite.svg#warning')}></use>
    </svg>
    <div class="cap-banner__body">
      <p class="cap-banner__title margin-0">
        Operating under a Corrective Action Plan (CAP)
        <Tooltip
          text={t('tooltip-corrective-action-plan')}
          ariaLabel="More info about Corrective Action Plans"
          position="widescreen:left desktop-lg:top"
          anchorClass="cap-banner"
        />
      </p>
      <p class="margin-0 cap-banner__detail">
        This offering remains <strong>FedRAMP Certified</strong> and is actively remediating findings under a Corrective Action Plan{#if capDate}
          &nbsp;as of {new Date(capDate).toLocaleDateString()}{/if}.
      </p>
    </div>
  </div>
{/if}

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  // Corrective Action Plan banner. Uses a warning colorway distinct from the
  // certification-status colors so users can tell the CAP apart from the overall
  // FedRAMP Certified status.
  .cap-banner {
    display: flex;
    align-items: flex-start;
    gap: uswds.units(1);
    margin-bottom: uswds.units(2);
    padding: uswds.units(2);
    border: 1px solid #936f38;
    border-left: 6px solid #936f38;
    border-radius: 0.5rem;
    background-color: #faf3d1;

    &__icon {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      fill: #936f38;
      margin-top: 0.1rem;
    }

    &__body {
      display: flex;
      flex-direction: column;
      gap: uswds.units(0.5);
    }

    &__title {
      font-weight: uswds.font-weight('bold');
      color: #7a5a2e;
    }

    &__detail {
      color: uswds.color('ink');
      font-size: 0.95rem;
    }
  }

  // Tighten the gap between the text column and the StatsCard column so the
  // StatsCard stays on the same row when the text column is grid-col-7.
  .header-row {
    @media (min-width: #{uswds.units('desktop')}) {
      flex-wrap: nowrap;
      gap: uswds.units(2);
    }
  }

  // The desktop StatsCard column uses grid-col-auto (sizes to content), which
  // let a long status label widen the card and trigger a horizontal scrollbar.
  // Cap and allow it to shrink so the card wraps its content instead.
  .stats-card-col {
    display: flex;

    @media (min-width: #{uswds.units('desktop')}) {
      flex: 1 1 auto;
      min-width: 0;
      max-width: 60%;
    }

    // Below desktop the column drops to full width beneath the name block.
    // This margin replaces the `margin-y-2` that used to sit on the separate
    // mobile-only StatsCard wrapper.
    @media (max-width: #{uswds.units('desktop') - 0.01rem}) {
      margin-top: uswds.units(2);
      margin-bottom: uswds.units(2);
      justify-content: center;
    }
  }

  .mobile-logo-top {
    @media (max-width: #{uswds.units('desktop') - 0.01rem}) {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      .logo-container {
        order: -1;
        margin-bottom: uswds.units(2);
      }
    }
  }

  .logo {
    max-width: 140px;
    height: auto;
    mix-blend-mode: multiply;

    @media (max-width: #{uswds.units('desktop') - 0.01rem}) {
      max-width: 200px;
    }
  }

  .name-container {
    display: flex;
    flex-direction: column;
    // Consistent vertical rhythm between the name block and the meta row.
    gap: uswds.units(2);

    @media (max-width: #{uswds.units('desktop') - 0.01rem}) {
      align-items: center;
      text-align: center;
    }
  }

  // Horizontal row of the smaller meta elements (website link, package ID,
  // request button) that sits flush beneath the CSO/product name on desktop.
  // Wraps to additional lines on narrower (non-mobile) viewports so the
  // elements never overlap the StatsCard.
  .product-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: uswds.units(2);
    row-gap: uswds.units(2);

    // Each child should only take the width of its content so they sit
    // flush on the same row. Without this the USWDS button (width: 100% on
    // small screens) would force itself onto its own line.
    > * {
      flex: 0 0 auto;
    }

    // On mobile the elements stack and center, matching the rest of the header.
    @media (max-width: #{uswds.units('desktop') - 0.01rem}) {
      flex-direction: column;
      align-items: center;
    }
  }

  // Group the label + value so the internal pairing stays tight.
  .name-block,
  .package-id-block {
    display: flex;
    flex-direction: column;
    gap: uswds.units(0.5);
  }

  #cloud-service-provider-name {
    font-size: 1em;
  }

  .package-id-label {
    font-weight: uswds.font-weight('bold');
    color: uswds.color('ink');
  }

  .product-name {
    font-size: 2rem;
    font-weight: uswds.font-weight('bold');
    letter-spacing: 0.02em;
    margin-bottom: 0 !important;
    display: flex;

    @media (max-width: #{uswds.units('desktop') - 0.01rem}) {
      font-size: 1.5rem;
      justify-content: center;
    }
  }
</style>
