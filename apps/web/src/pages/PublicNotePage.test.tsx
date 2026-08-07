import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '../lib/api';
import { PublicNotePage } from './PublicNotePage';

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
});
