/* lib/transforms/entities.ts */
import { z } from 'zod';
import { stringToDate } from '../utils/dateUtils';
import { stringToBoolean, parseStringList, stringToInt } from '../utils/stringUtils';
import { mapImpactLevel } from '../utils/validationUtils';
import {
  ProductInputSchema,
  AgencyInputSchema,
  AssessorInputSchema,
  AdvisorSchema,
  ProductCertStatusSchema,
  ProductPhaseSchema,
  ProductCertPathSchema,
  ProductCertClassSchema,
  ProductDeploymentModelSchema,
  ProductServiceModelSchema,
  ProductBusinessCategorySchema,
  LegacyImpactLevelSchema,
  CertifiedProductSchema,
  URLSchema,
  EmailSchema,
  AssessorClientSchema,
  FiltersSchema,
  FiltersInputSchema,
  ExportMetadataSchema,
  MetricsDataSchema,
  ProductIdSchema,
  AgencyIdSchema,
  AssessorIdSchema,
  AdvisorIdSchema,
  InProcessProductSchema,
  FlatCertProcessStatusChangelogSchema
} from '../schemas/marketplace';
import { ATOSchema, ReuseATOSchema } from '../transforms';
import type {
  Product,
  ProductCertType,
  Agency,
  Assessor,
  FedRAMPMarketplaceStatusChangelog,
  ProductId,
  TickerLogo,
  AssessorId,
  Filters,
  FedRAMPCertProcessState
} from '../types/marketplace';
import type { EmailAddress } from '../types/emailAddress';

/**
 * Resolve a product's lifecycle Phase.
 *
 * Precedence:
 *  1. An explicit, valid phase from the data producer always wins. This matters
 *     for `Delisted` offerings especially: a CSP can be delisted from either the
 *     Initial Implementation phase (e.g. it withdraws its certification
 *     application) or the Ongoing Certification phase (e.g. it fails to resolve a
 *     Corrective Action Plan in time). Delisting is orthogonal to phase, so if
 *     the producer tells us which phase it was in, we keep it.
 *  2. Otherwise, pre-seed legacy/undated records from their certification status:
 *     - Any already-certified offering (`FedRAMP Certified` or
 *       `FedRAMP Certified (In Remediation)`) is past Initial Implementation and
 *       is therefore treated as `Ongoing Certification`.
 *     - `Legacy FedRAMP Ready` maps to the `Legacy FedRAMP Ready` phase: it
 *       earned Ready under the legacy process and may now be pursuing a
 *       certification (e.g. a Class A). Kept distinct from Initial
 *       Implementation so its origin shows.
 *     - Other pre-certification statuses (`Agency Authorization In Process`,
 *       `FedRAMP In Process`, or the legacy `Initial Implementation` status) map
 *       to the `Initial Implementation` phase.
 *  3. Anything else — including a terminal `Delisted` status with no explicit
 *     phase — falls back to `Unknown`. We deliberately do NOT guess a phase from
 *     `Delisted`, since it is reachable from either phase. (Delisted products are
 *     also filtered out before render; see transformProducts.)
 */
const ONGOING_CERTIFICATION_STATUSES = new Set(['FedRAMP Certified', 'FedRAMP Certified (In Remediation)']);

const INITIAL_IMPLEMENTATION_STATUSES = new Set(['Agency Authorization In Process', 'FedRAMP In Process', 'Initial Implementation']);

export function derivePhase(rawPhase: unknown, rawStatus: unknown): z.infer<typeof ProductPhaseSchema> {
  if (rawPhase === 'Legacy FedRAMP Ready' || rawPhase === 'Initial Implementation' || rawPhase === 'Ongoing Certification') {
    return rawPhase;
  }
  if (typeof rawStatus === 'string') {
    if (ONGOING_CERTIFICATION_STATUSES.has(rawStatus)) {
      return 'Ongoing Certification';
    }
    if (rawStatus === 'Legacy FedRAMP Ready') {
      return 'Legacy FedRAMP Ready';
    }
    if (INITIAL_IMPLEMENTATION_STATUSES.has(rawStatus)) {
      return 'Initial Implementation';
    }
  }
  return 'Unknown';
}

