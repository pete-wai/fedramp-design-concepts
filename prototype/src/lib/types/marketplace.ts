/* lib/types/marketplace.ts */
import { z } from 'zod';
import type {
  ProductIdSchema,
  AgencyIdSchema,
  AssessorIdSchema,
  ProductServiceModelSchema,
  ProductDeploymentModelSchema,
  ProductCertPathSchema,
  ProductCertTypeSchema,
  LegacyImpactLevelSchema,
  LegacyImpactLevelNumberSchema,
  ProductCertStatusSchema,
  ProductPhaseSchema,
  ProductBusinessCategorySchema,
  FedRAMPDataSchema,
  AssessorClientSchema,
  ProductAgencyAuthTableRowSchema,
  AgencyProductTableRowSchema,
  ProductLeveragedSystemsTableRowSchema,
  TickerLogoSchema,
  FedRAMPMarketplaceStatusChangelogSchema,
  FiltersSchema,
  ProductExportSchema,
  ProductsExportSchema,
  ATOExportSchema,
  ATOsExportSchema,
  FedRAMPCertProcessStateSchema,
  ProductCertClassSchema,
  AdvisorIdSchema,
  AdvisorSchema,
  AdvisorClientSchema,
  AdvisorServiceOfferingSchema,
  OverviewCertifiedServiceSchema
} from '../schemas/marketplace';
import type { ProductSchema, AgencySchema, AssessorSchema, ATOSchema, ReuseATOSchema, FedRAMPDataIndexedSchema } from '../transforms';

// Ids
export type ProductId = z.infer<typeof ProductIdSchema>;
export type AgencyId = z.infer<typeof AgencyIdSchema>;
export type AssessorId = z.infer<typeof AssessorIdSchema>;
export type AdvisorId = z.infer<typeof AdvisorIdSchema>;

// Enums
export type ServiceModel = z.infer<typeof ProductServiceModelSchema>;
export type ProductCertStatus = z.infer<typeof ProductCertStatusSchema>;
export type ProductPhase = z.infer<typeof ProductPhaseSchema>;
export type ProductCertPath = z.infer<typeof ProductCertPathSchema>;
export type ProductDeploymentModel = z.infer<typeof ProductDeploymentModelSchema>;
export type ProductCertType = z.infer<typeof ProductCertTypeSchema>;
export type ImpactLevel = z.infer<typeof LegacyImpactLevelSchema>;
export type ImpactLevelNumber = z.infer<typeof LegacyImpactLevelNumberSchema>;
export type BusinessCategory = z.infer<typeof ProductBusinessCategorySchema>;
export type ProductCertClass = z.infer<typeof ProductCertClassSchema>;

// Objects
export type TickerLogo = z.infer<typeof TickerLogoSchema>;

export type FedRAMPData = Omit<z.infer<typeof FedRAMPDataSchema>, 'data'> & {
  data: Omit<
    z.infer<typeof FedRAMPDataSchema>['data'],
    'Products' | 'ProductsMap' | 'Agencies' | 'AgenciesMap' | 'Assessors' | 'AssessorsMap' | 'Advisors' | 'AdvisorMap'
  > & {
    Products: Product[];
    ProductsMap: Record<string, Product>;
    Agencies: Agency[];
    AgenciesMap: Record<string, Agency>;
    Assessors: Assessor[];
    AssessorsMap: Record<string, Assessor>;
    Advisors: Advisor[];
    AdvisorMap: Record<string, Advisor>;
  };
};
export type FedRAMPDataIndexed = z.infer<typeof FedRAMPDataIndexedSchema>;
export type FedRAMPMarketplaceStatusChangelog = z.infer<typeof FedRAMPMarketplaceStatusChangelogSchema>;
export type FedRAMPCertProcessState = z.infer<typeof FedRAMPCertProcessStateSchema>;

export type Product = z.infer<typeof ProductSchema>;
// A single certified service from the machine-readable FRC-CSO-PKG source
// (serviceName / serviceDescription, plus an OPTIONAL dateAvailable — the
// FRC-CSO-PKG schema dropped it from `required` in $schemaVersion 0.1.4).
// Replaces the removed legacy `authorized_services` string[] (see ADR-0003).
export type OverviewCertifiedService = z.infer<typeof OverviewCertifiedServiceSchema>;
// Runtime event-log entry as it appears on a transformed Product (date is a Date | null).
export type ProductEventLogEntry = Product['event_log'][number];

export type Agency = z.infer<typeof AgencySchema>;

export type Assessor = z.infer<typeof AssessorSchema>;
export type AssessorClient = z.infer<typeof AssessorClientSchema>;

export type Advisor = z.infer<typeof AdvisorSchema>;
export type AdvisorClient = z.infer<typeof AdvisorClientSchema>;
export type AdvisorServiceOffering = z.infer<typeof AdvisorServiceOfferingSchema>;

export type ATO = z.infer<typeof ATOSchema>;
export type ReuseATO = z.infer<typeof ReuseATOSchema>;

export type ProductAgencyAuthTableRow = z.infer<typeof ProductAgencyAuthTableRowSchema>;
export type AgencyProductTableRow = z.infer<typeof AgencyProductTableRowSchema>;
export type ProductLeveragedSystemsTableRow = z.infer<typeof ProductLeveragedSystemsTableRowSchema>;

// Filter types
// TODO: Unused in new Marketplace, can be removed?
export type ProductFilters = z.infer<typeof FiltersSchema>['product'];
export type AgencyFilters = z.infer<typeof FiltersSchema>['agency'];
export type AssessorFilters = z.infer<typeof FiltersSchema>['assessor'];
export type Filters = z.infer<typeof FiltersSchema>;

// Public products.json export contract (see products.json/+server.ts).
export type ProductExport = z.infer<typeof ProductExportSchema>;
export type ProductsExport = z.infer<typeof ProductsExportSchema>;

// Public atos.json export contract (see atos.json/+server.ts).
export type ATOExport = z.infer<typeof ATOExportSchema>;
export type ATOsExport = z.infer<typeof ATOsExportSchema>;
