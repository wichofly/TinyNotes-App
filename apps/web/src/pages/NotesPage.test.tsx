import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { NotesPage } from './NotesPage';

vi.mock('../lib/api', () => ({
  api: { listNotes: vi.fn() },
}));

describe('NotesPage', () => {
  beforeEach(() => vi.mocked(api.listNotes).mockResolvedValue({ notes: [] }));

  it('shows the empty state and a create action', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <NotesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('You do not have any notes yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create your first note/i })).toHaveAttribute(
      'href',
      '/notes/new',
    );
  });
});
