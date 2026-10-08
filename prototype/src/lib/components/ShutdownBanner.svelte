<!-- lib/components/ShutdownBanner.svelte -->
<script>
  import { asset, resolve } from '$lib/utils/paths';
</script>

<div class="shutdown-banner" role="status">
  <div class="grid-container-desktop-lg display-flex">
    <div class="grid-col-auto">
      <img src={asset('/uswds/img/usa-icons/error.svg')} alt="Warning Icon" class="shutdown-icon" aria-hidden="true" />
    </div>
    <div class="grid-col-fill shutdown-content">
      <h2>Important Notice</h2>
      <span>
        FedRAMP is operating mission-essential functions only due to the government shutdown. Please visit <a
          href={resolve('/(pages)/(updates)/shutdown')}>fedramp.gov/shutdown</a
        > for more information.
      </span>
    </div>
  </div>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;

  .shutdown-banner {
    @include uswds.u-font('sans', '3xs');
    background-color: #9c3d10;
    color: white;
    padding: 16px 0;
    display: block;
    gap: 1.5rem;
    font-size: 1rem;
  }

  .shutdown-icon {
    width: 40px;
    height: 40px;
    margin-right: 0.5rem;
    flex-shrink: 0;
    /* Make SVG white using filter if it's a black icon */
    filter: brightness(0) invert(1);
  }

  .shutdown-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .shutdown-content h2 {
    margin: 0 0 0.25em 0;
    font-size: 1.2em;
    font-weight: bold;
    color: white;
  }

  .shutdown-content span {
    font-size: 1em;
    color: white;
  }

  .shutdown-content a {
    color: #fff;
    text-decoration: underline;
  }
</style>
