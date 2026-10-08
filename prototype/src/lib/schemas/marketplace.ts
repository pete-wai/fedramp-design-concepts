/* lib/schemas/marketplace.ts */
import z from 'zod';

// Unique ids schema template
const createIdSchema = () => z.union([z.string(), z.number().transform((num: number) => String(num))]);

export const ProductIdSchema = createIdSchema();
export const AgencyIdSchema = createIdSchema();
export const AssessorIdSchema = createIdSchema();
export const AdvisorIdSchema = createIdSchema();

// Base schemas
export const EmailSchema = z
  .union([
    z.email(),
    z.string().transform((val: string) => {
      if (!val || val.trim() === '') return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(val) ? val : null;
    }),
    z.null(),
    z.undefined().transform(() => null)
  ])
  .nullable();

export const URLSchema = z
  .union([
    z.url().transform((url: string) => new URL(url)),
    z.string().transform((str: string) => {
      if (!str || str.trim() === '' || str === 'N/A') return null;
      try {
        return new URL(str);
      } catch {
        try {
          return new URL('https://' + str);
        } catch {
          return null;
        }
      }
    }),
    z.instanceof(URL),
    z.null(),
    z.undefined().transform(() => null)
  ])
  .nullable();

// Enum schemas
// TODO: We need to do a status name standardization pass on the data producer side
// Canonical list of certification statuses. Exported separately so consumers
// (e.g. the marketplace status filter) can enumerate all statuses without
// unwrapping the ZodDefault below.
export const PRODUCT_CERT_STATUSES = [
  'Unknown',
  // The legacy "FedRAMP Ready" designation earned under the pre-CR26 process.
  // Canonically surfaced as "Legacy FedRAMP Ready". Producers still emit the old
  // "FedRAMP Ready" / "FRR" strings today; those are normalized to this value at
  // ingest via LEGACY_STATUS_ALIASES, and the producer will emit this exact value
  // directly once the upstream standardization pass lands (targeted July 2026).
  'Legacy FedRAMP Ready',
  'Initial Implementation',
  'FedRAMP Certified',
  // A CSP that remains FedRAMP Certified but is currently operating under a
  // Corrective Action Plan (CAP). Distinct from the overall certification so
  // the marketplace can surface remediation without implying decertification.
  'FedRAMP Certified (In Remediation)',
  'Agency Authorization In Process',
  'FedRAMP In Process',
  'Delisted'
] as const;

export const ProductCertStatusSchema = z.enum(PRODUCT_CERT_STATUSES).default('Unknown');

/**
 * CSP lifecycle phase (CR26 program change). Distinct from certification status:
 *  - `Legacy FedRAMP Ready` — the offering earned FedRAMP Ready under the legacy
 *    process and may now be pursuing a certification (e.g. a Class A). Kept
 *    distinct from Initial Implementation so its legacy origin is visible.
 *  - `Initial Implementation` — the offering is standing up toward certification.
 *  - `Ongoing Certification` — steady-state continuous monitoring / reporting.
 */
export const ProductPhaseSchema = z.enum(['Unknown', 'Legacy FedRAMP Ready', 'Initial Implementation', 'Ongoing Certification']).default('Unknown');

/**
 * A single dated entry in a CSP's certification history / event log. Captures
 * significant FedRAMP program actions (certification milestones, phase changes,
 * status changes, Corrective Action Plan updates, remediation progress, etc.).
 */
export const ProductEventCategorySchema = z
  .enum(['Certification Milestone', 'Phase Change', 'Status Change', 'Corrective Action Plan', 'Remediation Progress', 'Other'])
  .default('Other');

export const ProductEventLogEntrySchema = z.object({
  date: z.string(),
  category: ProductEventCategorySchema,
  description: z.string()
});

/**
 * Maps legacy status names produced by the marketplace data pipeline to the
 * standardized CR26 status enum above. The data producer still emits the old
 * names (e.g. "FedRAMP Authorized" in data.json, and the granular review-stage
 * names in fedramp-status-changelog.json), so we normalize at ingest until the
 * standardization pass lands upstream (see TODO above).
 */
const LEGACY_STATUS_ALIASES: Record<string, z.infer<typeof ProductCertStatusSchema>> = {
  // data.json product.status values
  'FedRAMP Authorized': 'FedRAMP Certified',
  Authorized: 'FedRAMP Certified',
  'Agency In Process': 'Agency Authorization In Process',
  // Legacy standalone "Remediation" status. Under CR26 an offering in
  // remediation remains FedRAMP Certified while operating under a Corrective
  // Action Plan, so it normalizes to the new certified-in-remediation status
  // (which in turn maps to the Ongoing Certification phase).
  Remediation: 'FedRAMP Certified (In Remediation)',
  // fedramp-status-changelog.json status_name / current_status values
  'Agency Review': 'Agency Authorization In Process',
  'PMO Review': 'FedRAMP In Process',
  'JAB Review': 'FedRAMP In Process',
  'Initial Program Review': 'FedRAMP In Process',
  'Final Program Review': 'FedRAMP In Process',
  // Legacy "FedRAMP Ready" producer strings normalize onto the canonical
  // "Legacy FedRAMP Ready" status. Both the human-readable name and the short
  // "FRR" code are aliased so old and new data shapes resolve identically.
  'FedRAMP Ready': 'Legacy FedRAMP Ready',
  FRR: 'Legacy FedRAMP Ready',
  'No Status Found': 'Unknown',
  'No Status Found (Delisted)': 'Delisted'
};

/**
 * Status schema for raw ingested data. Accepts the canonical enum values and
 * transparently maps known legacy aliases onto them before validation, so both
 * old and new data shapes parse cleanly.
 */
export const ProductCertStatusInputSchema = z.preprocess(
  (value) => (typeof value === 'string' && value in LEGACY_STATUS_ALIASES ? LEGACY_STATUS_ALIASES[value] : value),
  ProductCertStatusSchema
);

/**
 * Normalize a raw status string (canonical or legacy alias) to its canonical
 * value, mirroring ProductCertStatusInputSchema. Exposed so consumers that hold
 * a RAW producer value — notably a changelog row's `from_status` — can compare
 * it against an already-normalized `status_name` without re-parsing. Returns the
 * input unchanged when it is not a known alias (the schema still validates it).
 */
export function normalizeStatusName(value: string): string {
  return value in LEGACY_STATUS_ALIASES ? LEGACY_STATUS_ALIASES[value] : value;
}

