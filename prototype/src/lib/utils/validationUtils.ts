/* lib/utils/validationUtils.ts */
import { LegacyImpactLevelSchema } from '../schemas/marketplace';
import type { z } from 'zod';

/**
 * Map legacy impact level names to current standard
 */
export function mapImpactLevel(rawLevel: z.infer<typeof LegacyImpactLevelSchema>): z.infer<typeof LegacyImpactLevelSchema> {
  if (rawLevel === '20x Low') return 'Low';
  if (rawLevel === '20x Moderate') return 'Moderate';
  if (rawLevel === '20x High') return 'High';
  return rawLevel;
}
