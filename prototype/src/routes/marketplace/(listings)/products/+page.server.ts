// routes/marketplace/(listings)/products/+page.server.ts

import type { PageServerLoad } from './$types.js';
import { getMarketplaceData } from '$lib/services/DataLoader';

export const load: PageServerLoad = async () => {
  // Listing pages legitimately need the full dataset for client-side search/filter.
  return {
    fedRAMPData: getMarketplaceData()
  };
};

export const prerender = true;