/**
 * Resolve a product's certification status + lifecycle phase from the marketplace
 * status changelog (fedramp-status-changelog.json).
 * status of their own — that data lives in the changelog, keyed by the same
 * product id (see transforms/FRC-CSO-PKG.ts, which defaults status to 'Unknown').
 * When an overview product has a matching changelog entry, this helper normalizes
 * its `current_status` through the same alias map used everywhere else and derives
 * the phase from it, so a CDS-CSO-PUB-sourced offering surfaces the correct status
 * (e.g. a pre-certification changelog status resolves to the Initial Implementation
 * phase) rather than a bare 'Unknown'.
 *
 * Returns `null` when there is no usable changelog entry, so callers can leave the
 * overview product's safe defaults untouched.
 */
export function resolveStatusFromChangelog(
  productId: string,
  statusChangelog: FedRAMPMarketplaceStatusChangelog
): {
  status: z.infer<typeof ProductCertStatusSchema>;
  phase: z.infer<typeof ProductPhaseSchema>;
  statusDate: Date | null;
  certPath: z.infer<typeof ProductCertPathSchema> | null;
  certClass: z.infer<typeof ProductCertClassSchema> | null;
  certType: ProductCertType | null;
} | null {
  const entry = statusChangelog.products[productId];
  if (!entry) return null;

  // `current_status` is already normalized through ProductCertStatusInputSchema
  // (which applies LEGACY_STATUS_ALIASES) when the changelog is parsed.
  const status = entry.current_status as z.infer<typeof ProductCertStatusSchema>;

  // The date the current status took effect: the start_date of the most recent
  // transition (statuses are stored ascending by date; see
  // groupCertProcessStatusChangelog). Null when unparseable/absent.
  const latest = entry.statuses?.[entry.statuses.length - 1];
  const statusDate = latest ? stringToDate(latest.start_date) || null : null;

  // Walk backwards through transitions to find the most recent row that carries
  // a non-empty, non-default value for cert_path / cert_class / cert_type. This
  // guards against a data entry error on the latest row (e.g. an empty string or
  // a missing field that defaulted to 'Unknown') silently wiping out a correct
  // value from an earlier transition.
  const statuses = entry.statuses ?? [];
  const certPath = (() => {
    for (let i = statuses.length - 1; i >= 0; i--) {
      const v = statuses[i].cert_path;
      if (v != null && v.trim() !== '' && v !== 'Unknown') return v as z.infer<typeof ProductCertPathSchema>;
    }
    return null;
  })();
  const certClass = (() => {
    for (let i = statuses.length - 1; i >= 0; i--) {
      const v = statuses[i].cert_class;
      if (v != null && v.trim() !== '' && v !== 'Unknown') return v as z.infer<typeof ProductCertClassSchema>;
    }
    return null;
  })();
  // Certification type (20x | 20x Pilot | Rev5 | Rev5 Pilot). FedRAMP-determined,
  // and distinct from the CSP-declared `certificationType` in an FRC-CSO-PKG
  // document, which states the certification the provider is PURSUING and is not
  // a FedRAMP determination of what they will receive. Null when FedRAMP has not
  // recorded a type on any transition yet, so callers can fall back rather than
  // blanking a listing (see ADR-0010).
  const certType = (() => {
    for (let i = statuses.length - 1; i >= 0; i--) {
      const v = statuses[i].cert_type;
      if (v != null && v.trim() !== '' && v !== 'Unknown') return v as ProductCertType;
    }
    return null;
  })();

  return { status, phase: derivePhase(undefined, status), statusDate, certPath, certClass, certType };
}

