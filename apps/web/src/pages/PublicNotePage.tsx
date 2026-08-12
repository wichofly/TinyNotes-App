import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Brand } from '../components/Brand';
import { ErrorState } from '../components/ErrorState';
import { LoadingScreen } from '../components/LoadingScreen';
import { ReadOnlyContent } from '../components/RichTextEditor';
import { ApiError, api } from '../lib/api';

function PublicNoteMetadata() {
  return <meta name="robots" content="noindex, nofollow, noarchive" />;
}

export function PublicNotePage() {
  const { shareToken = '' } = useParams();
  const query = useQuery({
    queryKey: ['public-note', shareToken],
    queryFn: () => api.getPublicNote(shareToken),
  });

  if (query.isPending)
    return (
      <>
        <PublicNoteMetadata />
        <LoadingScreen label="Opening shared note…" />
      </>
    );
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <>
        <PublicNoteMetadata />
        <main className="grid min-h-dvh place-items-center bg-paper px-5">
          <div className="w-full max-w-lg">
            <ErrorState
              title={missing ? 'Note not found' : undefined}
              message={missing ? 'This public link is invalid or has been disabled.' : undefined}
              onRetry={missing ? undefined : () => void query.refetch()}
            />
            <p className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm font-semibold underline decoration-amber-400 decoration-2 underline-offset-4"
              >
                Go to TinyNotes
              </Link>
            </p>
          </div>
        </main>
      </>
    );
  }

  const note = query.data.note;
  return (
    <>
      <PublicNoteMetadata />
      <div className="min-h-dvh bg-paper">
        <header className="border-b border-stone-200/80">
          <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-5 sm:px-8">
            <Brand />
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
              Shared note
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
          <article>
            <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
              {note.title}
            </h1>
            <p className="mt-5 flex items-center gap-2 text-xs text-stone-400">
              <CalendarDays className="size-3.5" /> Updated{' '}
              {new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
                new Date(note.updatedAt),
              )}
            </p>
            <div className="mt-10 border-t border-stone-200 pt-10">
              <ReadOnlyContent content={note.content} />
            </div>
          </article>
        </main>
        <footer className="mx-auto max-w-3xl border-t border-stone-200 px-5 py-8 text-xs text-stone-400 sm:px-8">
          Published with TinyNotes
        </footer>
      </div>
    </>
  );
}
