import { z } from 'zod';
import axios from 'axios';
import { logger } from './logger';

/**
 * Zod schema for White-Label Configuration.
 * Validates brand customization fields for partner banks.
 *
 * - brand_name: 1–120 characters
 * - primary_color: CSS hex color (#RRGGBB)
 * - secondary_color: CSS hex color (#RRGGBB)
 * - logo_url: HTTPS URL, max 2048 characters
 * - product_catalog_overrides: optional array of up to 20 product override entries
 */
export const WhiteLabelConfigSchema = z.object({
  brand_name: z.string().min(1).max(120),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logo_url: z.string().url().max(2048).startsWith('https://'),
  product_catalog_overrides: z.array(z.object({
    product_name: z.string(),
    enabled: z.boolean(),
  })).max(20).optional(),
});

export type WhiteLabelConfig = z.infer<typeof WhiteLabelConfigSchema>;

/**
 * Default Finsa AI branding configuration.
 * Used as fallback for any missing fields in a partial white-label config.
 */
export const FINSA_AI_DEFAULTS: WhiteLabelConfig = {
  brand_name: 'Finsa AI',
  primary_color: '#1A73E8',
  secondary_color: '#34A853',
  logo_url: 'https://finsa.ai/logo.png',
  product_catalog_overrides: [],
};

/**
 * Resolves a white-label configuration by merging provided partial fields
 * with Finsa AI defaults. Any field not provided falls back to the default.
 *
 * @param config - Optional partial white-label configuration
 * @returns A complete WhiteLabelConfig with all fields populated
 */
export function resolveWhiteLabel(config?: Partial<WhiteLabelConfig>): WhiteLabelConfig {
  if (!config) {
    return { ...FINSA_AI_DEFAULTS };
  }

  return {
    brand_name: config.brand_name ?? FINSA_AI_DEFAULTS.brand_name,
    primary_color: config.primary_color ?? FINSA_AI_DEFAULTS.primary_color,
    secondary_color: config.secondary_color ?? FINSA_AI_DEFAULTS.secondary_color,
    logo_url: config.logo_url ?? FINSA_AI_DEFAULTS.logo_url,
    product_catalog_overrides: config.product_catalog_overrides ?? FINSA_AI_DEFAULTS.product_catalog_overrides,
  };
}

/**
 * Validates that a logo URL is reachable via HTTP HEAD request.
 * Used at session creation time to reject configurations with unreachable logos.
 *
 * @param logoUrl - The HTTPS URL to validate
 * @returns An object indicating success or failure with an error message
 */
export async function validateLogoUrl(logoUrl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await axios.head(logoUrl, {
      timeout: 5000,
      maxRedirects: 3,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    return { valid: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Logo URL validation failed', { logoUrl, error: message });

    return {
      valid: false,
      error: `Logo URL is unreachable: ${logoUrl} — ${message}`,
    };
  }
}