// Switching this to a string since the ip statuses for many products in the old Auth Log 2.0 are wrong
// export const FedRAMPCertProcessStateSchema = z.enum(['Unknown', 'Active', 'Not Active']).default('Unknown');
export const FedRAMPCertProcessStateSchema = z.string();

export const LegacyImpactLevelSchema = z
  .enum(['LI-SaaS', 'Low', 'Moderate', 'High', '20x Low', '20x Moderate', '20x High', 'Unknown'])
  .default('Unknown');
// Each number corresponds to the impact level of the same index; this is for sorting purposes
// Note: As of 2025-12-05 no products are at impact #1
export const LegacyImpactLevelNumberSchema = z.enum(['0', '1', '2', '3', '4', '5', '6']).default('0');

export const ProductCertClassSchema = z
  .union([z.enum(['Class A', 'Class B', 'Class C', 'Class D', 'Unknown']), z.string().transform(() => 'Unknown' as const)])
  .default('Unknown');

// Currently an service_model is an array of strings with enums.
export const ProductServiceModelSchema = z
  .array(z.enum(['SaaS', 'PaaS', 'IaaS', 'Other', 'Unknown']).catch('Unknown'))
  .transform((arr) => arr.filter((v) => v !== 'Unknown'))
  .default([]);
export const ProductDeploymentModelSchema = z
  .enum(['Government Community Cloud', 'Government-Only Cloud', 'Hybrid Cloud', 'Community Cloud', 'Public Cloud', 'Private Cloud', 'Unknown'])
  .default('Unknown');
// Certification paths as per https://www.whitehouse.gov/wp-content/uploads/2024/07/M-24-15-Modernizing-the-Federal-Risk-and-Authorization-Management-Program.pdf
export const ProductCertPathSchema = z
  .union([z.enum(['JAB', 'Agency', 'Program', 'Unknown']), z.string().transform(() => 'Unknown' as const)])
  .default('Unknown');
export const ProductCertTypeSchema = z
  .union([z.enum(['20x', '20x Pilot', 'Rev5', 'Rev5 Pilot', 'Unknown']), z.string().transform(() => 'Unknown' as const)])
  .default('Unknown');
export const ATOStatusSchema = z.enum(['Active', 'Not Active', 'Unknown']).default('Unknown');
export const ProductBusinessCategorySchema = z
  .enum([
    'Accounting',
    'Analytics',
    'Artificial Intelligence (AI)',
    'Collaboration',
    'Communication',
    'Construction',
    'Contact Center',
    'Content Management System (CMS)',
    'Customer Relations Management (CRM)',
    'Customer Service',
    'Cybersecurity & Risk Management',
    'Data Management',
    'Design & Multimedia',
    'Development Tools',
    'Education & Training',
    'Finance',
    'Fleet Management',
    'Governance, Risk, and Compliance (GRC)',
    'Grant Management',
    'Health & Wellness',
    'Human Resources',
    'Law Enforcement',
    'Learning Management',
    'Legal & Policy',
    'Marketing & Sales',
    'Media',
    'Mobile Device Management (MDM)',
    'Network Management',
    'Operations Management',
    'Research',
    'Storage',
    'System Administration',
    'Talent Development',
    'Talent Management',
    'Travel Management',
    'Unknown',
    'Virtual Private Network (VPN)'
  ])
  .default('Unknown');

// Complex object schemas
export const CertifiedProductSchema = z.object({
  id: ProductIdSchema,
  csp: z.string().optional().default(''),
  cso: z.string().optional().default(''),
  status: ProductCertStatusInputSchema.pipe(z.enum(['FedRAMP Certified', 'Legacy FedRAMP Ready']).catch('FedRAMP Certified')),
  impact_level: LegacyImpactLevelSchema.default('Unknown'),
  impact_level_number: LegacyImpactLevelNumberSchema
});

export const InProcessProductSchema = z.object({
  id: ProductIdSchema,
  csp: z.string().optional().default(''),
  cso: z.string().optional().default(''),
  status: z
    .enum(['Initial Implementation', 'Agency In Process', 'Agency Review', 'FedRAMP Review', 'FedRAMP In Process'])
    .default('Initial Implementation'),
  impact_level: LegacyImpactLevelSchema.default('Unknown'),
  impact_level_number: LegacyImpactLevelNumberSchema
});

export const ProductStatusEntrySchema = z.object({
  status_name: ProductCertStatusInputSchema,
  start_date: z.string().datetime(),
  // Optional context carried from the flat changelog rows (see
  // FlatCertProcessStatusChangelogSchema). Preserved so the CSP Event Log can
  // render richer history entries.
  from_status: z.string().optional(),
  // Per-transition certification descriptors (see FlatCertProcessStatusRowSchema).
  cert_type: ProductCertTypeSchema.optional(),
  cert_path: ProductCertPathSchema.optional(),
  cert_class: ProductCertClassSchema.optional(),
  source: z.string().optional(),
  comments: z.string().optional()
});

export const ProductStatusesSchema = z.object({
  current_status: ProductCertStatusInputSchema,
  statuses: z.array(ProductStatusEntrySchema)
});

/**
 * NEW flat changelog shape emitted by the updated data producer: a single
 * `certprocessstatuschangelog` array of per-transition rows (one row per status
 * transition, across all products). The ingest adapter
 * (`groupCertProcessStatusChangelog` in transforms/entities.ts) groups these by
 * `product_id` into the internal `{ products: { [id]: { current_status, statuses } } }`
 * map that the rest of the codebase already consumes.
 */
export const FlatCertProcessStatusRowSchema = z.object({
  unique_id: z.string().optional(),
  product_id: z.string(),
  csp: z.string().optional(),
  cso: z.string().optional(),
  // Certification descriptors for THIS transition. A single offering can have
  // multiple certification efforts (e.g. already Certified at one class while
  // applying for a higher one), so these are per-transition, not per-product.
  //   cert_type  — 20x | 20x Pilot | Rev5 | Rev5 Pilot  (ProductCertTypeSchema)
  //   cert_path  — JAB | Agency | Program               (ProductCertPathSchema)
  //   cert_class — Class A | Class B | Class C | Class D (ProductCertClassSchema)
  // NOTE: cert_path is now validated against the path enum. The producer
  // previously emitted the cert TYPE "20x" in cert_path; that is being moved to
  // the new cert_type field upstream. Until then, any non-path value (incl.
  // "20x") coerces to 'Unknown' via ProductCertPathSchema.
  cert_type: ProductCertTypeSchema.optional(),
  cert_path: ProductCertPathSchema.optional(),
  cert_class: ProductCertClassSchema.optional(),
  from_status: z.string().optional().default(''),
  to_status: ProductCertStatusInputSchema,
  transition_date: z.string(),
  recorded_date: z.string().optional(),
  source: z.string().optional(),
  comments: z.string().optional().default('')
});

