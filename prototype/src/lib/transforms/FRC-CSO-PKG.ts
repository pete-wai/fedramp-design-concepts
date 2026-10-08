/* lib/transforms/FRC-CSO-PKG.ts
 *
 * Maps the machine-readable FedRAMP Certification Package Overview
 * (FRC-CSO-PKG) into the marketplace `Product` shape.
 *
 * This is a NEW data source that runs alongside the legacy CSV-derived
 * `data.json` pipeline (see transforms/entities.ts::ProductSchema). We are in
 * the middle of a data migration: some products are described by the old
 * manually-entered CSV export, others by the new structured overview document.
 * Both must resolve to the same `Product` type so downstream Svelte components
 * do not need to know which source a record came from.
 *
 * Source schema:
 *   src/lib/data/consolidated-ruleset-schemas/fedramp-certification-package-overview-schema-2026-06-24.json
 *
 * Field-mapping notes (overview -> product):
 *   fedRampPackageId              -> id                 (see resolveFedRampId:
 *                                                        a human-readable
 *                                                        placeholder is replaced
 *                                                        by the record's
 *                                                        ZD_frid_retro canonical id)
 *   ueiNumber (or uei)             -> uei                ('' -> null)
 *   providerName                  -> csp
 *   serviceName                   -> cso
 *   serviceAcronym                -> service_acronym    (NEW field)
 *   serviceDescription            -> service_desc
 *   certificationType (20x/Rev5)  -> cert_type           (SEED ONLY — see below)
 *   website                       -> website
 *   logo                          -> logo
 *   serviceType[]                 -> service_model
 *   deploymentModel               -> deployment_model
 *   businessCategory[]            -> business_categories
 *   trustCenter                   -> trust_center               (NEW field)
 *   secureConfigurationGuidance   -> secure_configuration_guidance (NEW field)
 *   certifiedServices[]           -> certified_services         (NEW field, full objects; replaces removed legacy authorized_services)
 *   thirdPartyInformationResources-> third_party_information_resources (NEW field)
 *   contactInformation[]          -> sales_email, security_email (lossy: only these two emails kept)
 *   assessor.name                 -> independent_assessor
 *
 * Deliberately NOT mapped:
 *   - nextOngoingCertificationReportDate: NOT the same as annual_assessment.
 *   - certification CLASS: an FRC-CSO-PKG document is CSP-authored (fetched from
 *     the provider's own published URL per CDS-CSO-PUB), and the certification
 *     class is a FedRAMP determination, not a provider claim. `cert_class` is
 *     sourced exclusively from the status changelog in DataLoader. The upstream
 *     overview contract does not define a class field at all (see ADR-0010).
 *   - impact level: likewise not in the upstream overview contract, and sourced
 *     from the legacy pipeline. See the impact_level default below.
 *
 * CSP-declared vs FedRAMP-determined:
 *   `certificationType` states the certification the provider is PURSUING; it is
 *   not FedRAMP's determination of what the provider will receive. It is mapped
 *   here only as a last-resort seed so a brand-new listing shows something, and
 *   DataLoader's changelog reconciliation overrides it with FedRAMP's recorded
 *   cert_type whenever one exists (see ADR-0010).
 *
 * Fields with no overview source (status, authorization/reuse counts, all
 * process dates/statuses, cert path/class, impact_level, leveraged_systems,
 * agency_*, etc.) remain sourced from the legacy pipeline / status changelog and
 * are given safe defaults here.
 */
import { z } from 'zod';
import { CertificationPackageOverviewInputSchema } from '../schemas/marketplace';
import type { Product, ProductCertType, ProductDeploymentModel, ImpactLevel, BusinessCategory } from '../types/marketplace';
import type { EmailAddress } from '../types/emailAddress';

type OverviewInput = z.infer<typeof CertificationPackageOverviewInputSchema>;

/**
 * Extract the email for a given contactType (case-insensitive) from the
 * overview's typed contact array. Returns null when absent.
 */
function findContactEmail(contacts: OverviewInput['contactInformation'], type: string): EmailAddress | null {
  const match = contacts.find((c) => c.contactType?.trim().toLowerCase() === type.toLowerCase() && c.contactEmail);
  return (match?.contactEmail as EmailAddress) ?? null;
}

/**
 * Map the overview `certificationType` enum (20x | Rev5) to the marketplace
 * `cert_type` enum. The overview only carries the two non-pilot values.
 *
 * SEED ONLY. This is the certification the CSP says it is pursuing, self-declared
 * in a document we fetch from the provider's own URL. DataLoader overrides it with
 * FedRAMP's recorded cert_type from the status changelog whenever one exists; this
 * value survives only for listings FedRAMP has not yet ruled on (see ADR-0010).
 */
function toCertType(certificationType: OverviewInput['serviceIdentification']['certificationType']): ProductCertType {
  return certificationType === '20x' ? '20x' : 'Rev5';
}