/**
 * Adapt the NEW flat changelog shape emitted by the updated data producer — a
 * single `data.certprocessstatuschangelog` array of per-transition rows — into
 * the internal grouped `{ products: { [id]: { current_status, statuses } } }`
 * map that the rest of the codebase (resolveStatusFromChangelog, ticker,
 * Event Log) already consumes.
 *
 * Grouping:
 *  - rows are grouped by `product_id`
 *  - within a product, transitions are sorted ascending by `transition_date`
 *  - `current_status` is the `to_status` of the row with the LATEST
 *    `transition_date`
 *  - each transition becomes a `statuses` entry (status_name = to_status,
 *    start_date = transition_date) carrying the extra context fields so the CSP
 *    Event Log can render richer history.
 *
 * `to_status` / status_name values are normalized through
 * ProductCertStatusInputSchema when the flat file is parsed by
 * FlatCertProcessStatusChangelogSchema, so the same alias map applies here.
 */
export function groupCertProcessStatusChangelog(
  rows: z.infer<typeof FlatCertProcessStatusChangelogSchema>['data']['certprocessstatuschangelog']
): FedRAMPMarketplaceStatusChangelog {
  const byProduct = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row);
    byProduct.set(row.product_id, list);
  }

  const products: FedRAMPMarketplaceStatusChangelog['products'] = {};

  for (const [productId, productRows] of byProduct.entries()) {
    // Ascending by transition_date; rows with an unparseable date sort first.
    const sorted = [...productRows].sort((a, b) => {
      const at = new Date(a.transition_date).getTime();
      const bt = new Date(b.transition_date).getTime();
      return (isNaN(at) ? -Infinity : at) - (isNaN(bt) ? -Infinity : bt);
    });

    const statuses = sorted.map((row) => ({
      status_name: row.to_status,
      start_date: row.transition_date,
      from_status: row.from_status,
      cert_type: row.cert_type,
      cert_path: row.cert_path,
      cert_class: row.cert_class,
      source: row.source,
      comments: row.comments
    }));

    // Latest transition wins for current_status.
    const current_status = sorted[sorted.length - 1]?.to_status ?? 'Unknown';

    products[productId] = { current_status, statuses };
  }

  return { products };
}

/**
 * Build CSP Event Log (Certification History) entries for a product from its
 * grouped changelog statuses. Each status transition becomes a dated
 * "Status Change" entry, newest-first ordering is left to the Event Log
 * component. Returns [] when the product has no changelog history.
 *
 * The description reads e.g. "Status changed from FedRAMP In Process to
 * FedRAMP Certified" (or "Status set to …" for the first/initial transition),
 * with any producer-supplied comment appended.
 */
export function buildEventLogFromChangelog(productId: string, statusChangelog: FedRAMPMarketplaceStatusChangelog): Product['event_log'] {
  const entry = statusChangelog.products[productId];
  if (!entry || !entry.statuses?.length) return [];

  return entry.statuses.map((s) => {
    const from = s.from_status?.trim();
    const base = from ? `Status changed from ${from} to ${s.status_name}` : `Status set to ${s.status_name}`;
    const comment = s.comments?.trim();
    return {
      date: stringToDate(s.start_date) || null,
      category: 'Status Change' as const,
      description: comment ? `${base}. ${comment}` : base
    };
  });
}

