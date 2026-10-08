<!-- lib/components/BetaBanner.svelte -->
<script lang="ts">
  import { asset, resolve } from '$lib/utils/paths';
</script>

<div class="beta-banner" role="status">
  <div class="grid-container-desktop-lg display-flex">
    <div class="grid-col-auto">
      <img src={asset('/uswds/img/usa-icons/info.svg')} alt="Information Icon" class="beta-icon" aria-hidden="true" />
    </div>
    <div class="grid-col-fill beta-content">
      <span>
        Welcome to the updated FedRAMP Marketplace! Please visit our <a
          href={resolve('/marketplace/(docs)/guide')}
          target="_blank"
          rel="noopener noreferrer">Quick Start guide</a
        >
        to see what changed, and don't hesitate to
        <a
          class="usa-link"
          style="background-color: transparent !important; border: none; padding: 0; font: inherit; cursor: pointer;"
          target="_blank"
          href="https://touchpoints.app.cloud.gov/touchpoints/8b8a7cef">give us feedback</a
        >!
      </span>
      <br />
      <span>
        <i>
          Note: the old marketplace at marketplace.fedramp.gov has been deprecated. All paths will permanently redirect to fedramp.gov/marketplace.
        </i>
      </span>
    </div>
  </div>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .beta-banner {
    @include uswds.u-font('sans', '3xs');
    // Changed background color to a USWDS info-like blue for beta status
    background-color: #0071bc; // USWDS primary-dark / info blue
    color: white;
    padding: 16px 0;
    display: block; // Ensure it takes full width
    gap: 1.5rem; // Keep grid gap for internal layout
    font-size: 1rem;
  }

  .beta-icon {
    width: 40px;
    height: 40px;
    margin-right: 0.5rem;
    flex-shrink: 0;
    /* Make SVG white using filter if it's a black icon */
    filter: brightness(0) invert(1);
  }

  .beta-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    .usa-link {
      color: #fff;
      text-decoration: underline;
      background-color: none !important;
      &:hover {
        text-decoration: none; // Optional: remove underline on hover
      }
    }
  }

  .beta-content h2 {
    margin: 0 0 0.25em 0;
    font-size: 1.2em;
    font-weight: bold;
    color: white;
  }

  .beta-content span {
    font-size: 1em;
    color: white;
  }

  .beta-content a {
    color: #fff;
    text-decoration: underline;
    &:hover {
      text-decoration: none; // Optional: remove underline on hover
    }
  }
</style>
