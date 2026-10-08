---
fedrampMarketplaceYourFastTrackTo: "FedRAMP Marketplace: Your Fast Track to FedRAMP Certified Cloud Solutions."
theFedRAMPMarketplaceIsASearchable: "The FedRAMP Marketplace is a searchable database of FedRAMP certified cloud services, authorizing agencies, and FedRAMP recognized assessors."
learnMore: "Learn More"
browseMarketplace: "Browse Marketplace"
totalFedRAMPCertifiedServices: "Total FedRAMP Certified Services"
totalFedRAMP20xCertifiedServices: "Total FedRAMP 20x Certified Services"
noRecentMarketplaceUpdatesToDisplay: "No recent Marketplace updates to display."
tickerHeading: "Added in the last 30 days:"
tickerDescription: "Recent Marketplace product logos"
pauseTicker: "Pause logos"
resumeTicker: "Resume logos"
---

<script>
  import HomeHero from "$lib/components/marketing/HomeHero.svelte";
  let props = $props();
</script>

<HomeHero {...props} copy={metadata} />
