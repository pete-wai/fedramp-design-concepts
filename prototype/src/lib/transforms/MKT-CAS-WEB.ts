/* lib/transforms/MKT-CAS-WEB.ts
 *
 * Maps the machine-readable FedRAMP Advisor Information export (MKT-CAS-WEB —
 * Marketplace Consulting and Advisory Services Website) into the marketplace
 * `Advisor` shape.
 *
 * This is the SOLE source of marketplace advisors. Unlike products (which merge
 * a legacy CSV pipeline with the new FRC-CSO-PKG source), there is no legacy
 * advisor pipeline to consolidate with — advisor records come only from this
 * structured, publicly-published document. Every record maps to the marketplace
 * `Advisor` type so downstream Svelte components (AdvisorSearch.svelte, the
 * advisors/[frid] detail page) consume a single stable shape. The validate ->
 * transform -> per-record-error approach mirrors the product-side FRC-CSO-PKG
 * flow in transforms/FRC-CSO-PKG.ts (see docs/decisions/0003 and the advisor ADR).
 *
 * The vendor MKT-CAS-WEB export carries the advisory service's self-published
 * fields PLUS the FedRAMP-program-appended `fedramp_listing_timestamp` (the
 * date the program listed the advisor). That timestamp is mapped to
 * `Advisor.fedramp_listing_date`. The remaining rich `Advisor` fields
 * (`website`, `accredited_since`, `clients`) have no current MKT-CAS-WEB source
 * and are given safe empty/null defaults; the detail page's existing sections
 * bind to them and simply render empty until a future contract adds them.
 *
 * Source schema (the contract this transform trusts):
 *   src/lib/data/consolidated-ruleset-schemas/fedramp-advisor-information-schema-2026-06-24.json
 * Validated (zero-trust) by `MktCasWebInputSchema` in schemas/marketplace.ts
 * BEFORE this transform runs — a bad record is collected as an error, never
 * silently mapped.
 *
 * Field mapping (MKT-CAS-WEB -> Advisor):
 *   advisorName                  -> id               (dash-slug; see resolveAdvisorId)
 *   advisorName                  -> name
 *   logo                         -> logo             (validated image URI -> URL)
 *   a2laId                       -> a2la_id          (null when absent/blank)
 *   serviceDescription           -> desc
 *   fedramp_listing_timestamp    -> fedramp_listing_date
 *   servicesOffered[]            -> services         (joined into the display string the
 *                                                     detail page's "Consulting Services"
 *                                                     section already renders)
 *   contactInformation[]         -> poc / email / address  (first email-looking entry ->
 *                                                     email; the remainder -> poc/address)
 *
 * Fields with NO MKT-CAS-WEB source (website, accredited_since, clients) are
 * given safe defaults matching an advisor with no assessed clients (empty
 * clients, null dates/website). `a2laId` maps to `a2la_id` (shown on the detail
 * page when present); `customerReferences` is captured but not yet surfaced by
 * the current advisor UI and is folded into an existing field rather than dropped.
 */
import { z } from 'zod';
import { MktCasWebInputSchema, URLSchema, EmailSchema } from '../schemas/marketplace';
import type { Advisor } from '../types/marketplace';
import type { EmailAddress } from '../types/emailAddress';

type MktCasWebInput = z.infer<typeof MktCasWebInputSchema>;

/** Loose test for an email-shaped contact string. */
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolve the marketplace id for an MKT-CAS-WEB advisor record.
 *
 * For now the id is derived directly from `advisorName`: lowercased, with every
 * run of non-alphanumeric characters collapsed to a single dash (a URL-safe
 * slug), since the id is used as the detail-route URL slug
 * (`/marketplace/advisors/{id}`). This ignores `ZD_frid_retro` deliberately —
 * advisors have no canonical FedRAMP id yet, and a readable name-based slug is
 * preferred for the URL. If a canonical id is later required, reintroduce the
 * `ZD_frid_retro` precedence here.
 */
export function resolveAdvisorId(advisorName: string): string {
  const slug = advisorName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'advisor-unknown';
}

/**
 * Split the MKT-CAS-WEB `contactInformation` string array into the advisor
 * fields the UI renders. The contract only guarantees an array of strings, so
 * we heuristically pick the first email-looking entry as `email` and preserve
 * every entry (email included) as the human-readable `poc` text. This is
 * intentionally lossless-into-poc so no contact detail is dropped.
 */
