<!-- routes/marketplace/(pages)/+layout.svelte -->
<script lang="ts">
  let { children } = $props();
</script>

<main id="main-content" class="usa-section--light usa-prose main-content--light">
  {@render children()}
</main>