// Transform schemas (business logic transformations)
export const ProductSchema = ProductInputSchema.transform((rawProduct) => {
  const toProcessState = (status: unknown): FedRAMPCertProcessState => {
    if (typeof status !== 'string') return 'Unknown';

    const statusStr = status.trim().toLowerCase();

    if (statusStr === 'active' || statusStr === 'authorized' || statusStr === 'complete') {
      return 'Active';
    }
    if (statusStr === 'not active' || statusStr === 'inactive' || statusStr === 'disabled') {
      return 'Not Active';
    }

    return 'Unknown';
  };
  const transformed = {
    id: String(rawProduct.id).trim(),
    csp: rawProduct.csp?.trim() || '',
    cso: rawProduct.cso?.trim() || '',
    logo: rawProduct.logo,
    status: (rawProduct.status || 'Unknown') as z.infer<typeof ProductCertStatusSchema>,
    // Phase is sourced from the data producer when present. Legacy records predate
    // the field, so derivePhase pre-seeds it from the (already-normalized)
    // certification status: certified offerings map to Ongoing Certification;
    // pre-certification statuses (Legacy FedRAMP Ready, Agency Authorization In Process,
    // FedRAMP In Process, Initial Implementation) map to Initial Implementation.
    phase: derivePhase(rawProduct.phase, rawProduct.status),
    under_cap: stringToBoolean(rawProduct.under_cap),
    cap_date: stringToDate(rawProduct.cap_date) || null,
    event_log: Array.isArray(rawProduct.event_log)
      ? rawProduct.event_log.map((entry) => ({
          date: stringToDate(entry.date) || null,
          category: entry.category,
          description: entry.description
        }))
      : [],
    authorization: rawProduct.authorization || 0,
    reuse: rawProduct.reuse || 0,
    ready_status: toProcessState(rawProduct.ready_status) as FedRAMPCertProcessState,
    ip_jab_status: toProcessState(rawProduct.ip_jab_status) as FedRAMPCertProcessState,
    ip_prog_status: toProcessState(rawProduct.ip_prog_status) as FedRAMPCertProcessState,
    ip_agency_status: toProcessState(rawProduct.ip_agency_status) as FedRAMPCertProcessState,
    ip_pmo_status: toProcessState(rawProduct.ip_pmo_status) as FedRAMPCertProcessState,

    // FedRAMP certification date. Read from the raw producer's `auth_date` key
    // (a certification date, not an agency ATO date) and exposed as `cert_date`.
    cert_date: stringToDate(rawProduct.auth_date) || null,
    // Date the current status took effect. Sourced from the latest changelog
    // transition in DataLoader; the raw product input has no such field, so it
    // defaults to null here and is overwritten during changelog reconciliation.
    status_date: stringToDate(rawProduct.status_date) || null,
    ip_prog_date: stringToDate(rawProduct.ip_prog_date) || null,
    ip_prog_date2: stringToDate(rawProduct.ip_prog_date2) || null,
    ready_date: stringToDate(rawProduct.ready_date) || null,
    ip_pmo_date: stringToDate(rawProduct.ip_pmo_date) || null,
    ip_agency_date: stringToDate(rawProduct.ip_agency_date) || null,
    ip_jab_date: stringToDate(rawProduct.ip_jab_date) || null,
    // Certification path. Read from the raw producer's legacy `auth_type` key
    // and exposed on the internal model as `cert_path` (authorization ->
    // certification terminology shift).
    cert_path: (rawProduct.auth_type || 'Unknown') as z.infer<typeof ProductCertPathSchema>,
    // Certification class (Class A–D). The legacy CSV pipeline has no cert_class
    // field; it is populated in DataLoader from the latest changelog transition.
    // Reads through the input schema's default ('Unknown') so the field is always
    // present on the transformed product.
    cert_class: (rawProduct.cert_class ?? 'Unknown') as z.infer<typeof ProductCertClassSchema>,
    cert_type:
      rawProduct.cert_type && rawProduct.cert_type !== 'Unknown'
        ? rawProduct.cert_type
        : rawProduct.impact_level?.startsWith('20x')
          ? ('20x' as ProductCertType)
          : ('Rev5' as ProductCertType),
    partnering_agency:
      rawProduct.partnering_agency === 'Not In Process' || rawProduct.partnering_agency?.trim() === '' ? null : rawProduct.partnering_agency || null,
    annual_assessment: stringToDate(rawProduct.annual_assessment),
    independent_assessor: rawProduct.independent_assessor !== 'N/A' ? rawProduct.independent_assessor || null : null,
    service_model: Array.isArray(rawProduct.service_model) ? ProductServiceModelSchema.parse(rawProduct.service_model) : [],
    deployment_model: (rawProduct.deployment_model || 'Unknown') as z.infer<typeof ProductDeploymentModelSchema>,
    impact_level: mapImpactLevel(rawProduct.impact_level),
    impact_level_number: rawProduct.impact_level_number || '0',
    leveraged_systems: Array.isArray(rawProduct.leveraged_systems)
      ? rawProduct.leveraged_systems.map((ls: unknown) => CertifiedProductSchema.parse(ls))
      : [],
    agency_authorizations: Array.isArray(rawProduct.agency_authorizations)
      ? rawProduct.agency_authorizations.map((agencyName: string) => agencyName.trim())
      : [],
    agency_reuse: Array.isArray(rawProduct.agency_reuse) ? rawProduct.agency_reuse.map((agencyName: string) => agencyName.trim()) : [],
    service_desc: (rawProduct.service_desc || '').trim(),
    fedramp_msg: (rawProduct.fedramp_msg || '').trim(),
    sales_email: (rawProduct.sales_email as EmailAddress) || null,
    security_email: (rawProduct.security_email as EmailAddress) || null,
    website: rawProduct.website,
    uei: rawProduct.uei?.trim() === '' ? null : rawProduct.uei?.trim() || null,
    small_business: stringToBoolean(rawProduct.small_business),
    // NOTE: the raw submodule data still uses the legacy `business_function` key.
    // We read from it here and expose it as `business_categories` (CR26 rename).
    business_categories: Array.isArray(rawProduct.business_function)
      ? rawProduct.business_function
          .filter((bf) => bf && bf.trim() !== '')
          .map((bf) => {
            try {
              return ProductBusinessCategorySchema.parse(bf.trim());
            } catch {
              console.warn(`Invalid business category: "${bf}", defaulting to Unknown`);
              return 'Unknown' as const;
            }
          })
      : [],
    service_last_90: Array.isArray(rawProduct.service_last_90) ? rawProduct.service_last_90.map((service: string) => service?.trim() || '') : [],
    all_others: Array.isArray(rawProduct.all_others) ? rawProduct.all_others.map((service: string) => service?.trim() || '') : [],
    filter_classes: rawProduct.filter_classes || '',
    // CR26 / FRC-CSO-PKG fields. The legacy CSV pipeline does not populate these,
    // so they fall back to empty/null. The machine-readable overview source
    // (transforms/FRC-CSO-PKG.ts) is what actually fills them in.
    // NOTE: the legacy `authorized_services` field was removed (see ADR-0003);
    // `certified_services` is its replacement.
    service_acronym: rawProduct.service_acronym?.trim() || '',
    trust_center: rawProduct.trust_center ?? null,
    secure_configuration_guidance: rawProduct.secure_configuration_guidance ?? null,
    certified_services: Array.isArray(rawProduct.certified_services) ? rawProduct.certified_services : [],
    third_party_information_resources: rawProduct.third_party_information_resources ?? null
  };
  return transformed;
});