export const FlatCertProcessStatusChangelogSchema = z.object({
  metadata: z
    .object({
      export_timestamp: z.string().optional(),
      description: z.string().optional()
    })
    .optional(),
  data: z.object({
    certprocessstatuschangelog: z.array(FlatCertProcessStatusRowSchema)
  })
});

// -----------------------------------------------------------------------------
// Corrective Action Plan (CAP) / remediation input schemas
//
// A dedicated data source (fedramp-cap-remediation.json in the marketplace
// submodule) that tracks the full CAP lifecycle for a product: whether it is
// currently operating under a CAP, when the CAP was entered/exited, and a
// 1-to-many list of dated remediation events. Ingested independently of the
// product sources and joined onto every consolidated product by product id in
// DataLoader (see transforms/cap-remediation.ts and docs/decisions/0006).
//
// This is the ONLY source that populates `under_cap` / `cap_date` and the
// `Corrective Action Plan` / `Remediation Progress` event-log categories, which
// otherwise have UI support but no data producer.
// -----------------------------------------------------------------------------

/**
 * A single dated event within a product's CAP/remediation instance. The
 * category is constrained to the two remediation-specific values of
 * ProductEventCategorySchema; a producer-supplied unknown value falls back to
 * 'Corrective Action Plan' rather than being rejected, so one bad category does
 * not drop an otherwise-valid event.
 */
export const CapRemediationEventSchema = z.object({
  date: z.string(),
  category: z.enum(['Corrective Action Plan', 'Remediation Progress']).catch('Corrective Action Plan'),
  description: z.string().default('')
});

/**
 * One CAP/remediation instance for a product, with its 1-to-many events.
 *
 *  - `under_cap` reflects the producer's raw flag; the effective marketplace
 *    marker is derived at ingest as `under_cap && !cap_exited_date` (a product
 *    that has exited its CAP is no longer "under" one) — see
 *    transforms/cap-remediation.ts.
 *  - `cap_entered_date` maps to the product's `cap_date`.
 *  - `events` is validated but may be empty.
 */
export const CapRemediationInstanceSchema = z.object({
  product_id: z.string(),
  under_cap: z.boolean().default(false),
  cap_entered_date: z.string().nullable().optional().default(null),
  cap_exited_date: z.string().nullable().optional().default(null),
  events: z.array(CapRemediationEventSchema).default([])
});

/**
 * Top-level shape of fedramp-cap-remediation.json. Mirrors the metadata/data
 * envelope used by the status changelog and FRC-CSO-PKG exports so the three
 * submodule sources are structurally consistent.
 */
export const CapRemediationFileSchema = z.object({
  metadata: z
    .object({
      export_timestamp: z.string().optional(),
      description: z.string().optional()
    })
    .optional(),
  data: z.object({
    'product-cap-remediation': z.array(CapRemediationInstanceSchema)
  })
});

// -----------------------------------------------------------------------------
// Shared CR26 `$defs` mirrors
//
// fedramp-common-definitions-schema-2026-06-24.json#/$defs/logoUri is
// referenced by absolute $id from both the advisor contract (MKT-CAS-WEB
// `/logo`) and the certification package overview (FRC-CSO-PKG
// `/serviceIdentification/logo`), so it is mirrored once here and reused by
// both. Keeping one definition means a future upstream change to the accepted
// extension list cannot be applied to one contract and forgotten on the other.
// -----------------------------------------------------------------------------

