import { emptyRichTextDocument, type RichTextNode } from '@tinynotes/shared';
import { ArrowLeft, Check, LoaderCircle, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useBlocker, useNavigate } from 'react-router';
import { RichTextEditor } from './RichTextEditor';

function stableStringify(value: unknown): string {
  function normalize(current: unknown): unknown {
    if (Array.isArray(current)) return current.map(normalize);
    if (current && typeof current === 'object') {
      return Object.fromEntries(
        Object.entries(current as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalize(nested)]),
      );
    }
    return current;
  }

  return JSON.stringify(normalize(value));
}

export function EditorForm({
  initialTitle = '',
  initialContent = emptyRichTextDocument,
  saveLabel = 'Save note',
  saving,
  savedAt,
  error,
  sidebar,
  onSave,
}: {
  initialTitle?: string;
  initialContent?: RichTextNode;
  saveLabel?: string;
  saving: boolean;
  savedAt?: string | undefined;
  error?: string | undefined;
  sidebar?: React.ReactNode | undefined;
  onSave: (value: { title: string; content: RichTextNode }) => Promise<string | void>;
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [contentValid, setContentValid] = useState(true);
  const [baseline, setBaseline] = useState(() =>
    stableStringify({ title: initialTitle, content: initialContent }),
  );

  const current = useMemo(() => stableStringify({ title, content }), [title, content]);
  const dirty = current !== baseline || !contentValid;
  const blocker = useBlocker(dirty && !saving);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('You have unsaved changes. Leave without saving?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty || saving) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    let destination: string | void;
    try {
      destination = await onSave({ title: trimmedTitle, content });
    } catch {
      // The parent renders the request error. Keep the current draft dirty and editable.
      return;
    }
    setTitle(trimmedTitle);
    setBaseline(stableStringify({ title: trimmedTitle, content }));
    if (destination) queueMicrotask(() => navigate(destination, { replace: true }));
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <Link
        to="/notes"
        className="mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-stone-500 hover:text-stone-900 focus-ring"
      >
        <ArrowLeft className="size-4" /> Back to notes
      </Link>
      <form onSubmit={submit} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section>
          <label htmlFor="note-title" className="sr-only">
            Note title
          </label>
          <input
            id="note-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={saving}
            maxLength={120}
            required
            autoFocus={!initialTitle}
            placeholder="Untitled note"
            className="mb-6 w-full border-0 bg-transparent font-serif text-4xl font-bold tracking-tight text-stone-900 placeholder:text-stone-300 focus:outline-none sm:text-5xl"
          />
          <RichTextEditor
            content={content}
            onChange={setContent}
            onValidityChange={setContentValid}
            disabled={saving}
          />
          {!contentValid ? (
            <p className="mt-4 text-sm font-medium text-red-700" role="alert">
              Note content exceeds the supported size or structure limits.
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </section>
        <aside className="space-y-5 lg:sticky lg:top-8">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={saving || !dirty || !title.trim() || !contentValid}
            >
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saving ? 'Saving…' : saveLabel}
            </button>
            <p
              className="mt-3 flex min-h-5 items-center justify-center gap-1.5 text-xs text-stone-500"
              aria-live="polite"
            >
              {saving ? (
                'Saving your changes'
              ) : dirty ? (
                'Unsaved changes'
              ) : savedAt ? (
                <>
                  <Check className="size-3.5 text-emerald-600" /> Saved {savedAt}
                </>
              ) : (
                'Nothing to save yet'
              )}
            </p>
          </div>
          {sidebar}
        </aside>
      </form>
    </main>
  );
}
