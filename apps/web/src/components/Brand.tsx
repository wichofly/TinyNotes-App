import { Link } from 'react-router';

export function Brand({ linked = true }: { linked?: boolean }) {
  const mark = (
    <span className="inline-flex items-center gap-2.5 font-serif text-xl font-bold tracking-tight text-stone-900">
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-xl bg-amber-300 text-sm shadow-[inset_0_-2px_0_rgb(180_83_9/0.16)]"
      >
        T
      </span>
      TinyNotes
    </span>
  );
  return linked ? (
    <Link to="/" aria-label="TinyNotes home" className="rounded-xl focus-ring">
      {mark}
    </Link>
  ) : (
    mark
  );
}
