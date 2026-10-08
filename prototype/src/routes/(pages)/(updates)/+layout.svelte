<!-- routes/(pages)/(updates)/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/state';
  let { data, children } = $props();
  const isRfcIndex = $derived(page.route.id === '/(pages)/(updates)/rfcs');
</script>

<svelte:head>
  <title>{data.tabTitle}</title>
</svelte:head>

<div class="app-container bg-white updates-layout-styling">
  <div class="grid-container-desktop-lg">
    <div class="grid-row grid-gap">
      <svelte:element this={isRfcIndex ? 'div' : 'main'} id={isRfcIndex ? undefined : 'main-content'} class="usa-prose content-wrapper main-content--light">
        {@render children()}
      </svelte:element>
    </div>
  </div>
</div>

<style lang="scss">
  /* Apply styles directly to the app container */
  .app-container {
    &.bg-white {
      background-color: white !important;
    }
  }
</style>