export const AgencySchema = AgencyInputSchema.transform((rawAgency) => {
  return {
    id: String(rawAgency.id),
    parent: String(rawAgency.parent || '').trim(),
    sub: rawAgency.sub && String(rawAgency.sub).trim() !== '' ? String(rawAgency.sub).trim() : null,
    logo: URLSchema.parse(rawAgency.logo),
    authorization: rawAgency.authorization || 0,
    reuse: rawAgency.reuse || 0,
    email: EmailSchema.parse(rawAgency.email),
    website: URLSchema.parse(rawAgency.website),
    auths: Array.isArray(rawAgency.auths) ? rawAgency.auths.map((auth: unknown) => CertifiedProductSchema.parse(auth)) : [],
    reuses: Array.isArray(rawAgency.reuses) ? rawAgency.reuses.map((reuse: unknown) => CertifiedProductSchema.parse(reuse)) : [],
    procs: Array.isArray(rawAgency.procs) ? rawAgency.procs.map((proc: unknown) => InProcessProductSchema.parse(proc)) : [],
    filter_classes: String(rawAgency.filter_classes || '')
  };
});

export const AssessorSchema = AssessorInputSchema.transform((rawAssessor) => {
  const transformedClients = rawAssessor.clients.map((client: unknown) => {
    const clientData = AssessorClientSchema.parse(client);
    let validatedStatus: z.infer<typeof ProductCertStatusSchema>;
    try {
      validatedStatus = ProductCertStatusSchema.parse(clientData.status);
    } catch {
      validatedStatus = 'Unknown'; // Fallback for invalid statuses
    }

    return {
      id: String(clientData.id).trim() as ProductId,
      csp: String(clientData.csp || '').trim(),
      cso: String(clientData.cso || '').trim(),
      status: validatedStatus,
      impact_level: mapImpactLevel(clientData.impact_level || 'Unknown'),
      impact_level_number: clientData.impact_level_number || '0'
    };
  });

  const impactLevelHierarchy: Record<string, number> = {
    Unknown: 0,
    'LI-SaaS': 2,
    Low: 3,
    Moderate: 4,
    High: 5
  };

  let highestImpactLevel: z.infer<typeof LegacyImpactLevelSchema> = 'Unknown';
  let highestImpactLevelNumber: number = 0;
  let clientsInProcess = 0;
  let has20xAssessed = false;

  for (const client of transformedClients) {
    if (client.status === 'Initial Implementation') {
      clientsInProcess++;
    }
    if (client.impact_level.includes('20x')) {
      has20xAssessed = true;
    } else {
      const clientImpactNumber: number = impactLevelHierarchy[client.impact_level] || 0;
      if (clientImpactNumber > highestImpactLevelNumber) {
        highestImpactLevelNumber = clientImpactNumber;
        highestImpactLevel = client.impact_level;
      }
    }
  }

  return {
    id: String(rawAssessor.id) as AssessorId,
    name: String(rawAssessor.name || '').trim(),
    logo: URLSchema.parse(rawAssessor.logo),
    products_assessing: stringToInt(rawAssessor.products_assessing) || 0,
    accredited_since: stringToDate(rawAssessor.accredited_since),
    poc: String(rawAssessor.poc || ''),
    email: EmailSchema.parse(rawAssessor.email) as EmailAddress,
    founded: (() => {
      const year = parseInt(String(rawAssessor.founded));
      if (!isNaN(year) && year > 1800 && year < 2100) {
        return new Date(year, 0, 1);
      }

      const fullDate = new Date(rawAssessor.founded);
      if (fullDate instanceof Date && !isNaN(fullDate.getTime())) {
        return fullDate;
      }

      return null;
    })(),
    address: String(rawAssessor.address || ''),
    desc: String(rawAssessor.desc || ''),
    services: String(rawAssessor.services) || null,
    csps: parseStringList(String(rawAssessor.csps || '')),
    frameworks: parseStringList(String(rawAssessor.frameworks || '')),
    clients: transformedClients,
    filter_classes: String(rawAssessor.filter_classes || ''),
    highest_impact_level: highestImpactLevel,
    highest_impact_level_number: highestImpactLevelNumber,
    clients_in_process: clientsInProcess,
    has_20x_assessed: has20xAssessed
  };
});

