import { describe, it, expect, vi } from 'vitest';
import {
  WhiteLabelConfigSchema,
  FINSA_AI_DEFAULTS,
  resolveWhiteLabel,
  validateLogoUrl,
} from './whiteLabelConfig';

describe('WhiteLabelConfigSchema', () => {
  it('should accept a valid full config', () => {
    const config = {
      brand_name: 'SBI',
      primary_color: '#1F4E79',
      secondary_color: '#F5A623',
      logo_url: 'https://sbi.co.in/logo.png',
      product_catalog_overrides: [
        { product_name: 'SBI Home Loan', enabled: true },
      ],
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should accept config without product_catalog_overrides (optional)', () => {
    const config = {
      brand_name: 'Partner Bank',
      primary_color: '#AABBCC',
      secondary_color: '#112233',
      logo_url: 'https://partner.bank/logo.png',
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject brand_name longer than 120 characters', () => {
    const config = {
      brand_name: 'A'.repeat(121),
      primary_color: '#AABBCC',
      secondary_color: '#112233',
      logo_url: 'https://example.com/logo.png',
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject empty brand_name', () => {
    const config = {
      brand_name: '',
      primary_color: '#AABBCC',
      secondary_color: '#112233',
      logo_url: 'https://example.com/logo.png',
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject invalid hex color (missing #)', () => {
    const config = {
      brand_name: 'Test',
      primary_color: 'AABBCC',
      secondary_color: '#112233',
      logo_url: 'https://example.com/logo.png',
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject invalid hex color (3-digit shorthand)', () => {
    const config = {
      brand_name: 'Test',
      primary_color: '#ABC',
      secondary_color: '#112233',
      logo_url: 'https://example.com/logo.png',
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject non-HTTPS logo_url', () => {
    const config = {
      brand_name: 'Test',
      primary_color: '#AABBCC',
      secondary_color: '#112233',
      logo_url: 'http://example.com/logo.png',
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject logo_url longer than 2048 characters', () => {
    const config = {
      brand_name: 'Test',
      primary_color: '#AABBCC',
      secondary_color: '#112233',
      logo_url: 'https://example.com/' + 'a'.repeat(2030),
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject product_catalog_overrides with more than 20 entries', () => {
    const overrides = Array.from({ length: 21 }, (_, i) => ({
      product_name: `Product ${i}`,
      enabled: true,
    }));
    const config = {
      brand_name: 'Test',
      primary_color: '#AABBCC',
      secondary_color: '#112233',
      logo_url: 'https://example.com/logo.png',
      product_catalog_overrides: overrides,
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should accept product_catalog_overrides with exactly 20 entries', () => {
    const overrides = Array.from({ length: 20 }, (_, i) => ({
      product_name: `Product ${i}`,
      enabled: i % 2 === 0,
    }));
    const config = {
      brand_name: 'Test',
      primary_color: '#AABBCC',
      secondary_color: '#112233',
      logo_url: 'https://example.com/logo.png',
      product_catalog_overrides: overrides,
    };
    const result = WhiteLabelConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});

describe('resolveWhiteLabel', () => {
  it('should return defaults when no config is provided', () => {
    const result = resolveWhiteLabel();
    expect(result).toEqual(FINSA_AI_DEFAULTS);
  });

  it('should return defaults when undefined is provided', () => {
    const result = resolveWhiteLabel(undefined);
    expect(result).toEqual(FINSA_AI_DEFAULTS);
  });

  it('should merge partial config with defaults', () => {
    const result = resolveWhiteLabel({ brand_name: 'SBI' });
    expect(result.brand_name).toBe('SBI');
    expect(result.primary_color).toBe(FINSA_AI_DEFAULTS.primary_color);
    expect(result.secondary_color).toBe(FINSA_AI_DEFAULTS.secondary_color);
    expect(result.logo_url).toBe(FINSA_AI_DEFAULTS.logo_url);
    expect(result.product_catalog_overrides).toEqual(FINSA_AI_DEFAULTS.product_catalog_overrides);
  });

  it('should use all provided fields when full config is given', () => {
    const config = {
      brand_name: 'Partner',
      primary_color: '#FF0000',
      secondary_color: '#00FF00',
      logo_url: 'https://partner.com/logo.png',
      product_catalog_overrides: [{ product_name: 'Loan', enabled: true }],
    };
    const result = resolveWhiteLabel(config);
    expect(result).toEqual(config);
  });

  it('should handle empty object (all defaults)', () => {
    const result = resolveWhiteLabel({});
    expect(result).toEqual(FINSA_AI_DEFAULTS);
  });

  it('should not mutate the defaults object', () => {
    const defaultsCopy = { ...FINSA_AI_DEFAULTS };
    resolveWhiteLabel({ brand_name: 'Modified' });
    expect(FINSA_AI_DEFAULTS).toEqual(defaultsCopy);
  });
});

describe('validateLogoUrl', () => {
  it('should return valid:false for unreachable URL', async () => {
    const result = await validateLogoUrl('https://this-domain-does-not-exist-xyz123.com/logo.png');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
