<!-- lib/components/Marketplace/ProductOverviewTab.svelte -->
<script lang="ts">
  import USATag from '../USATag.svelte';
  import type { ServiceModel, ProductDeploymentModel, OverviewCertifiedService } from '$lib/types/marketplace';
  import Tooltip from '../Tooltip.svelte';
  import USAButtonLink from '../USAButtonLink.svelte';
  import CopyableText from '../CopyableText.svelte';
  import ServiceDescription from './ServiceDescription.svelte';
  import { t } from '$lib/stores/L10nStore';
  import { resolve } from '$lib/utils/paths';

  export let serviceDescription: string = '';
  export let serviceModelArray: ServiceModel = [];
  export let deploymentModel: ProductDeploymentModel = 'Unknown';
  export let businessCategoryArray: string[] = [];
  export let uei: string | null = '';
  // Structured certified services from the machine-readable FRC-CSO-PKG source.
  // When present, these are rendered in preference to the legacy string arrays.
  export let certifiedServices: OverviewCertifiedService[] = [];
  export let serviceLast90: string[] = [];
  export let allOtherServices: string[] = [];
  export let salesEmail: string | null = null;
  export let securityEmail: string | null = null;
  export let website: URL | null = null;

  // The FRC-CSO-PKG source supplies a structured certified_services list; the
  // legacy CSV pipeline only has the flat service_last_90/all_others string
  // arrays. Prefer the structured list when the producer provided one.
  $: hasStructuredServices = certifiedServices.length > 0;
  $: hasLegacyServices = serviceLast90.length > 0 || allOtherServices.length > 0;
</script>