export const FiltersTransformSchema = FiltersInputSchema.transform((rawFilters: unknown) => {
  // console.log('Filter data structure:', JSON.stringify(rawFilters, null, 2));
  // Helper to extract names from filter arrays (possibly move this into another file?)
  const extractNames = (arr: unknown[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item: unknown) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'name' in item) {
        return String((item as { name: unknown }).name);
      }
      return String(item);
    });
  };

  const filters = rawFilters as Record<string, unknown> | null | undefined;

  return {
    product: {
      status: extractNames(((filters?.product as Record<string, unknown>)?.status as unknown[]) || []),
      // Raw filters still key this as `business_function`; expose as `business_categories`.
      business_categories: extractNames(((filters?.product as Record<string, unknown>)?.business_function as unknown[]) || []),
      service_model: extractNames(((filters?.product as Record<string, unknown>)?.service_model as unknown[]) || []),
      impact_level: extractNames(((filters?.product as Record<string, unknown>)?.impact_level as unknown[]) || []),
      // Raw filters key this as `auth_type`; expose as `cert_path` (auth -> cert rename).
      cert_path: extractNames(((filters?.product as Record<string, unknown>)?.auth_type as unknown[]) || []),
      deployment_models: extractNames(((filters?.product as Record<string, unknown>)?.deployment_models as unknown[]) || []),
      small_business: extractNames(((filters?.product as Record<string, unknown>)?.small_business as unknown[]) || []),
      assessor: extractNames(((filters?.product as Record<string, unknown>)?.assessor as unknown[]) || [])
    },
    agency: {
      parent_agency: extractNames(((filters?.agency as Record<string, unknown>)?.parent_agency as unknown[]) || []),
      authorization: extractNames(((filters?.agency as Record<string, unknown>)?.authorization as unknown[]) || []),
      reuse: extractNames(((filters?.agency as Record<string, unknown>)?.reuse as unknown[]) || []),
      impact_level: extractNames(((filters?.agency as Record<string, unknown>)?.impact_level as unknown[]) || [])
    },
    assessor: {
      product_assessing: extractNames(((filters?.assessor as Record<string, unknown>)?.product_assessing as unknown[]) || []),
      impact_level: extractNames(((filters?.assessor as Record<string, unknown>)?.impact_level as unknown[]) || []),
      status: extractNames(((filters?.assessor as Record<string, unknown>)?.status as unknown[]) || [])
    }
  };
});