// logoUri: a URI whose path ends in a supported image extension.
const LOGO_URI_PATTERN = /\.(png|jpe?g|gif|svg|webp|ico|bmp|tiff?)([?#].*)?$/i;

export const LogoUriSchema = z.url().regex(LOGO_URI_PATTERN, {
  message: 'logo must be a URI ending in a supported image extension (png, jpe?g, gif, svg, webp, ico, bmp, tiff?)'
});

// -----------------------------------------------------------------------------
// FedRAMP Certification Package Overview (FRC-CSO-PKG) input schemas
//
// These mirror the machine-readable overview schema at
// src/lib/data/consolidated-ruleset-schemas/fedramp-certification-package-overview-schema-2026-06-24.json
// They are a NEW data source alongside the legacy CSV-derived data.json pipeline.
// The camelCase field names are intentional — they match the JSON contract 1:1
// so we validate producer output directly before mapping to the marketplace shape
// in src/lib/transforms/FRC-CSO-PKG.ts.
// -----------------------------------------------------------------------------

// $defs/repository — used by trustCenter, secureConfigurationGuidance, additionalRepositories.
export const OverviewRepositorySchema = z.object({
  repositoryType: z.array(z.string()).min(1),
  url: z.url(),
  repositoryDescription: z.string(),
  authenticationRequired: z.boolean(),
  accessRequestInstructions: z.string().optional()
});
// // Conditional-required in the JSON schema: when auth is required, instructions must exist.
// bring this back once if needed
// .refine((repo) => !repo.authenticationRequired || (repo.accessRequestInstructions?.trim().length ?? 0) > 0, {
//   message: 'accessRequestInstructions is required when authenticationRequired is true',
//   path: ['accessRequestInstructions']
// });

// certifiedServices[] — the CR26 replacement for the removed legacy
// `authorized_services` string[] (see ADR-0003).
export const OverviewCertifiedServiceSchema = z.object({
  serviceName: z.string(),
  serviceDescription: z.string(),
  // OPTIONAL as of FRC-CSO-PKG schema $schemaVersion 0.1.4, which dropped
  // `dateAvailable` from the object's `required` list. Keeping it required here
  // would fail the whole build (transformOverviewProducts collects the Zod error
  // and DataLoader throws on any error) the first time a producer omits it.
  dateAvailable: z.iso.date().optional()
});

// thirdPartyInformationResources.certified[]
export const OverviewCertifiedThirdPartyResourceSchema = z.object({
  fedRampCertifiedThirdPartyInformationResource: z.string(),
  useCase: z.string()
});

// thirdPartyInformationResources.nonCertified[]
export const OverviewNonCertifiedThirdPartyResourceSchema = z.object({
  name: z.string(),
  provider: z.string(),
  website: z.url().optional(),
  useCase: z.string()
});

export const OverviewThirdPartyInformationResourcesSchema = z.object({
  certified: z.array(OverviewCertifiedThirdPartyResourceSchema).default([]),
  nonCertified: z.array(OverviewNonCertifiedThirdPartyResourceSchema).default([])
});

// Input schemas (raw data validation only)
export const ProductInputSchema = z.object({
  id: ProductIdSchema,
  csp: z.string().trim().default(''),
  cso: z.string().trim().default(''),
  logo: URLSchema,
  status: ProductCertStatusInputSchema,
  // CSP lifecycle phase (CR26). Optional/loose in raw data — the ProductSchema
  // transform (see derivePhase) resolves the final value, pre-seeding
  // already-certified legacy records to 'Ongoing Certification'.
  phase: z.any().optional(),
  // Corrective Action Plan (CAP) tracking. `under_cap` marks a currently-active
  // CAP; `cap_date` is when the CAP was entered (optional).
  under_cap: z.any().optional(),
  cap_date: z.any().optional(),
  // Chronological certification history / event log entries (optional).
  event_log: z.array(ProductEventLogEntrySchema).optional().default([]),
  authorization: z.number().int().default(0),
  reuse: z.number().int().default(0),
  ready_date: z.any(),
  ready_status: FedRAMPCertProcessStateSchema.optional(),
  ip_jab_date: z.any(),
  ip_jab_status: FedRAMPCertProcessStateSchema.optional(),
  ip_prog_date: z.any(),
  ip_prog_status: FedRAMPCertProcessStateSchema.optional(),
  ip_prog_date2: z.any(),
  ip_agency_date: z.any(),
  ip_agency_status: FedRAMPCertProcessStateSchema.optional(),
  ip_pmo_date: z.any(),
  ip_pmo_status: FedRAMPCertProcessStateSchema.optional(),
  // Raw producer key for the date FedRAMP certified the offering (mirrored as
  // `fedramp_auth` in the CSV). The transform renames it to `cert_date` on the
  // internal model — this is a FedRAMP certification date, distinct from the
  // agency ATO `auth_date` kept on ATO/ReuseATO records.
  auth_date: z.any(),
  // Date the CURRENT certification status took effect. Populated at ingest from
  // the latest status-changelog transition (see DataLoader); distinct from
  // cert_date (when the offering was FedRAMP certified). Null when the
  // product has no changelog history.
  status_date: z.any().optional(),
  // Raw producer certification-path key. The legacy CSV pipeline emits this as
  // `auth_type` (JAB | Agency | Program); the FRC-CSO-PKG path has no equivalent.
  // The transform (ProductSchema in entities.ts) renames it to the internal
  // `cert_path` field as part of the authorization -> certification terminology
  // shift. Distinct from the per-transition `cert_path` on statuses[].
  auth_type: ProductCertPathSchema,
  // Certification class (Class A–D) sourced from the status changelog at ingest
  // (see DataLoader). The legacy CSV pipeline has no equivalent field, so this
  // defaults to 'Unknown' here and is overwritten during changelog reconciliation
  // when the latest transition carries a cert_class value.
  cert_class: ProductCertClassSchema.optional().default('Unknown'),
  partnering_agency: z.union([z.string(), z.null(), z.undefined().transform(() => null)]).nullable(),
  annual_assessment: z.any(),
  independent_assessor: z.union([z.string(), z.null(), z.undefined().transform(() => null)]).nullable(),
  service_model: ProductServiceModelSchema,
  deployment_model: ProductDeploymentModelSchema,
  impact_level: LegacyImpactLevelSchema,
  impact_level_number: LegacyImpactLevelNumberSchema,
  leveraged_systems: z.array(CertifiedProductSchema).default([]),
  agency_authorizations: z.array(z.string()).default([]),
  agency_reuse: z.array(z.string()).default([]),
  // TODO: Do we want to validate so there is no HTML tags? XSS
  service_desc: z.string().trim().default(''),
  // TODO: Do we want to validate so there is no HTML tags? XSS
  fedramp_msg: z.string().trim().default(''),
  sales_email: EmailSchema,
  security_email: EmailSchema,
  website: URLSchema,
  uei: z.union([z.string().trim(), z.null(), z.undefined().transform(() => null)]).nullable(),
  small_business: z.any().default(false),
  // Raw submodule data uses the legacy `business_function` key; the transform
  // (ProductSchema) maps it to `business_categories` per CR26.
  business_function: z.array(z.string()).default([]),
  service_last_90: z.array(z.string()).default([]),
  all_others: z.array(z.string()).default([]),
  filter_classes: z.string().default(''),
  // Certification type / framework (20x | Rev5, incl. their Pilot variants).
  // This is a derived field — the raw producer does not emit it (the transform
  // derives it from impact_level when absent). Renamed from the legacy
  // `auth_category` to `cert_type` for the authorization -> certification shift.
  cert_type: z.enum(['20x', '20x Pilot', 'Rev5', 'Rev5 Pilot', 'Unknown']).catch('Unknown').default('Unknown'),
  // CR26 / FRC-CSO-PKG fields. Only populated by the machine-readable
  // Certification Package Overview data source (see transforms/FRC-CSO-PKG.ts).
  // The legacy CSV pipeline leaves these unset, so they are optional here.
  // NOTE: `certified_services` replaces the removed legacy `authorized_services`
  // string[] field (see ADR-0003). Any stray `authorized_services` key in raw
  // data is silently stripped by Zod (this schema is not strict).
  service_acronym: z.string().trim().optional().default(''),
  trust_center: OverviewRepositorySchema.nullable().optional().default(null),
  secure_configuration_guidance: OverviewRepositorySchema.nullable().optional().default(null),
  certified_services: z.array(OverviewCertifiedServiceSchema).optional().default([]),
  third_party_information_resources: OverviewThirdPartyInformationResourcesSchema.nullable().optional().default(null)
});

export const AgencyInputSchema = z.object({
  id: AgencyIdSchema,
  parent: z.string(),
  sub: z.any(),
  logo: z.any(),
  authorization: z.number().int().default(0),
  reuse: z.number().int().default(0),
  email: z.any(),
  website: z.any(),
  auths: z.array(z.any()).default([]),
  reuses: z.array(z.any()).default([]),
  procs: z.array(z.any()).default([]),
  filter_classes: z.string().default('')
});

export const AssessorInputSchema = z.object({
  id: AssessorIdSchema,
  name: z.string(),
  // TODO: We have one assessor id 100000 that is a placeholder for "Currently contracted with a non-FedRAMP recognized 3PAO" that has a "N/A" logo link
  logo: z.any(),
  products_assessing: z.any(),
  accredited_since: z.any(),
  poc: z.string(),
  email: z.any(),
  founded: z.any(),
  address: z.string(),
  // TODO: Do we want to validate so there is no HTML tags? XSS
  desc: z.string(),
  // TODO: Do we want to validate so there is no HTML tags? XSS
  services: z.any().optional(),
  // TODO: Finding out some CSP names here do not have an associated Product entry in FedRAMP data
  csps: z.any(),
  frameworks: z.any(),
  clients: z.array(z.any()).default([]),
  filter_classes: z.string().default('')
});

export const AdvisorServiceOfferingSchema = z.object({
  serviceName: z.string(),
  serviceDescription: z.string().optional()
});

// -----------------------------------------------------------------------------
// MKT-CAS-WEB (Marketplace Consulting and Advisory Services Website) — FedRAMP
// Advisor Information machine-readable export.
//
// Faithful, standalone Zod representation of the public advisor contract
// (src/lib/data/consolidated-ruleset-schemas/fedramp-advisor-information-schema-2026-06-24.json).
// This is the SOLE source of marketplace advisors — there is no longer a legacy
// data.json Advisors pipeline (mirrors how CertificationPackageOverviewInputSchema
// is a faithful copy of its JSON Schema for products; see docs/decisions/0003 and
// the advisor ADR).
//
// Field mapping (JSON Schema -> this schema): all names/types/required flags
// match the 2026-06-24 contract exactly:
//   advisorName        required  string
//   logo               required  logoUri (URI + image-extension pattern)
//   a2laId             optional  string
//   serviceDescription required  string
//   contactInformation required  string[] (minItems: 1)
//   servicesOffered    required  serviceOffering[] (minItems: 1)
//   customerReferences optional  string[]
// -----------------------------------------------------------------------------

// logoUri from fedramp-common-definitions-schema-2026-06-24.json#/$defs/logoUri:
// a URI whose path ends in a supported image extension. Defined once above as
// LogoUriSchema and shared with the FRC-CSO-PKG overview, which $refs the same
// upstream definition. Retained as a named alias because the advisor field is
// documented by name in the mapping table above.
export const MktCasWebLogoUriSchema = LogoUriSchema;

export const MktCasWebInputSchema = z.object({
  advisorName: z.string(),
  logo: MktCasWebLogoUriSchema,
  a2laId: z.string().optional(),
  serviceDescription: z.string(),
  contactInformation: z.array(z.string()).min(1),
  servicesOffered: z.array(AdvisorServiceOfferingSchema).min(1),
  customerReferences: z.array(z.string()).optional(),
  // FedRAMP-program-supplied listing timestamp appended to each vendor
  // record by the upstream producer (NOT vendor-self-published). ISO 8601
  // string, coerced to a Date; surfaced as `Advisor.fedramp_listing_date`.
  fedramp_listing_timestamp: z.coerce.date(),
  // Retroactively-assigned canonical FedRAMP id the producer may emit. Accepted
  // for forward-compatibility but NOT currently used for the marketplace id —
  // the advisor id/URL slug is derived from advisorName (see
  // transforms/MKT-CAS-WEB.ts::resolveAdvisorId).
  ZD_frid_retro: z.string().optional()
});

// Represents the CSP client of an assessor, specific to a CSO
export const AssessorClientSchema = z.object({
  id: z.string(),
  csp: z.string().optional(),
  cso: z.string().optional(),
  status: z.string().optional(),
  impact_level: LegacyImpactLevelSchema.optional(),
  impact_level_number: LegacyImpactLevelNumberSchema.optional()
});

// -----------------------------------------------------------------------------
// Advisor output type — the single stable runtime shape every advisor consumer
// (AdvisorSearch.svelte, the advisors/[frid] detail page, AdvisorMap) depends on.
//
// Advisors have ONE source: the machine-readable MKT-CAS-WEB export. The
// transform (transforms/MKT-CAS-WEB.ts::mktCasWebToAdvisor) builds objects of
// this shape from the validated MktCasWebInputSchema. This standalone schema is
// the authoritative definition of that shape (the `Advisor` type is inferred
// from it), decoupled from any input contract. Fields with no MKT-CAS-WEB source
// (assessed-client list, impact levels, accreditation/founded dates) are kept on
// the type with safe defaults so the detail page's existing sections still bind;
// they may be populated by a future contract/UI evolution (see the advisor ADR).
// -----------------------------------------------------------------------------
export const AdvisorClientSchema = z.object({
  id: z.string(),
  csp: z.string(),
  cso: z.string(),
  status: ProductCertStatusSchema,
  impact_level: LegacyImpactLevelSchema,
  impact_level_number: z.string()
});

// -----------------------------------------------------------------------------
// Advisor output type — the single stable runtime shape every advisor consumer
// (AdvisorSearch.svelte, the advisors/[frid] detail page, AdvisorMap) depends on.
//
// Advisors have ONE source: the machine-readable MKT-CAS-WEB export
// (`fedramp-mkt-cas-web.json`, validated by `MktCasWebInputSchema`). The vendor
// record now also carries the FedRAMP-program-appended `fedramp_listing_timestamp`,
// which the transform maps to `fedramp_listing_date` below.
//
// `website`, `accredited_since`, and `clients` have NO current MKT-CAS-WEB
// source. They are kept on the type as OPTIONAL/nullable with safe defaults so
// the detail page's existing sections still bind (they simply render empty);
// they may be populated by a future contract/UI evolution (see the advisor ADR).
// -----------------------------------------------------------------------------
export const AdvisorSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: URLSchema,
  // FedRAMP listing date, mapped from the vendor record's
  // `fedramp_listing_timestamp` (see transforms/MKT-CAS-WEB.ts).
  fedramp_listing_date: z.date(),
  // A2LA accreditation id from the MKT-CAS-WEB `a2laId` field. Optional in the
  // contract (only present when the advisor is also an A2LA-accredited company),
  // so it is nullable here and displayed only when present. This is descriptive
  // data on the record — NOT the marketplace id (the id is a name-derived slug;
  // see docs/decisions/0007 "Advisor ID / URL Slug").
  a2la_id: z.string().nullable(),
  // No current MKT-CAS-WEB source — nullable with a null default.
  accredited_since: z.date().nullable().default(null),
  poc: z.string(),
  email: z.string(),
  // No current MKT-CAS-WEB source — URLSchema is already nullable.
  website: URLSchema,
  desc: z.string(),
  customer_references: z.string(),
  services: z.string().nullable(),
  // No current MKT-CAS-WEB source — defaults to an empty list.
  clients: z.array(AdvisorClientSchema).default([])
});