/**
 * Canonical FedRAMP id pattern: "FR" followed by digits (e.g. FR2333660884).
 */
const CANONICAL_FRID = /^FR\d+$/;

/**
 * Resolve the FedRAMP id for an overview record.
 *
 * For FRC-CSO-PKG records the authoritative marketplace id is the top-level
 * `ZD_frid_retro` value: the updated data producer keys the status changelog
 * (fedramp-status-changelog.json `product_id`) on `ZD_frid_retro`, NOT on
 * `serviceIdentification.fedRampPackageId` (which may still be a human-readable
 * placeholder like "Tarly Cowork (TARLY)" or an older canonical id such as
 * Dispel's "FR2333660884"). Keying the listing off `ZD_frid_retro` keeps the
 * listing id aligned with the changelog so status/phase and Event Log resolve.
 *
 * Precedence:
 *   1. `ZD_frid_retro` when present and non-empty (authoritative for FRC-CSO-PKG).
 *   2. otherwise `fedRampPackageId` if it is already a canonical `FR…` id.
 *   3. otherwise fall back to the raw `fedRampPackageId` (so the record still
 *      gets an id and surfaces as a validation-visible listing rather than
 *      silently vanishing).
 */
export function resolveFedRampId(rawId: string, zdFridRetro?: string | null): string {
  const retro = zdFridRetro?.trim();
  if (retro) return retro;
  const id = rawId.trim();
  if (CANONICAL_FRID.test(id)) return id;
  return id;
}

/**
 * Transform a validated Certification Package Overview document into a
 * marketplace `Product`. Input MUST already be parsed by
 * `CertificationPackageOverviewInputSchema`.
 */
export function overviewToProduct(overview: OverviewInput): Product {
  const {
    serviceIdentification: si,
    serviceProperties: sp,
    contactInformation,
    assessor,
    certifiedServices,
    thirdPartyInformationResources
  } = overview;

  const uei = (si.ueiNumber ?? si.uei)?.trim();

  const product: Product = {
    id: resolveFedRampId(si.fedRampPackageId, overview.ZD_frid_retro),
    csp: si.providerName.trim(),
    cso: si.serviceName.trim(),
    logo: si.logo ? new URL(si.logo) : null,
    // No overview source — sourced from legacy pipeline. Default to 'Unknown'.
    status: 'Unknown',
    phase: 'Unknown',
    under_cap: false,
    cap_date: null,
    event_log: [],
    authorization: 0,
    reuse: 0,
    ready_status: 'Unknown',
    ip_jab_status: 'Unknown',
    ip_prog_status: 'Unknown',
    ip_agency_status: 'Unknown',
    ip_pmo_status: 'Unknown',
    cert_date: null,
    // No overview source. Populated (if ever) from the status changelog in
    // DataLoader; safe null default here.
    status_date: null,
    ip_prog_date: null,
    ip_prog_date2: null,
    ready_date: null,
    ip_pmo_date: null,
    ip_agency_date: null,
    ip_jab_date: null,
    cert_path: 'Unknown',
    // Certification class is a FedRAMP determination and is NOT read from the
    // CSP-authored overview document (the upstream contract defines no class
    // field). Sourced from the status changelog in DataLoader; 'Unknown' until
    // FedRAMP records one. See ADR-0010.
    cert_class: 'Unknown',
    // Last-resort seed only — the CSP's stated target certification. Overridden
    // by FedRAMP's recorded cert_type in DataLoader whenever one exists.
    cert_type: toCertType(si.certificationType),
    partnering_agency: null,
    annual_assessment: null,
    independent_assessor: assessor?.name?.trim() || null,
    service_model: sp.serviceType,
    deployment_model: sp.deploymentModel as ProductDeploymentModel,
    // No overview source (the upstream contract defines no impact level field).
    // Preserved from the legacy pipeline on merge; see LEGACY_OWNED_FIELDS.
    impact_level: 'Unknown' as ImpactLevel,
    impact_level_number: '0',
    leveraged_systems: [],
    agency_authorizations: [],
    agency_reuse: [],
    service_desc: si.serviceDescription?.trim() || '',
    fedramp_msg: '',
    sales_email: findContactEmail(contactInformation, 'Sales'),
    security_email: findContactEmail(contactInformation, 'Security'),
    website: si.website ? new URL(si.website) : null,
    uei: uei ? uei : null,
    small_business: false,
    business_categories: (sp.businessCategory ?? []) as BusinessCategory[],
    service_last_90: [],
    all_others: [],
    filter_classes: '',
    // CR26 / FRC-CSO-PKG additions.
    service_acronym: si.serviceAcronym?.trim() || '',
    trust_center: sp.trustCenter ?? null,
    secure_configuration_guidance: sp.secureConfigurationGuidance ?? null,
    certified_services: certifiedServices ?? [],
    third_party_information_resources: thirdPartyInformationResources ?? null
  };

  return product;
}