export const FedRAMPDataIndexedSchema = z.object({
  ...ExportMetadataSchema.shape,
  data: z.object({
    ...MetricsDataSchema.shape,
    Filters: FiltersSchema,
    Products: z.map(ProductIdSchema, ProductSchema),
    Agencies: z.map(AgencyIdSchema, AgencySchema),
    Assessors: z.map(AssessorIdSchema, AssessorSchema),
    Advisors: z.map(AdvisorIdSchema, AdvisorSchema),
    AtoMapping: z.map(ProductIdSchema, z.array(ATOSchema)),
    ReuseMapping: z.map(ProductIdSchema, z.array(ReuseATOSchema))
  })
});

/**
 * Transform validated input products to final products using Zod
 */
export function transformProducts(validatedInputProducts: z.infer<typeof ProductInputSchema>[]): {
  products: Product[];
  errors: string[];
} {
  const validatedProducts: Product[] = [];
  const errors: string[] = [];
  const invalidStatuses = ['Unknown', 'Delisted'];

  const validProducts = validatedInputProducts.filter((product) => {
    const status = product.status;
    if (!status || typeof status !== 'string') return false;
    const trimmedStatus = status.trim();
    return !invalidStatuses.includes(trimmedStatus);
  });

  validProducts.forEach((validatedInput, index: number) => {
    try {
      const transformedProduct = ProductSchema.parse(validatedInput);
      validatedProducts.push(transformedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Zod issues:', error.issues);
        const errorDetails = error.issues.map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
        errors.push(`Product transformation at index ${index}: ${errorDetails}`);
      } else {
        errors.push(`Product transformation at index ${index}: ${error}`);
      }
    }
  });

  return { products: validatedProducts, errors };
}

/**
 * Transform validated input agencies to final agencies using Zod
 */
export function transformAgencies(validatedInputAgencies: z.infer<typeof AgencyInputSchema>[]): {
  agencies: Agency[];
  errors: string[];
} {
  const validatedAgencies: Agency[] = [];
  const errors: string[] = [];

  validatedInputAgencies.forEach((validatedInput, index: number) => {
    try {
      const transformedAgency = AgencySchema.parse(validatedInput);
      validatedAgencies.push(transformedAgency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.issues.map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
        errors.push(`Agency transformation at index ${index}: ${errorDetails}`);
      } else {
        errors.push(`Agency transformation at index ${index}: ${error}`);
      }
    }
  });

  const processedAgencies = processAgencyWebsites(validatedAgencies);
  return { agencies: processedAgencies, errors };
}

