const sensitivePathPatterns = [
  {
    pattern: /^\/api\/public\/notes\/[^/?#]+/i,
    replacement: '/api/public/notes/[REDACTED]',
  },
  {
    pattern: /^\/s\/[^/?#]+/i,
    replacement: '/s/[REDACTED]',
  },
];

export function redactSensitiveRequestUrl(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;

  for (const { pattern, replacement } of sensitivePathPatterns) {
    if (pattern.test(url)) return url.replace(pattern, replacement);
  }

  return url;
}