// -----------------------------------------------------------------------------
// FedRAMP Certification Package Overview (FRC-CSO-PKG) — remaining
// input schemas. Repository / CertifiedService / ThirdPartyInformationResources
// are defined above ProductInputSchema because the product output embeds them.
// -----------------------------------------------------------------------------

// $defs/contactInfo — the overview carries a typed contact array (Security, Sales, Primary, ...).
export const OverviewContactInfoSchema = z.object({
  contactType: z.string(),
  contactName: z.string().optional(),
  contactEmail: z.email().optional(),
  contactPhone: z
    .string()
    .regex(/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/)
    .optional()
});

export const OverviewServiceIdentificationSchema = z.object({
  fedRampPackageId: z.string(),
  ueiNumber: z.string().optional(),
  uei: z.string().optional(),
  providerName: z.string(),
  serviceName: z.string(),
  serviceAcronym: z.string(),
  serviceDescription: z.string(),
  // The certification the provider states it is PURSUING. Not a FedRAMP
  // determination — see toCertType in transforms/FRC-CSO-PKG.ts and ADR-0010.
  certificationType: z.enum(['20x', 'Rev5']),
  website: z.url(),
  // logoUri per CDS-CSO-PUB: the upstream contract $refs
  // fedramp-common-definitions-schema#/$defs/logoUri, which asserts BOTH
  // `format: uri` and the image-extension `pattern`. A bare z.url() accepted any
  // URL, which was LOOSER than the producer contract on a field rendered as an
  // <img> src on every product listing.
  logo: LogoUriSchema
  // NOTE: no `certificationClass` / `impactLevel` here. Neither is defined by the
  // upstream overview contract
  // (fedramp-certification-package-overview-schema-2026-06-24.json), and both are
  // FedRAMP determinations rather than provider claims. They were previously
  // accepted as optional extras and seeded onto the Product, which let a
  // CSP-authored document set the certification class shown on a listing. The
  // class now comes exclusively from the status changelog. This object is
  // non-strict, so a producer that still emits these keys is not rejected — the
  // values are simply ignored. See ADR-0010.
});

