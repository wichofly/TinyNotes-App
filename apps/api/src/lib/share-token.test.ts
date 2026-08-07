import { describe, expect, it } from 'vitest';
import { createShareToken } from './share-token';

describe('createShareToken', () => {
  it('creates opaque 24-byte base64url tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, createShareToken));
    expect(tokens.size).toBe(100);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });
});
