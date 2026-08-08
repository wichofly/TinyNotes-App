import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OwnedNote, UpdateNoteInput } from '@tinynotes/shared';
import { Copy, ExternalLink, Globe2, Link2Off, LoaderCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EditorForm } from '../components/EditorForm';
import { ErrorState } from '../components/ErrorState';
import { LoadingScreen } from '../components/LoadingScreen';
import { ApiError, api } from '../lib/api';

function timeOnly(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(value),
  );
}

export function EditNotePage() {
  const { noteId = '' } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const queryKey = ['notes', noteId] as const;
  const noteQuery = useQuery({ queryKey, queryFn: () => api.getNote(noteId) });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateNoteInput) => api.updateNote(noteId, input),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
  const shareMutation = useMutation({
    mutationFn: api.enableSharing,
    onSuccess: ({ share }) => updateCachedShare(true, share.shareUrl),
  });
  const unshareMutation = useMutation({
    mutationFn: api.disableSharing,
    onSuccess: () => updateCachedShare(false, null),
  });
  const deleteMutation = useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
      navigate('/notes', { replace: true });
    },
  });

  function updateCachedShare(isPublic: boolean, shareUrl: string | null) {
    queryClient.setQueryData<{ note: OwnedNote }>(queryKey, (current) =>
      current ? { note: { ...current.note, isPublic, shareUrl } } : current,
    );
    void queryClient.invalidateQueries({ queryKey: ['notes'] });
  }

  async function copyLink(url: string) {
    setCopyStatus('');
    const clipboard = navigator.clipboard;
    if (!window.isSecureContext || typeof clipboard?.writeText !== 'function') {
      setCopyStatus('Could not copy. Select and copy the URL instead.');
      return;
    }
    try {
      await clipboard.writeText(url);
      setCopyStatus('Link copied');
    } catch {
      setCopyStatus('Could not copy. Select and copy the URL instead.');
    }
  }

  if (noteQuery.isPending) return <LoadingScreen label="Opening your note…" />;
  if (noteQuery.isError) {
    const missing = noteQuery.error instanceof ApiError && noteQuery.error.status === 404;
    return (
      <main className="mx-auto max-w-6xl px-5 py-20">
        <ErrorState
          title={missing ? 'Note not found' : undefined}
          message={
            missing ? 'This note does not exist, or it belongs to another account.' : undefined
          }
          onRetry={missing ? undefined : () => void noteQuery.refetch()}
        />
      </main>
    );
  }

  const note = noteQuery.data.note;
  const shareUrl = note.isPublic ? note.shareUrl : null;
  const shareBusy = shareMutation.isPending || unshareMutation.isPending;
  const mutationError =
    updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : updateMutation.isError
        ? 'Your changes could not be saved. They are still here—try again.'
        : undefined;

  const sidebar = (
    <>
      <section
        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
        aria-labelledby="sharing-heading"
      >
        <div className="flex items-center gap-2">
          <Globe2 className="size-4 text-amber-700" />
          <h2 id="sharing-heading" className="font-semibold">
            Public link
          </h2>
        </div>
        {shareUrl ? (
          <div className="mt-4">
            <label htmlFor="share-url" className="sr-only">
              Public share URL
            </label>
            <input
              id="share-url"
              value={shareUrl}
              readOnly
              className="input py-2 text-xs"
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn-secondary px-3"
                onClick={() => void copyLink(shareUrl)}
              >
                <Copy className="size-3.5" /> Copy
              </button>
              <a href={shareUrl} target="_blank" rel="noreferrer" className="btn-secondary px-3">
                Open <ExternalLink className="size-3.5" />
              </a>
            </div>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 focus-ring"
              disabled={shareBusy}
              onClick={() => unshareMutation.mutate(noteId)}
            >
              {shareBusy ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Link2Off className="size-3.5" />
              )}{' '}
              Disable public link
            </button>
            <p className="mt-3 text-xs leading-5 text-stone-500">
              Anyone with this link can read the note. Disabling it invalidates the URL immediately.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-xs leading-5 text-stone-500">
              This note is private. Enable a hard-to-guess link to share it without requiring an
              account.
            </p>
            <button
              type="button"
              className="btn-secondary mt-4 w-full"
              disabled={shareBusy}
              onClick={() => shareMutation.mutate(noteId)}
            >
              {shareBusy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Globe2 className="size-4" />
              )}{' '}
              Enable public link
            </button>
          </div>
        )}
        <p
          className={`mt-3 text-xs ${copyStatus.startsWith('Could') ? 'text-red-700' : 'text-emerald-700'}`}
          aria-live="polite"
        >
          {copyStatus}
        </p>
        {shareMutation.isError || unshareMutation.isError ? (
          <p className="mt-3 text-xs text-red-700" role="alert">
            Sharing could not be changed. Try again.
          </p>
        ) : null}
      </section>
      <section className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
        <h2 className="font-semibold text-red-900">Danger zone</h2>
        <p className="mt-2 text-xs leading-5 text-red-800/70">
          Deleting a note cannot be undone and immediately revokes its public link.
        </p>
        <button
          type="button"
          className="btn-danger mt-4 w-full"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" /> Delete note
        </button>
      </section>
    </>
  );

  return (
    <>
      <EditorForm
        key={note.updatedAt}
        initialTitle={note.title}
        initialContent={note.content}
        saving={updateMutation.isPending}
        savedAt={timeOnly(note.updatedAt)}
        error={mutationError}
        sidebar={sidebar}
        onSave={async (value) => {
          await updateMutation.mutateAsync(value);
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title={`Delete “${note.title}”?`}
        description="This note and any active public link will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete note"
        busy={deleteMutation.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(noteId)}
      />
    </>
  );
}