export const OverviewServicePropertiesSchema = z.object({
  serviceType: z.array(z.enum(['SaaS', 'PaaS', 'IaaS'])).min(1),
  deploymentModel: z.enum(['Public Cloud', 'Government-Only Cloud', 'Hybrid Cloud', 'Community Cloud', 'Government Community Cloud']),
  // Upstream asserts minItems: 1 as well as maxItems: 10. The field itself is
  // absent from serviceProperties.required, so omitting it entirely is legal —
  // but a producer that emits `[]` is non-conforming, and we were accepting it.
  businessCategory: z.array(ProductBusinessCategorySchema).min(1).max(10).optional(),
  trustCenter: OverviewRepositorySchema.optional(),
  secureConfigurationGuidance: OverviewRepositorySchema.optional(),
  additionalRepositories: z.array(OverviewRepositorySchema).optional(),
  nextOngoingCertificationReportDate: z.iso.date().optional()
});

export const OverviewAssessorSchema = z.object({
  name: z.string(),
  // Unique FedRAMP assessor ID (pattern ^\d{6}$). Required per the overview
  // schema. Used to join to the marketplace Assessors map.
  assessorID: z.string().regex(/^\d{6}$/)
});

/**
 * Exact-match presence test for a contact role.
 *
 * Upstream requires both a Security and a Sales contact via
 * `allOf: [{contains: {contactType: {const: 'Security'}}}, {contains:
 * {contactType: {const: 'Sales'}}}]` on `/contactInformation` (CDS-CSO-PUB).
 * `const` is an exact, case-sensitive match, so this is too — deliberately
 * stricter than findContactEmail in transforms/FRC-CSO-PKG.ts, which lowercases
 * before matching. Being looser here would let a mis-typed role satisfy the
 * contract check and then silently fail to resolve in the transform.
 */
function hasContactType(contacts: { contactType: string }[], type: string): boolean {
  return contacts.some((c) => c.contactType === type);
}

/**
 * Top-level FedRAMP Certification Package Overview input schema.
 * Matches fedramp-certification-package-overview-schema-2026-06-24.json.
 */
export const CertificationPackageOverviewInputSchema = z
  .object({
    serviceIdentification: OverviewServiceIdentificationSchema,
    serviceProperties: OverviewServicePropertiesSchema,
    contactInformation: z.array(OverviewContactInfoSchema),
    // The 2026-06-24 schema marks `assessor` required, but a newly-listed offering
    // in the Initial Implementation phase may not have an assessor engaged yet, and
    // real producer packages omit it. Relax to optional for ingest resilience so a
    // missing assessor yields independent_assessor = null rather than dropping the
    // whole listing.
    assessor: OverviewAssessorSchema.optional(),
    certifiedServices: z.array(OverviewCertifiedServiceSchema).optional(),
    thirdPartyInformationResources: OverviewThirdPartyInformationResourcesSchema.optional(),
    // Retroactively-assigned canonical FedRAMP id, present when
    // serviceIdentification.fedRampPackageId still holds a human-readable
    // placeholder (see resolveFedRampId in transforms/FRC-CSO-PKG.ts).
    ZD_frid_retro: z.string().optional()
  })
  // Mirrors the upstream allOf/contains rule the JSON-Schema differ cannot model
  // (reported as UNCHECKED_KEYWORD on /contactInformation and waived in
  // utils/schemaSyncTargets.ts as hand-verified). Note this is all-or-nothing:
  // transforms collect per-record failures and DataLoader throws on any error, so
  // a producer record missing either role fails the whole static build rather
  // than degrading one listing.
  .refine((doc) => hasContactType(doc.contactInformation, 'Security'), {
    message: 'contactInformation must include at least one contact with contactType "Security" (CDS-CSO-PUB)',
    path: ['contactInformation']
  })
  .refine((doc) => hasContactType(doc.contactInformation, 'Sales'), {
    message: 'contactInformation must include at least one contact with contactType "Sales" (CDS-CSO-PUB)',
    path: ['contactInformation']
  });

