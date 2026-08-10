import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileText, Globe2, Lock, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { ErrorState } from '../components/ErrorState';
import { api } from '../lib/api';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function NotesPage() {
  const query = useQuery({ queryKey: ['notes'], queryFn: api.listNotes });

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-10 flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Your notebook</p>
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">All notes</h1>
        </div>
        <Link to="/notes/new" className="btn-primary">
          <Plus className="size-4" /> New note
        </Link>
      </div>
      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading notes">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-3xl bg-stone-200/70" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.data.notes.length === 0 ? (
        <section className="rounded-4xl border border-dashed border-stone-300 bg-white/50 px-6 py-20 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <FileText className="size-6" />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-bold">Your first thought starts here</h2>
          <p className="mt-2 text-stone-500">You do not have any notes yet.</p>
          <Link to="/notes/new" className="btn-primary mt-7">
            <Plus className="size-4" /> Create your first note
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.notes.map((note) => (
            <Link
              key={note.id}
              to={`/notes/${note.id}`}
              className="group flex min-h-44 flex-col rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg focus-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${note.isPublic ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}
                >
                  {note.isPublic ? <Globe2 className="size-3" /> : <Lock className="size-3" />}
                  {note.isPublic ? 'Public' : 'Private'}
                </span>
                <ArrowRight className="size-4 text-stone-300 transition group-hover:translate-x-1 group-hover:text-amber-600" />
              </div>
              <h2 className="mt-5 line-clamp-2 font-serif text-2xl font-bold leading-tight">
                {note.title}
              </h2>
              <p className="mt-auto pt-5 text-xs text-stone-400">
                Updated {formatDate(note.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
