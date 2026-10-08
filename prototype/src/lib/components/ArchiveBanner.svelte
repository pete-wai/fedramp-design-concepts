<!-- lib/components/ArchiveBanner.svelte -->
<script>
  import { asset, resolve } from '$lib/utils/paths';
</script>

<div class="archive-banner" role="status">
  <img src={asset('/archive.svg')} alt="Archive Icon" aria-hidden="true" />
  <span>
    The content on this page is archived. For more up-to-date information, go to
    <a href={resolve('/')}>fedramp.gov</a>.
  </span>
</div>

<style lang="scss">
  @use '@styles/uswds.scss' as uswds;
  .archive-banner {
    @include uswds.u-font('sans', '2xs');
    background-color: #ce4929;
    color: white;
    padding: 10px;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .archive-banner img {
    width: 20px; /* Adjust as needed */
    height: 20px;
    margin-right: 5px;
  }

  .archive-banner a {
    color: white;
    text-decoration: underline;
  }
</style>