export const ATOInputSchema = z.object({
  id: z.any(),
  agency_id: z.any(),
  parent: z.any(),
  sub: z.any(),
  ato_date: z.any(),
  auth_date: z.any(),
  exp_date: z.any(),
  assessment_date: z.any()
});

export const ReuseATOInputSchema = ATOInputSchema.omit({
  assessment_date: true
}).extend({
  sub_id: z.any()
});

// Table row schemas
export const ProductAgencyAuthTableRowSchema = z.object({
  agency_name: z.string(),
  sub_agency_name: z.string().nullable(),
  cert_status: ProductCertStatusSchema,
  number_of_reuses: z.number()
});

export const AgencyProductTableRowSchema = z.object({
  csp: z.string(),
  cso: z.string(),
  cert_status: ProductCertStatusSchema,
  agency_status: ATOStatusSchema,
  number_of_reuses: z.number()
});

export const ProductLeveragedSystemsTableRowSchema = z.object({
  csp: z.string(),
  cso: z.string(),
  product_id: z.string()
});

export const TickerLogoSchema = z.object({
  id: z.string(),
  logo: z.string(),
  name: z.string()
});

// Filters schema
const FlexibleFilterArray = z.array(z.union([z.string(), z.object({ name: z.string() }).loose()])).default([]);

// Input schema: matches the raw submodule shape. The product filter list is keyed
// `business_function` here (legacy raw name). The transform renames it to
// `business_categories` for the output `Filters` type below (CR26).
export const FiltersInputSchema = z.object({
  product: z
    .union([
      z.object({
        status: FlexibleFilterArray,
        business_function: FlexibleFilterArray,
        service_model: FlexibleFilterArray,
        impact_level: FlexibleFilterArray,
        // Raw producer filter-group key is `auth_type`; transformed to
        // `cert_path` on the output Filters shape (see entities transform).
        auth_type: FlexibleFilterArray,
        deployment_models: FlexibleFilterArray,
        small_business: FlexibleFilterArray,
        assessor: FlexibleFilterArray
      }),
      z.object({})
    ])
    .optional(),
  agency: z
    .union([
      z.object({
        parent_agency: FlexibleFilterArray,
        authorization: FlexibleFilterArray,
        reuse: FlexibleFilterArray,
        impact_level: FlexibleFilterArray
      }),
      z.object({})
    ])
    .optional(),
  assessor: z
    .union([
      z.object({
        product_assessing: FlexibleFilterArray,
        impact_level: FlexibleFilterArray,
        status: FlexibleFilterArray
      }),
      z.object({})
    ])
    .optional()
});

// Output schema: the normalized, transformed filter shape used throughout the app.
// Each list is a flat string[]; the product filter is exposed as `business_categories`.
export const FiltersSchema = z.object({
  product: z.object({
    status: z.array(z.string()),
    business_categories: z.array(z.string()),
    service_model: z.array(z.string()),
    impact_level: z.array(z.string()),
    cert_path: z.array(z.string()),
    deployment_models: z.array(z.string()),
    small_business: z.array(z.string()),
    assessor: z.array(z.string())
  }),
  agency: z.object({
    parent_agency: z.array(z.string()),
    authorization: z.array(z.string()),
    reuse: z.array(z.string()),
    impact_level: z.array(z.string())
  }),
  assessor: z.object({
    product_assessing: z.array(z.string()),
    impact_level: z.array(z.string()),
    status: z.array(z.string())
  })
});

// ---------------------------------------------------------------------------
// Public products.json export contract
//
// This is the schema for the payload served by
// `src/routes/marketplace/products.json/+server.ts`. It is a PUBLIC data
// contract: renaming or dropping a field here is a breaking change for
// downstream consumers, so the route validates its output against this schema
// before responding (fail-closed) and a unit test parses the generated file.
//
// Terminology note (auth -> cert shift): the export intentionally surfaces
// `cert_date` (was `auth_date`) and `cert_path` (was `auth_type`). `fedramp_auth`
// is retained as a legacy alias sourced from `cert_date`. `authorizations` /
// `agency_authorizations` genuinely count ATO/ATU letters and keep their names.
// ---------------------------------------------------------------------------

// Nullable date field. The route validates the payload BEFORE JSON
// serialization, so at validation time these are `Date | null`; after
// `JSON.stringify` they serialize to an ISO string (or null). Accept both so
// the same schema validates the in-memory payload and a parsed-back file.
const ExportDateString = z.union([z.string(), z.date(), z.null()]);

// A leveraged system as flattened into the export (mirrors CertifiedProductSchema output).
export const ProductExportLeveragedSystemSchema = z.object({
  id: z.string(),
  csp: z.string(),
  cso: z.string(),
  status: z.string(),
  impact_level: z.string(),
  impact_level_number: z.string()
});

// An event-log entry as validated in the export. At route-validation time the
// date is a `Date | null`; after serialization it is an ISO string | null.
export const ProductExportEventLogEntrySchema = z.object({
  date: ExportDateString,
  category: z.string(),
  description: z.string()
});

// URL-or-string field. The handler passes through `product.logo`/`product.website`
// (which are `URL | null` on the transformed Product, coalesced to '' when null),
// so at route-validation time this can be a URL instance or '' ; JSON serializes
// a URL to its string form.
const ExportUrlString = z.union([z.string(), z.instanceof(URL)]);

