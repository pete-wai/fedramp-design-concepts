<!-- lib/components/USABreadcrumb.svelte -->
<script lang="ts">
  let { items = [], rdfa = false, wrap = false } = $props();
</script>

<nav class="usa-breadcrumb ${wrap ? 'usa-breadcrumb--wrap' : ''}" aria-label="Breadcrumbs">
  <ol class="usa-breadcrumb__list" aria-label="Breadcrumb list">
    {#each items as { label, href }, index (label)}
      <li
        class="usa-breadcrumb__list-item {index === items.length - 1 ? 'usa-current' : ''}"
        aria-current={index === items.length - 1 ? 'page' : undefined}
        property={rdfa ? 'itemListElement' : undefined}
        typeof={rdfa ? 'ListItem' : undefined}
      >
        {#if href && !(index === items.length - 1 && items.length > 1)}
          <a
            {href}
            class="usa-breadcrumb__link"
            property={rdfa ? 'item' : undefined}
            typeof={rdfa ? 'WebPage' : undefined}
            aria-label="Return to {label}"
          >
            <span property={rdfa ? 'name' : undefined}>
              {label}
            </span>
          </a>
        {:else}
          <span property={rdfa ? 'name' : undefined}>
            {label}
          </span>
        {/if}

        {#if rdfa}
          <meta property="position" content="String{index + 1}" />
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style lang="scss">
  .usa-breadcrumb {
    background-color: inherit;
  }
  span,
  li {
    color: #4a1036;
    text-decoration: none !important;
    font-weight: 600;
  }
  .usa-breadcrumb__list-item:not(:last-child)::after {
    background-color: #4a1036;
  }
  .usa-breadcrumb__list-item:nth-last-child(2) .usa-breadcrumb__link:before {
    background-color: #4a1036;
  }
</style>