<div id="product-overview-tab">
  <div id="product-details" class="custom-grid">
    <!-- Left column -->
    <div class="product-section left-column" role="region" aria-label="Description Box">
      <div class="mobile-center">
        <h2 id="service-description-label">Service Description</h2>
      </div>
      <p id="user-generated-content-disclaimer">
        <small>
          <i>
            Disclaimer: FedRAMP does not review or endorse vendor-submitted content. Vendors are responsible for accuracy of product descriptions,
            provided services, and contact information.
          </i>
        </small>
      </p>
      <ServiceDescription text={serviceDescription} />

      <div class="product-section mobile-center">
        <h3 id="authorized-service-label">Certified Services</h3>
        <p>
          <small>
            <i>
              If there are microservices or applications included within this Cloud Service Offering's (CSO) assessment scope, they are listed below.
              This may be more applicable to Infrastructure as a Service (IaaS) vendors.
            </i>
          </small>
        </p>
        <div class="authorized-services">
          {#if hasStructuredServices}
            <div class="authorized-service-subsection">
              <ul>
                {#each certifiedServices as service (service.serviceName)}
                  <li>{service.serviceName}</li>
                {/each}
              </ul>
            </div>
          {:else if hasLegacyServices}
            <h4 class="authorized-service-sublabel">Service(s) added in the last 90 days</h4>
            <div class="authorized-service-subsection">
              {#if serviceLast90.length > 0}
                <ul>
                  {#each serviceLast90 as service (service)}
                    <li>{service}</li>
                  {/each}
                </ul>
              {:else}
                <p>N/A</p>
              {/if}
            </div>

            <h4 class="authorized-service-sublabel">Other Service(s)</h4>
            <div class="authorized-service-subsection">
              {#if allOtherServices.length > 0}
                <ul>
                  {#each allOtherServices as service (service)}
                    <li>{service}</li>
                  {/each}
                </ul>
              {:else}
                <p>N/A</p>
              {/if}
            </div>
          {:else}
            <p>N/A</p>
          {/if}
        </div>
      </div>
    </div>

    <div class="right-column">
      <div class="contact-section margin-bottom-3" role="region" aria-label="Vendor Contact Information Box">
        <h2 class="contact-title">Vendor Contacts</h2>
        <div class="contact-info">
          {#if salesEmail}
            <div class="contact-item">
              <h3 class="contact-label">Sales</h3>
              <p class="contact-detail">
                <CopyableText textToCopy={salesEmail}>
                  <a href="mailto:{salesEmail}">{salesEmail}</a>
                </CopyableText>
              </p>
            </div>
          {/if}

          <div class="contact-item">
            <h3 class="contact-label">Security</h3>
            <p class="contact-detail">
              {#if securityEmail !== null}
                <CopyableText textToCopy={securityEmail}>
                  <a href="mailto:{securityEmail}">{securityEmail}</a>
                </CopyableText>
              {:else}
                N/A
              {/if}
            </p>
          </div>

          <div class="contact-item">
            <h3 class="contact-label">Product Website</h3>
            <p class="contact-detail">
              {#if website !== null}
                <USAButtonLink href={website.href} unstyled>{website.href}</USAButtonLink>
              {:else}
                N/A
              {/if}
            </p>
          </div>
        </div>
      </div>

      <div role="region" aria-label="Marketplace Miscellaneous Box">
        <h2>More Info</h2>
        {#if uei !== null}
          <div class="product-section mobile-center">
            <h3 id="uei-number-label">
              UEI Number
              <Tooltip
                text={t('tooltip-uei')}
                ariaLabel="More info about UEI number"
                position="widescreen:left desktop-lg:top"
                anchorClass="product-section"
              />
            </h3>
            <p id="uei-number">
              <CopyableText textToCopy={uei}>
                {uei}
              </CopyableText>
            </p>
          </div>
        {/if}

        <div class="product-section mobile-center">
          <h3 id="business-function-label">
            Business Categories <Tooltip
              text={t('tooltip-business-categories')}
              ariaLabel="More info about Business Categories"
              position="widescreen:left desktop-lg:top"
              anchorClass="product-section"
            />
          </h3>
          <div class="business-function-tag">
            {#if businessCategoryArray}
              {#each businessCategoryArray as businessCategory (businessCategory)}
                <USATag href={resolve(`/marketplace/products/?business_categories=${businessCategory}`)} marketplaceStyling={true}>
                  <div aria-label="View {businessCategory} products">{businessCategory}</div>
                </USATag>
              {/each}
            {:else}
              No tags found
            {/if}
          </div>
          <p>
            <small><i>(Up to 10 tags)</i></small>
          </p>
        </div>

        {#if serviceModelArray}
          <div class="product-section mobile-center">
            <h3 id="service-model-label">
              Service Model <Tooltip
                text={t('tooltip-service-model')}
                ariaLabel="More info about Service Model"
                position="widescreen:left desktop-lg:top"
                anchorClass="product-section"
              />
            </h3>
            <p id="service-model">{serviceModelArray.join(', ')}</p>
          </div>
        {/if}

        <div class="product-section mobile-center">
          <h3 id="deployment-model-label">
            Deployment Model <Tooltip
              text={t('tooltip-deployment-model')}
              ariaLabel="More info about Deployment Model"
              position="widescreen:left desktop-lg:top"
              anchorClass="product-section"
            />
          </h3>
          <p id="deployment-model">{deploymentModel}</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  // Base styles
  %section-heading {
    font-size: 24px;
    color: uswds.color('base-dark');
    margin-bottom: 5px;
  }

  %section-text {
    font-size: 22px;
    color: uswds.color('base-darkest');
    margin-top: 5px;
  }

  // Grid layout
  .custom-grid {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 3rem;
    max-width: 100%;
    width: 100%;

    @media (max-width: #{uswds.units('desktop')}) {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  .left-column,
  .middle-column,
  .right-column {
    min-width: 0;

    @media (max-width: #{uswds.units('desktop')}) {
      width: 100%;
    }
  }

  // Product sections
  .product-section {
    color: uswds.$theme-color-base-darkest;

    @media (max-width: #{uswds.units('mobile-lg')}) {
      &:has(#service-description-label),
      &:has(#service-description) {
        margin-left: 0;
        margin-right: 0;
        max-width: none;
      }
    }
  }

  // Left column specific
  .left-column {
    h3 {
      @extend %section-heading;
    }

    p,
    #service-model,
    #deployment-model,
    #uei-number {
      @extend %section-text;
    }
  }

  .business-function-tag {
    @include uswds.u-display('flex');
    @include uswds.u-flex('wrap');
    @include uswds.u-flex('justify-start');
    margin-top: 5px;
  }

  // Middle column specific
  .middle-column {
    h3 {
      @extend %section-heading;
    }
  }

  #service-description-label,
  #service-model-label {
    margin-top: 0;
  }

  .authorized-services {
    h4 {
      font-size: 1.313rem;
      margin-bottom: 0;

      &:first-child {
        margin-top: 0.3125rem;
      }
    }
  }

  .authorized-service-subsection ul {
    column-count: 3;
    -webkit-column-count: 3;
    -moz-column-count: 3;

    column-gap: 2em;
    -webkit-column-gap: 2em;
    -moz-column-gap: 2em;
  }

  .authorized-service-subsection li {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
  }

  .contact-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .contact-title {
    @extend %section-heading;
    font-weight: 700;
    display: flex;
    align-items: center;
    margin: 0;
  }

  .contact-info {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 5px 10px;
    gap: 10px;
    border-radius: 10px;
    width: 100%;
  }

  .contact-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    // Breathing room between the contact title (label) and its value.
    gap: uswds.units(0.5);
  }

  .contact-label {
    font-size: 16px;
    line-height: 20px;
    color: uswds.color('base-darkest');
    text-transform: uppercase;
    font-weight: 700;
    margin: 0;
  }

  .contact-detail {
    color: uswds.color('base-darkest');
    display: flex;
    align-items: center;
    width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    margin: 0;
  }

  // Mobile specific adjustments
  @media (max-width: #{uswds.units('mobile-lg')}) {
    .grid-row.flex-justify {
      .product-section {
        margin-bottom: 0;
      }

      #deployment-model-label:nth-last-child(-n + 2) {
        margin-top: 0;
      }
    }
  }
</style>