/**
 * Fields on `Product` that the FRC-CSO-PKG overview document does NOT carry and
 * therefore must NOT clobber a colliding legacy record with. `overviewToProduct`
 * fills these with safe defaults (0 / null / 'Unknown' / []), so on an id
 * collision they would blank out real legacy data (authorization count,
 * certification date, cert path/class/impact level, agency authorizations, etc.)
 * unless we explicitly preserve the legacy value. See mergeProductWithLegacy.
 *
 * NOTE: `status`, `phase`, and `status_date` are intentionally NOT listed here —
 * they are reconciled from the status changelog in DataLoader after this merge,
 * which is the authoritative source for certification status (see ADR-0007).
 * `cert_type` is likewise excluded: the changelog override in DataLoader runs
 * after the merge and wins for it too (ADR-0010).
 */
const LEGACY_OWNED_FIELDS = [
  'authorization',
  'reuse',
  'cert_date',
  'cert_path',
  // The overview never populates cert_class (it is always the 'Unknown' default),
  // so on an id collision the legacy value must survive the merge. The changelog
  // override in DataLoader then wins over both. See ADR-0010.
  'cert_class',
  'impact_level',
  'impact_level_number',
  'agency_authorizations',
  'agency_reuse',
  'leveraged_systems',
  'partnering_agency',
  'annual_assessment',
  'ready_status',
  'ready_date',
  'ip_jab_status',
  'ip_jab_date',
  'ip_prog_status',
  'ip_prog_date',
  'ip_prog_date2',
  'ip_agency_status',
  'ip_agency_date',
  'ip_pmo_status',
  'ip_pmo_date',
  'small_business',
  'filter_classes',
  'service_last_90',
  'all_others',
  'fedramp_msg',
  'event_log'
] as const satisfies readonly (keyof Product)[];

/**
 * True when a value is one of `overviewToProduct`'s "no overview source" empty
 * defaults, i.e. the FRC record carries no real data for that field.
 */
function isEmptyOverviewValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  // `impact_level_number` is a string enum whose overview default is '0'
  // (see overviewToProduct), so the string '0' is an empty default too.
  if (typeof value === 'string') return value.trim() === '' || value === 'Unknown' || value === '0';
  if (typeof value === 'number') return value === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Field-level merge of an FRC-CSO-PKG (machine-readable, authoritative during
 * migration) product over the legacy CSV-derived product that shares its id.
 *
 * The FRC record wins for every field it actually populates (csp, cso, logo,
 * certified_services, service_acronym, trust_center, contacts, description,
 * business categories, etc.). But for the LEGACY_OWNED_FIELDS the FRC document
 * does not carry — authorization count, certification date, cert path,
 * impact/class level, agency authorizations, and the review-stage
 * statuses/dates — the legacy value is preserved whenever the overview record
 * only has its empty default. This fixes the bug where a product present in
 * both sources lost its authorization count,
 * "Certified Since" date, and certification path/class after consolidation.
 *
 * Field precedence, per LEGACY_OWNED_FIELD:
 *   - FRC value when the FRC record actually populated it (non-empty).
 *   - otherwise the legacy value.
 * All other fields always take the FRC value (whole-object override intent of
 * ADR-0003 is preserved for the fields the overview owns).
 */
export function mergeProductWithLegacy(overview: Product, legacy: Product): Product {
  const merged: Product = { ...overview };
  for (const field of LEGACY_OWNED_FIELDS) {
    if (isEmptyOverviewValue(overview[field])) {
      // Preserve the legacy value the overview source does not supply. The keys
      // in LEGACY_OWNED_FIELDS are `keyof Product`, so this copy is field-typed.
      assignField(merged, legacy, field);
    }
  }
  return merged;
}

/**
 * Copy a single `keyof Product` field from `source` onto `target`, typed so the
 * assignment is checked against that exact field's type (avoids a blanket cast).
 */
function assignField<K extends keyof Product>(target: Product, source: Product, key: K): void {
  target[key] = source[key];
}

/**
 * Parse + transform an array of raw overview documents into marketplace
 * products, collecting per-record errors instead of throwing so a single bad
 * document does not fail the whole build.
 */
export function transformOverviewProducts(rawOverviews: unknown[]): {
  products: Product[];
  errors: string[];
} {
  const products: Product[] = [];
  const errors: string[] = [];

  rawOverviews.forEach((raw, index) => {
    try {
      const parsed = CertificationPackageOverviewInputSchema.parse(raw);
      products.push(overviewToProduct(parsed));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const detail = error.issues.map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
        errors.push(`Overview transformation at index ${index}: ${detail}`);
      } else {
        errors.push(`Overview transformation at index ${index}: ${error}`);
      }
    }
  });

  return { products, errors };
}