export const ProductExportSchema = z.object({
  fedramp_id: z.string(),
  name: z.string(),
  cloud_service_provider: z.string(),
  cloud_service_offering: z.string(),
  logo: ExportUrlString,
  status: ProductCertStatusSchema,
  phase: ProductPhaseSchema,
  under_cap: z.boolean(),
  cap_date: ExportDateString,
  event_log: z.array(ProductExportEventLogEntrySchema),
  // Total ATO/ATU letters — genuinely an authorization count (not renamed).
  authorizations: z.number(),
  // Retained for internal FedRAMP reporting; not surfaced in the public UI.
  reuse: z.number(),
  ready_status: z.string(),
  ready_date: ExportDateString,
  ip_jab_status: z.string(),
  ip_jab_date: ExportDateString,
  ip_prog_status: z.string(),
  ip_prog_date: ExportDateString,
  ip_prog_date2: ExportDateString,
  ip_agency_status: z.string(),
  ip_agency_date: ExportDateString,
  ip_pmo_status: z.string(),
  ip_pmo_date: ExportDateString,
  // FedRAMP certification date (renamed from auth_date).
  cert_date: ExportDateString,
  // Certification path: JAB | Agency | Program | Unknown (renamed from auth_type).
  cert_path: ProductCertPathSchema,
  // Certification class: Class A–D | Unknown. Sourced from the status changelog;
  // 'Unknown' when no class has been assigned.
  cert_class: ProductCertClassSchema,
  fedramp_ready: z.string(),
  partnering_agency: z.string(),
  // Legacy alias of cert_date; retained for backward compatibility.
  fedramp_auth: ExportDateString,
  // Empty string when unset (handler coalesces null/undefined to ''); otherwise
  // a Date at route-validation time / ISO string once serialized.
  annual_assessment: z.union([z.string(), z.date(), z.null()]),
  independent_assessor: z.string(),
  service_model: z.array(z.string()),
  deployment_model: ProductDeploymentModelSchema,
  impact_level: LegacyImpactLevelSchema,
  impact_level_number: z.string(),
  leveraged_systems: z.array(ProductExportLeveragedSystemSchema),
  agency_authorizations: z.array(z.string()),
  agency_reuse: z.array(z.string()),
  service_description: z.string(),
  fedramp_msg: z.string(),
  sales_email: z.string(),
  security_email: z.string(),
  website: ExportUrlString,
  uei: z.string(),
  small_business: z.boolean(),
  business_categories: z.array(z.string()),
  service_last_90: z.array(z.string()),
  all_others: z.array(z.string()),
  // CR26 / FRC-CSO-PKG fields.
  service_acronym: z.string(),
  trust_center: OverviewRepositorySchema.nullable(),
  secure_configuration_guidance: OverviewRepositorySchema.nullable(),
  certified_services: z.array(OverviewCertifiedServiceSchema),
  third_party_information_resources: OverviewThirdPartyInformationResourcesSchema.nullable()
});

// Shared envelope `meta` block for the public marketplace JSON exports
// (products.json, atos.json). Both handlers emit this exact shape.
const ExportEnvelopeMetaSchema = z.object({
  last_change: z.string(),
  produced_by: z.string()
});

// Full products.json envelope.
export const ProductsExportSchema = z.object({
  meta: ExportEnvelopeMetaSchema,
  data: z.object({
    Products: z.array(ProductExportSchema)
  })
});

// ---------------------------------------------------------------------------
// Public atos.json export contract
//
// Schema for the payload served by `src/routes/marketplace/atos.json/+server.ts`.
// PUBLIC data contract — the route validates its output against this schema
// before responding (fail-closed) and a unit test parses the generated file.
//
// Terminology note: these records describe agency Authorizations To Operate
// (ATOs) — a genuine authorization domain — so `authorizations`, `reuse`, and
// `ato_*` keep their names. The FedRAMP-side fields, however, follow the
// authorization -> certification shift: `fedramp_certification_status` (was
// `status`) and `fedramp_certification_date` (was `fedramp_authorization_date`).
// All date fields are formatted to strings by the handler (empty string when unset).
// ---------------------------------------------------------------------------
export const ATOExportSchema = z.object({
  fedramp_id: z.string(),
  cloud_service_provider: z.string(),
  cloud_service_offering: z.string(),
  service_description: z.string(),
  business_categories: z.array(z.string()),
  service_model: z.array(z.string()),
  fedramp_certification_status: z.string(),
  independent_assessor: z.string(),
  // SAM.gov Unique Entity Identifier (UEI) for the offering, sourced from the
  // product's `uei`. Empty string when the offering has no UEI on file.
  sam_gov_uei: z.string(),
  authorizations: z.number(), // Total ATO/ATU count
  reuse: z.number(), // Reuse authorizations count
  parent_agency: z.string(),
  // OMB agency identifier for parent_agency. Currently always emitted empty ('')
  // until the agency-name -> OMB-code mapping is added.
  omb_agency_code: z.string(),
  sub_agency: z.string(),
  // OMB bureau identifier for sub_agency. Currently always emitted empty ('')
  // until the sub-agency -> OMB-bureau-code mapping is added.
  omb_bureau_code: z.string(),
  ato_issuance_date: z.string(),
  fedramp_certification_date: z.string(),
  annual_assessment_date: z.string(),
  ato_expiration_date: z.string(),
  ato_type: z.string()
});

// Full atos.json envelope.
export const ATOsExportSchema = z.object({
  meta: ExportEnvelopeMetaSchema,
  data: z.object({
    ATOs: z.array(ATOExportSchema)
  })
});

// Main data schemas
export const ExportMetadataSchema = z.object({
  meta: z
    .object({
      last_change: z.string().transform((str: string) => new Date(str)),
      produced_by: z.string().optional()
    })
    .optional()
});

export const MetricsDataSchema = z.object({
  Metrics: z.object({
    ready: z.number(),
    in_process: z.number(),
    authorized: z.number(),
    total: z.number(),
    latest: z.array(
      z.object({
        id: z.string(),
        logo: URLSchema,
        cso: z.string(),
        date: z.coerce.date(),
        status: ProductCertStatusSchema
      })
    ),
    tickerLogos: z.array(TickerLogoSchema)
  })
});

// For loading JSON data (arrays)
export const FedRAMPDataSchema = z.object({
  ...ExportMetadataSchema.shape,
  data: z.object({
    ...MetricsDataSchema.shape,
    Filters: FiltersSchema,
    Products: z.array(z.unknown()),
    ProductsMap: z.record(z.string(), z.unknown()).optional(),
    Agencies: z.array(z.unknown()),
    AgenciesMap: z.record(z.string(), z.unknown()).optional(),
    Assessors: z.array(z.unknown()),
    AssessorsMap: z.record(z.string(), z.unknown()).optional(),
    Advisors: z.array(z.unknown()).optional(),
    AdvisorMap: z.record(z.string(), z.unknown()).optional(),
    AtoMapping: z.array(z.unknown()),
    ReuseMapping: z.array(z.unknown())
  })
});

export const FedRAMPMarketplaceStatusChangelogSchema = z
  .object({
    metadata: z
      .object({
        export_timestamp: z.string(),
        total_entries: z.number(),
        description: z.string()
      })
      .optional(),
    products: z.record(z.string(), ProductStatusesSchema)
  })
  .transform((raw) => {
    return { products: raw.products };
  });
