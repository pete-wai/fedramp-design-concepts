import { writable, derived } from 'svelte/store';
import { buildIndexedData } from '$lib/services/MarketplaceService';
import type { FedRAMPData, FedRAMPDataIndexed, Product, Agency, Assessor, ProductId } from '$lib/types/marketplace';

const defaultFedRAMPData: FedRAMPData = {
  meta: {
    last_change: new Date(0),
    produced_by: 'N/A'
  },
  data: {
    Metrics: {
      ready: -1,
      in_process: -1,
      authorized: -1,
      total: -1,
      latest: [],
      tickerLogos: []
    },
    Filters: {
      product: {
        status: [],
        business_categories: [],
        service_model: [],
        impact_level: [],
        cert_path: [],
        deployment_models: [],
        small_business: [],
        assessor: []
      },
      agency: {
        parent_agency: [],
        authorization: [],
        reuse: [],
        impact_level: []
      },
      assessor: {
        product_assessing: [],
        impact_level: [],
        status: []
      }
    },
    Products: [],
    ProductsMap: {},
    Agencies: [],
    AgenciesMap: {},
    Assessors: [],
    AssessorsMap: {},
    Advisors: [],
    AdvisorMap: {},
    AtoMapping: [],
    ReuseMapping: []
  }
};

const marketplaceDataStore = writable<FedRAMPData>(defaultFedRAMPData);

const marketplaceIndexedStore = derived(marketplaceDataStore, ($data) => buildIndexedData($data));

let validatedIndexedData: FedRAMPDataIndexed | null = null;

/* Convenience snapshot helpers (non-reactive) */
function getProductSnapshotById(id: string) {
  if (!validatedIndexedData) return undefined;
  return validatedIndexedData.data.Products.get(id as ProductId);
}

const getCurrentArrays = () => {
  if (!validatedIndexedData) {
    return {
      allAgenciesArray: [] as Agency[],
      allAssessorsArray: [] as Assessor[],
      allProductsArray: [] as Product[]
    };
  }

  return {
    allAgenciesArray: Array.from(validatedIndexedData.data.Agencies.values()),
    allAssessorsArray: Array.from(validatedIndexedData.data.Assessors.values()),
    allProductsArray: Array.from(validatedIndexedData.data.Products.values())
  };
};

// These will update when data loads
let allAgenciesArray: Agency[] = [];
let allAssessorsArray: Assessor[] = [];
let allProductsArray: Product[] = [];

marketplaceIndexedStore.subscribe((indexedData) => {
  if (indexedData) {
    validatedIndexedData = indexedData;

    const arrays = getCurrentArrays();
    allAgenciesArray = arrays.allAgenciesArray;
    allAssessorsArray = arrays.allAssessorsArray;
    allProductsArray = arrays.allProductsArray;
  }
});

export {
  marketplaceDataStore,
  marketplaceIndexedStore,
  getProductSnapshotById,
  getCurrentArrays,
  allAgenciesArray,
  allAssessorsArray,
  allProductsArray
};
