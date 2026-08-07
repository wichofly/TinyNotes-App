import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findRepositoryEnv } from './env-path.js';

describe('findRepositoryEnv', () => {
  it('finds the repository environment file from a workspace directory', () => {
    const repository = resolve('example-repository');
    const workspace = join(repository, 'apps', 'api');
    const marker = join(repository, '.env.example');

    expect(findRepositoryEnv(workspace, (path) => path === marker)).toBe(join(repository, '.env'));
  });

  it('returns undefined when no repository marker exists', () => {
    const root = dirname(resolve('.'));

    expect(findRepositoryEnv(root, () => false)).toBeUndefined();
  });
});
