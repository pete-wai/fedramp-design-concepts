/* lib/transforms/relationships.ts */
import { z } from 'zod';
import { stringToDate } from '../utils/dateUtils';
import { ATOInputSchema, ReuseATOInputSchema } from '../schemas/marketplace';
import type { ATO, ReuseATO, ProductId, AgencyId } from '../types/marketplace';

// Transform schemas
export const ATOSchema = ATOInputSchema.transform((rawAto) => {
  return {
    id: String(rawAto.id).trim() as ProductId,
    agency_id: String(rawAto.agency_id).trim() as AgencyId,
    parent: String(rawAto.parent || '').trim(),
    sub: rawAto.sub && String(rawAto.sub).trim() !== '' ? String(rawAto.sub).trim() : null,
    ato_date: stringToDate(rawAto.ato_date) || new Date(0),
    auth_date: stringToDate(rawAto.auth_date) || null,
    exp_date: stringToDate(rawAto.exp_date) || null,
    assessment_date: stringToDate(rawAto.assessment_date) || null
  };
});

export const ReuseATOSchema = ReuseATOInputSchema.transform((rawAto) => {
  return {
    id: String(rawAto.id).trim() as ProductId,
    agency_id: String(rawAto.agency_id).trim() as AgencyId,
    parent: String(rawAto.parent || '').trim(),
    sub: rawAto.sub && String(rawAto.sub).trim() !== '' ? String(rawAto.sub).trim() : null,
    ato_date: stringToDate(rawAto.ato_date) || new Date(0),
    auth_date: stringToDate(rawAto.auth_date) || null,
    exp_date: stringToDate(rawAto.exp_date) || null,
    sub_id: rawAto.sub_id && String(rawAto.sub_id).trim() !== '' ? String(rawAto.sub_id).trim() : null
  };
});

/**
 * Transform validated input ATOs to final ATOs
 */
export function transformATOs(validatedInputATOs: z.infer<typeof ATOInputSchema>[]): {
  atos: ATO[];
  errors: string[];
} {
  const validatedATOs: ATO[] = [];
  const errors: string[] = [];

  validatedInputATOs.forEach((validatedInput, index: number) => {
    try {
      const transformedATO = ATOSchema.parse(validatedInput);
      validatedATOs.push(transformedATO);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.issues.map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
        errors.push(`ATO transformation at index ${index}: ${errorDetails}`);
      } else {
        errors.push(`ATO transformation at index ${index}: ${error}`);
      }
    }
  });

  return { atos: validatedATOs, errors };
}

/**
 * Transform validated input ReuseATOs to final ReuseATOs
 */
export function transformReuseATOs(validatedInputReuseATOs: z.infer<typeof ReuseATOInputSchema>[]): {
  reuseATOs: ReuseATO[];
  errors: string[];
} {
  const validatedReuseATOs: ReuseATO[] = [];
  const errors: string[] = [];

  validatedInputReuseATOs.forEach((validatedInput, index: number) => {
    try {
      const transformedReuseATO = ReuseATOSchema.parse(validatedInput);
      validatedReuseATOs.push(transformedReuseATO);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.issues.map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
        errors.push(`ReuseATO transformation at index ${index}: ${errorDetails}`);
      } else {
        errors.push(`ReuseATO transformation at index ${index}: ${error}`);
      }
    }
  });

  return { reuseATOs: validatedReuseATOs, errors };
}
