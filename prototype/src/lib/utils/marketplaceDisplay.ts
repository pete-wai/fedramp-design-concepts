/**
 * Display transformation utilities for marketplace data
 * Converts internal data representations to user-facing display text
 * without modifying the underlying data structures
 */

import type { ProductCertStatus, ImpactLevel, ProductCertType, ProductCertClass } from '$lib/types/marketplace';

/**
 * Transforms a product certification status for display purposes.
 * Maps internal status values to their display equivalents.
 *
 * @param status The internal product certification status
 * @returns The display text for the status
 */
export function displayCertStatus(status: ProductCertStatus): string {
  switch (status) {
    case 'Agency Authorization In Process':
      return 'Agency Auth In Process'; // Shorthand so that it fits in components
    default:
      return status;
  }
}

/**
 * Whether a status still represents a FedRAMP Certified offering. Both plain
 * "FedRAMP Certified" and "FedRAMP Certified (In Remediation)" are certified —
 * the latter is simply operating under a Corrective Action Plan.
 */
export function isCertifiedStatus(status: ProductCertStatus): boolean {
  return status === 'FedRAMP Certified' || status === 'FedRAMP Certified (In Remediation)';
}

/**
 * Transforms a product certification type for display purposes. The data model
 * differentiates the pilot programs ('20x Pilot', 'Rev5 Pilot') from their
 * non-pilot counterparts, but the Marketplace surfaces both under the base type:
 * '20x Pilot' displays as '20x' and 'Rev5 Pilot' displays as 'Rev5'. The
 * underlying stored value is left unchanged so the pilot distinction is
 * preserved in the data (and in the products.json export).
 *
 * @param certType The internal product certification type
 * @returns The display text for the certification type
 */
export function displayCertType(certType: ProductCertType): string {
  switch (certType) {
    case '20x Pilot':
      return '20x';
    case 'Rev5 Pilot':
      return 'Rev5';
    default:
      return certType;
  }
}

/**
 * Whether a certification type is a 20x type (pilot or non-pilot). Useful for
 * consumers that branch on the base type but must treat the pilot variant
 * identically (e.g. the 20x package-request flow, 20x counts).
 */
export function is20xCertType(certType: ProductCertType): boolean {
  return certType === '20x' || certType === '20x Pilot';
}

/**
 * Transforms an impact level to its class designation for display purposes.
 * Maps raw impact levels (LI-SaaS, Low, Moderate, High) to their class equivalents.
 *
 * @param level The internal impact level
 * @returns The display text for the impact level class
 */
export function displayImpactLevel(level: ImpactLevel): string {
  switch (level) {
    case 'LI-SaaS':
      return 'Class B (Low)';
    case 'Low':
      return 'Class B (Low)';
    case 'Moderate':
      return 'Class C (Moderate)';
    case 'High':
      return 'Class D (High)';
    case '20x Low':
      return 'Class B (Low)';
    case '20x Moderate':
      return 'Class C (Moderate)';
    case '20x High':
      return 'Class D (High)';
    case 'Unknown':
    default:
      return level;
  }
}

/**
 * Transforms a certification class into its display label, appending the
 * legacy impact-level equivalent in parentheses (e.g. 'Class B' -> 'Class B
 * (Low)'). Mirrors the labels hardcoded in the Class filter dropdowns
 * (ProductSearch, AgencySearch, AssessorSearch, AdvisorSearch) so the
 * Certification Profile "Class" value on the product detail page stays
 * consistent with every other Class surface in the Marketplace.
 *
 * @param certClass The internal certification class
 * @returns The display text for the certification class
 */
export function displayCertClass(certClass: ProductCertClass): string {
  switch (certClass) {
    case 'Class A':
      return 'Class A (Pilot)';
    case 'Class B':
      return 'Class B (Low)';
    case 'Class C':
      return 'Class C (Moderate)';
    case 'Class D':
      return 'Class D (High)';
    case 'Unknown':
    default:
      return certClass;
  }
}

/**
 * Gets all impact levels that map to a given class.
 * Used for filtering when filtering by class instead of individual impact level.
 *
 * @param impactClass The class designation (e.g., 'Class B')
 * @returns Array of impact levels that map to this class
 */
export function getImpactLevelsForClass(impactClass: string): ImpactLevel[] {
  switch (impactClass) {
    // No impact level maps to Class A (Pilot) yet, and an 'Unknown' impact level
    // is NOT Class A — it is simply unclassified. Returning [] here means Class A
    // shows a real 0 count and unclassified offerings (e.g. the new FRC-CSO-PKG
    // Initial Implementation listings whose impact_level is 'Unknown') do not
    // erroneously match Class A. They match no Cert Class filter until they are
    // assigned a real impact level.
    case 'Class A':
      return [];
    case 'Class B':
      return ['LI-SaaS', 'Low', '20x Low'];
    case 'Class C':
      return ['Moderate', '20x Moderate'];
    case 'Class D':
      return ['High', '20x High'];
    default:
      return [];
  }
}
