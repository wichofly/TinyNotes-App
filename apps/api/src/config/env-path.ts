import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

type FileExists = (path: string) => boolean;

export function findRepositoryEnv(
  startDirectory: string,
  fileExists: FileExists = existsSync,
): string | undefined {
  let directory = resolve(startDirectory);

  while (true) {
    if (fileExists(join(directory, '.env.example'))) {
      return join(directory, '.env');
    }

    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}
