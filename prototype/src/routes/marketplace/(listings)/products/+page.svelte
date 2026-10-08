<!-- routes/marketplace/(listings)/products/+page.svelte -->
<script lang="ts">
  let { data } = $props();
  import ProductSearch from '$lib/components/Marketplace/ProductSearch.svelte';
  const marketplaceData = $derived(data.fedRAMPData);
</script>

<svelte:head>
  <title>FedRAMP Marketplace - Products</title>
  <meta
    name="description"
    content="Browse cloud products that are planning to get or have obtained a FedRAMP authorization. Find secure, compliant solutions for federal agencies with detailed authorization status and security information."
  />
</svelte:head>

<ProductSearch data={marketplaceData} />