function splitContactInformation(contacts: string[]): {
  email: EmailAddress;
  poc: string;
} {
  const emailEntry = contacts.find((c) => EMAIL_LIKE.test(c.trim()));
  // The Advisor type carries a non-nullable email (its standalone schema,
  // schemas/marketplace.ts::AdvisorSchema). Empty string when no email-shaped
  // contact was supplied, mirroring the legacy `String(... || '')` defaults.
  const email = (emailEntry ? (EmailSchema.parse(emailEntry.trim()) ?? '') : '') as EmailAddress;
  return {
    email,
    // Preserve all contact lines for display; the detail page's AdvisorCards
    // renders poc + email.
    poc: contacts.join('\n')
  };
}

/**
 * Render the typed `servicesOffered` list into the single display string the
 * current advisor detail page expects for its "Consulting Services" section.
 * Each offering becomes "Name — Description" (description omitted when absent).
 */
function renderServicesOffered(offerings: MktCasWebInput['servicesOffered']): string {
  return offerings
    .map((o) => (o.serviceDescription?.trim() ? `${o.serviceName.trim()} — ${o.serviceDescription.trim()}` : o.serviceName.trim()))
    .join('\n');
}

/**
 * Transform a single validated MKT-CAS-WEB vendor document into a marketplace
 * `Advisor`. The input MUST already be parsed by `MktCasWebInputSchema`.
 *
 * The vendor record supplies name/logo/a2laId/description/contact/services plus
 * the FedRAMP-program-appended `fedramp_listing_timestamp` (mapped to
 * `fedramp_listing_date`). Fields with no MKT-CAS-WEB source (`website`,
 * `accredited_since`, `clients`) get safe empty/null defaults. See
 * docs/decisions/0007.
 */
export function mktCasWebToAdvisor(record: MktCasWebInput): Advisor {
  const { email, poc } = splitContactInformation(record.contactInformation);

  const advisor: Advisor = {
    id: resolveAdvisorId(record.advisorName),
    name: record.advisorName.trim(),
    // MktCasWebInputSchema already validated the image-URI pattern; URLSchema
    // turns the validated string into the URL instance the UI renders.
    logo: URLSchema.parse(record.logo),
    // FedRAMP-program-appended listing timestamp (already coerced to a Date
    // by MktCasWebInputSchema).
    fedramp_listing_date: record.fedramp_listing_timestamp,
    // a2laId is present only when the advisor is also A2LA-accredited; normalize
    // an empty/whitespace value to null so the UI can show it only when real.
    a2la_id: record.a2laId?.trim() ? record.a2laId.trim() : null,
    // No current MKT-CAS-WEB source — safe defaults; UI sections render empty.
    accredited_since: null,
    poc,
    email,
    website: null,
    desc: record.serviceDescription.trim(),
    // customerReferences is optional in the contract and not yet surfaced by the
    // UI; fold it into the existing display string so it is not dropped.
    customer_references: (record.customerReferences ?? []).join('\n'),
    services: renderServicesOffered(record.servicesOffered) || null,
    clients: []
  };

  return advisor;
}

/**
 * Parse + transform an array of raw vendor MKT-CAS-WEB documents into
 * marketplace advisors, collecting per-record errors instead of throwing so a
 * single bad document does not fail the whole build (mirrors
 * transformOverviewProducts). Each raw record is validated against the public
 * vendor contract (`MktCasWebInputSchema`), which now includes the
 * program-appended required `fedramp_listing_timestamp`.
 */
export function transformMktCasWebAdvisors(rawRecords: unknown[]): {
  advisors: Advisor[];
  errors: string[];
} {
  const advisors: Advisor[] = [];
  const errors: string[] = [];

  rawRecords.forEach((raw, index) => {
    try {
      const parsed = MktCasWebInputSchema.parse(raw);
      advisors.push(mktCasWebToAdvisor(parsed));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const detail = error.issues.map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
        errors.push(`MKT-CAS-WEB advisor transformation at index ${index}: ${detail}`);
      } else {
        errors.push(`MKT-CAS-WEB advisor transformation at index ${index}: ${error}`);
      }
    }
  });

  return { advisors, errors };
}
