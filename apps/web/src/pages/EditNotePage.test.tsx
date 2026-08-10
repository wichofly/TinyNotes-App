import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { emptyRichTextDocument } from '@tinynotes/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { EditNotePage } from './EditNotePage';

vi.mock('../components/RichTextEditor', () => ({
  RichTextEditor: () => <div aria-label="Note body" />,
}));

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return {
    ...actual,
    api: {
      getNote: vi.fn(),
      updateNote: vi.fn(),
      enableSharing: vi.fn(),
      disableSharing: vi.fn(),
      deleteNote: vi.fn(),
    },
  };
});

const privateNote = {
  id: '92c31c44-3090-44e6-9a1c-cf95e73190e4',
  title: 'A private thought',
  content: emptyRichTextDocument,
  isPublic: false,
  shareUrl: null,
  createdAt: '2026-08-07T10:00:00.000Z',
  updatedAt: '2026-08-07T10:00:00.000Z',
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/notes/:noteId', element: <EditNotePage /> },
      { path: '/notes', element: <div>Notes list</div> },
    ],
    { initialEntries: [`/notes/${privateNote.id}`] },
  );
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, ...view };
}

describe('EditNotePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    vi.mocked(api.getNote).mockResolvedValue({ note: privateNote });
  });

  it('enables sharing only after the server returns a URL', async () => {
    const user = userEvent.setup();
    const shareUrl = 'http://127.0.0.1:5173/s/abcdefghijklmnopqrstuvwxyzABCDEF';
    vi.mocked(api.getNote)
      .mockResolvedValueOnce({ note: privateNote })
      .mockResolvedValue({ note: { ...privateNote, isPublic: true, shareUrl } });
    vi.mocked(api.enableSharing).mockResolvedValue({
      share: { isPublic: true, shareUrl },
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Enable public link' }));

    expect(api.enableSharing).toHaveBeenCalledWith(privateNote.id, expect.anything());
    expect(await screen.findByDisplayValue(shareUrl)).toBeInTheDocument();
  });

  it('reports clipboard failures and leaves the URL selectable', async () => {
    const user = userEvent.setup();
    const shareUrl = 'http://127.0.0.1:5173/s/abcdefghijklmnopqrstuvwxyzABCDEF';
    vi.mocked(api.getNote).mockResolvedValue({
      note: { ...privateNote, isPublic: true, shareUrl },
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Copy' }));

    expect(await screen.findByText(/Could not copy/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(shareUrl)).toHaveAttribute('readonly');
  });

  it('falls back when the Clipboard API is unavailable', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    const shareUrl = 'http://127.0.0.1:5173/s/abcdefghijklmnopqrstuvwxyzABCDEF';
    vi.mocked(api.getNote).mockResolvedValue({
      note: { ...privateNote, isPublic: true, shareUrl },
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Copy' }));

    expect(await screen.findByText(/Could not copy/)).toBeInTheDocument();
  });

  it('names the note in the destructive confirmation dialog', async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteButtons = await screen.findAllByRole('button', { name: 'Delete note' });
    await user.click(deleteButtons[0]!);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeVisible();
    expect(within(dialog).getByRole('heading', { name: /A private thought/ })).toBeInTheDocument();
    expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('falls back when dialog methods are unavailable', async () => {
    const user = userEvent.setup();
    const { showModal, close } = HTMLDialogElement.prototype;
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');

    try {
      renderPage();
      await user.click(await screen.findByRole('button', { name: 'Delete note' }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('open');
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      expect(dialog).not.toHaveAttribute('open');
    } finally {
      HTMLDialogElement.prototype.showModal = showModal;
      HTMLDialogElement.prototype.close = close;
    }
  });

  it('leaves without a second prompt after deleting a dirty note', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.mocked(api.deleteNote).mockResolvedValue(undefined);
    const { router } = renderPage();

    const title = await screen.findByLabelText('Note title');
    await user.type(title, ' changed');
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete note' });
    await user.click(deleteButtons[0]!);
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete note' }),
    );

    expect(await screen.findByText('Notes list')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/notes');
    expect(confirm).not.toHaveBeenCalled();
  });
});
