/* lib/services/MarketplaceService.ts */
import type {
  FedRAMPData,
  FedRAMPDataIndexed,
  ProductId,
  AgencyId,
  AssessorId,
  AdvisorId,
  Product,
  Agency,
  Assessor,
  Advisor,
  ATO,
  ReuseATO,
  ProductAgencyAuthTableRow,
  ProductCertStatus
} from '$lib/types/marketplace';

/**
 * Build indexed data structure for efficient lookups
 */
export function buildIndexedData(data: FedRAMPData): FedRAMPDataIndexed {
  const productMap = new Map<ProductId, Product>((data.data.Products as Product[]).map((p: Product) => [p.id, p]));

  const agencyMap = new Map<AgencyId, Agency>((data.data.Agencies as Agency[]).map((a: Agency) => [a.id, a]));

  const assessorMap = new Map<AssessorId, Assessor>((data.data.Assessors as Assessor[]).map((a: Assessor) => [a.id, a]));

  const advisorMap = new Map<AdvisorId, Advisor>((data.data.Advisors as Advisor[]).map((a: Advisor) => [a.id, a]));

  // Group ATOs and ReuseATOs by ProductId
  const atoMap = groupItemsByProductIdIntoMap(data.data.AtoMapping as ATO[]);
  const reuseAtoMap = groupItemsByProductIdIntoMap(data.data.ReuseMapping as ReuseATO[]);

  return {
    meta: data.meta,
    data: {
      Metrics: data.data.Metrics,
      Filters: data.data.Filters,
      Products: productMap,
      Agencies: agencyMap,
      Assessors: assessorMap,
      Advisors: advisorMap,
      AtoMapping: atoMap,
      ReuseMapping: reuseAtoMap
    }
  };
}

/**
 * Build product-agency authorization table for efficient lookups
 */
export function buildProductAgencyAuthTableIndexed(fedRAMPDataIndexed: FedRAMPDataIndexed): Map<ProductId, ProductAgencyAuthTableRow[]> {
  const productAgencyAuthTableMap = new Map<ProductId, ProductAgencyAuthTableRow[]>();
  const primeATOsMap = fedRAMPDataIndexed.data.AtoMapping; // Now it's a Map
  const reuseATOsMap = fedRAMPDataIndexed.data.ReuseMapping; // Now it's a Map

  if (!primeATOsMap || primeATOsMap.size === 0) {
    console.warn('AtoMapping is missing or empty. Cannot build product agency auth table.');
    return productAgencyAuthTableMap;
  }

  if (!reuseATOsMap || reuseATOsMap.size === 0) {
    console.warn('ReuseMapping is missing or empty. Cannot build product agency auth table.');
    return productAgencyAuthTableMap;
  }

  // Process prime ATOs - iterate over Map values
  for (const atoArray of primeATOsMap.values()) {
    for (const primeAto of atoArray) {
      const productId = primeAto.id;
      const agencyName = primeAto.parent;
      const subAgencyName = primeAto.sub;
      const certStatus: ProductCertStatus = 'FedRAMP Certified';

      const tableRow: ProductAgencyAuthTableRow = {
        agency_name: agencyName,
        sub_agency_name: subAgencyName,
        cert_status: certStatus,
        number_of_reuses: 0
      };

      if (!productAgencyAuthTableMap.has(productId)) {
        productAgencyAuthTableMap.set(productId, []);
      }
      productAgencyAuthTableMap.get(productId)!.push(tableRow);
    }
  }

  // Process reuse ATOs - iterate over Map values
  for (const reuseAtoArray of reuseATOsMap.values()) {
    for (const reuseAto of reuseAtoArray) {
      const productId = reuseAto.id;
      const agencyName = reuseAto.parent;
      const subAgencyName = reuseAto.sub;
      const certStatus: ProductCertStatus = 'FedRAMP Certified';

      const tableRow: ProductAgencyAuthTableRow = {
        agency_name: agencyName,
        sub_agency_name: subAgencyName,
        cert_status: certStatus,
        number_of_reuses: 1
      };

      if (!productAgencyAuthTableMap.has(productId)) {
        productAgencyAuthTableMap.set(productId, []);
      }
      productAgencyAuthTableMap.get(productId)!.push(tableRow);
    }
  }

  return productAgencyAuthTableMap;
}

/**
 * Build the agency-authorization table rows for a single product.
 *
 * Used by product detail pages so they can render the table without seeding the
 * full client-side store (which would require serializing the entire dataset into
 * the page). Reads directly from the flat ATO/ReuseATO arrays produced by DataLoader.
 */
export function buildProductAgencyAuthTableForProduct(
  productId: ProductId,
  atoMapping: ATO[],
  reuseMapping: ReuseATO[]
): ProductAgencyAuthTableRow[] {
  const rows: ProductAgencyAuthTableRow[] = [];

  for (const ato of atoMapping) {
    if (ato.id !== productId) continue;
    rows.push({
      agency_name: ato.parent,
      sub_agency_name: ato.sub,
      cert_status: 'FedRAMP Certified',
      number_of_reuses: 0
    });
  }

  for (const reuse of reuseMapping) {
    if (reuse.id !== productId) continue;
    rows.push({
      agency_name: reuse.parent,
      sub_agency_name: reuse.sub,
      cert_status: 'FedRAMP Certified',
      number_of_reuses: 1
    });
  }

  return rows;
}

/**
 * Group items by ProductId into a Map for efficient lookups
 */
function groupItemsByProductIdIntoMap<T extends { id: ProductId }>(items: T[] | undefined): Map<ProductId, T[]> {
  const groupedMap = new Map<ProductId, T[]>();

  if (!items) {
    return groupedMap;
  }

  for (const item of items) {
    if (!groupedMap.has(item.id)) {
      groupedMap.set(item.id, []);
    }
    groupedMap.get(item.id)!.push(item);
  }

  return groupedMap;
}
