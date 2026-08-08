import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { emptyRichTextDocument } from '@tinynotes/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../lib/api';
import { PublicNotePage } from './PublicNotePage';

vi.mock('../components/RichTextEditor', () => ({
  ReadOnlyContent: () => <div aria-label="Note content" />,
}));

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return { ...actual, api: { ...actual.api, getPublicNote: vi.fn() } };
});

describe('PublicNotePage', () => {
  it('uses the same generic not-found state for a revoked link', async () => {
    vi.mocked(api.getPublicNote).mockRejectedValue(
      new ApiError(404, 'NOT_FOUND', 'The requested note was not found.'),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/s/abcdefghijklmnopqrstuvwxyzABCDEF']}>
          <Routes>
            <Route path="/s/:shareToken" element={<PublicNotePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Note not found' })).toBeInTheDocument();
    expect(
      screen.getByText('This public link is invalid or has been disabled.'),
    ).toBeInTheDocument();
  });

  it('declaratively marks the route as non-indexable', async () => {
    vi.mocked(api.getPublicNote).mockResolvedValue({
      note: {
        title: 'Shared thought',
        content: emptyRichTextDocument,
        publishedAt: '2026-08-07T10:00:00.000Z',
        updatedAt: '2026-08-07T10:00:00.000Z',
      },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/s/abcdefghijklmnopqrstuvwxyzABCDEF']}>
          <Routes>
            <Route path="/s/:shareToken" element={<PublicNotePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Shared thought' })).toBeInTheDocument();
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow, noarchive',
    );

    view.unmount();
    expect(document.head.querySelector('meta[name="robots"]')).not.toBeInTheDocument();
  });
});
