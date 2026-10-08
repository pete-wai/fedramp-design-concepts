/* routes/marketplace/(pages)/products/[frid]/+page.server.ts */
import type { EntryGenerator, PageServerLoad } from './$types.js';
import { asset, resolve } from '$lib/utils/paths';
import { getMarketplaceData } from '$lib/services/DataLoader';
import { buildProductAgencyAuthTableForProduct } from '$lib/services/MarketplaceService';
import type { ATO, ReuseATO } from '$lib/types/marketplace';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const id = params.frid;
  // Read directly from the singleton rather than `parent()`. Pulling from the
  // layout's returned fedRAMPData would cause SvelteKit to serialize the entire
  // marketplace dataset (~3.6 MB) into this page's __data.json. Detail pages only
  // need the single matched product.
  const marketplaceData = getMarketplaceData();
  const foundProduct = marketplaceData.data.ProductsMap?.[id];

  if (!foundProduct) {
    console.warn(`Product with ID ${id} not found.`);
    throw error(404, `Product with ID ${id} not found.`);
  }

  // Pre-compute the agency authorization table rows for just this product so the
  // ProductAuthDetailsTab does not depend on the full client-side store.
  const agencyAuthorizations = buildProductAgencyAuthTableForProduct(
    foundProduct.id,
    marketplaceData.data.AtoMapping as ATO[],
    marketplaceData.data.ReuseMapping as ReuseATO[]
  );

  const breadcrumbItems = [
    { label: 'Marketplace', href: `${resolve('/marketplace')}` },
    { label: 'Products', href: `${resolve('/marketplace/(listings)/products')}` },
    { label: foundProduct.cso, href: '' }
  ];

  const productDescription = (() => {
    const text = foundProduct.service_desc?.trim();
    if (!text || text.length <= 160) return text || '';

    const truncated = text.substring(0, 160);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 150 ? truncated.substring(0, lastSpace) : truncated;
  })();
  const productTitle = `${foundProduct.cso} | FedRAMP Marketplace`;
  const metaImage = asset(`/marketplace-metadata/img/${String(foundProduct.logo)?.split('/').slice(-2).join('/')}`);

  return {
    product: foundProduct,
    agencyAuthorizations,
    breadcrumbItems,
    metaTitle: productTitle,
    metaDescription: productDescription,
    metaImage
  };
};

export const entries = (() => {
  return getMarketplaceData().data.Products.map((product) => {
    return { frid: product.id };
  });
}) satisfies EntryGenerator;

export const prerender = true;
