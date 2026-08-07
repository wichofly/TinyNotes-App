import process from 'node:process';
import { URL } from 'node:url';

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000';

async function assertResponse(path, assertion) {
  const response = await globalThis.fetch(new URL(path, baseUrl));
  await assertion(response);
}

await assertResponse('/api/health', async (response) => {
  if (!response.ok) throw new Error(`Health check returned ${response.status}.`);
  const body = await response.json();
  if (body.status !== 'ok') throw new Error('Health check did not return { status: "ok" }.');
});

await assertResponse('/s/abcdefghijklmnopqrstuvwxyzABCDEF', async (response) => {
  if (!response.ok) throw new Error(`SPA fallback returned ${response.status}.`);
  if (!response.headers.get('content-type')?.includes('text/html')) {
    throw new Error('SPA fallback did not return HTML.');
  }
  if (response.headers.get('x-robots-tag') !== 'noindex, nofollow, noarchive') {
    throw new Error('Public SPA route is missing the expected X-Robots-Tag header.');
  }
});

process.stdout.write(`Production smoke checks passed for ${baseUrl}.\n`);