/**
 * Transform validated input assessors to final assessors using Zod
 */
export function transformAssessors(validatedInputAssessors: z.infer<typeof AssessorInputSchema>[]): {
  assessors: Assessor[];
  errors: string[];
} {
  const validatedAssessors: Assessor[] = [];
  const errors: string[] = [];

  validatedInputAssessors.forEach((validatedInput, index: number) => {
    try {
      const transformedAssessor = AssessorSchema.parse(validatedInput);
      validatedAssessors.push(transformedAssessor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.issues.map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
        errors.push(`Assessor transformation at index ${index}: ${errorDetails}`);
      } else {
        errors.push(`Assessor transformation at index ${index}: ${error}`);
      }
    }
  });

  return { assessors: validatedAssessors, errors };
}

/**
 * Transform filters data to extract names from objects
 */
export function transformFilters(rawFilters: unknown): {
  filters: Filters;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const transformedFilters = FiltersTransformSchema.parse(rawFilters);
    return { filters: transformedFilters, errors };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.issues.map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      errors.push(`Filters transformation failed: ${errorDetails}`);
    } else {
      errors.push(`Filters transformation failed: ${error}`);
    }

    // Return default filters on error
    return {
      filters: {
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
        agency: { parent_agency: [], authorization: [], reuse: [], impact_level: [] },
        assessor: { product_assessing: [], impact_level: [], status: [] }
      },
      errors
    };
  }
}

/**
 * Create parent website mapping and inherit websites for sub-agencies
 */
export function processAgencyWebsites(agencies: Agency[]): Agency[] {
  const parentWebsiteMap = new Map<string, URL>();

  agencies.forEach((agency) => {
    if ((!agency.sub || agency.sub.trim() === '') && agency.website) {
      parentWebsiteMap.set(agency.parent.trim(), agency.website);
    }
  });

  return agencies.map((agency) => {
    if (agency.sub && agency.sub.trim() !== '' && !agency.website) {
      const parentWebsite = parentWebsiteMap.get(agency.parent.trim());
      if (parentWebsite) {
        return {
          ...agency,
          website: new URL(parentWebsite)
        };
      }
    }
    return agency;
  });
}

/**
 * Generate ticker logos from recent status change products
 */
export function generateTickerLogos(products: Product[], statusChangelog: FedRAMPMarketplaceStatusChangelog, days: number = 30): TickerLogo[] {
  const recentProductIds = getProductsWithLatestStatusChangeWithinDays(statusChangelog, days);
  const recentProducts = products.filter((product) => recentProductIds.includes(product.id));

  return recentProducts
    .filter((product): product is Product & { logo: URL } => product.logo !== null)
    .map((product, index) => ({
      id: product.id || `item-${index}`,
      logo: product.logo?.toString(),
      name: product.cso || `Product ${index + 1}`
    }));
}

/**
 * Get products with recent status changes within specified days
 */
function getProductsWithLatestStatusChangeWithinDays(statusChangelog: FedRAMPMarketplaceStatusChangelog, days: number = 30): ProductId[] {
  const recentProductIds: ProductId[] = [];
  const now = new Date();
  const thresholdDate = new Date(now);
  thresholdDate.setDate(now.getDate() - days);

  for (const [productId, product] of Object.entries(statusChangelog.products)) {
    if (product && product.statuses && product.statuses.length > 0) {
      let latestStartDate: Date | null = null;

      for (const status of product.statuses) {
        const currentStatusDate = new Date(status.start_date);
        if (!latestStartDate || currentStatusDate > latestStartDate) {
          latestStartDate = currentStatusDate;
        }
      }

      if (latestStartDate && latestStartDate >= thresholdDate) {
        recentProductIds.push(productId as ProductId);
      }
    }
  }

  return recentProductIds;
}
