import { describe, it, expect } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  it('should be a winston logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });
});
