import { describe, expect, it } from 'vitest';
import { redactSensitiveRequestUrl } from './request-log-redaction';

describe('redactSensitiveRequestUrl', () => {
  it('redacts public-note API bearer tokens while preserving the query string', () => {
    expect(redactSensitiveRequestUrl('/api/public/notes/sensitive-token?preview=true')).toBe(
      '/api/public/notes/[REDACTED]?preview=true',
    );
  });

  it('redacts public SPA bearer tokens', () => {
    expect(redactSensitiveRequestUrl('/s/sensitive-token')).toBe('/s/[REDACTED]');
    expect(redactSensitiveRequestUrl('/S/sensitive-token')).toBe('/s/[REDACTED]');
  });

  it('leaves non-sensitive request URLs unchanged', () => {
    expect(redactSensitiveRequestUrl('/api/notes?limit=10')).toBe('/api/notes?limit=10');
    expect(redactSensitiveRequestUrl(undefined)).toBeUndefined();
  });
});
