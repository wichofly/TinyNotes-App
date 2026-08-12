import { ArrowRight, Feather, Link2, LockKeyhole, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Brand } from '../components/Brand';
import { authClient } from '../lib/auth-client';

const features = [
  {
    Icon: Feather,
    title: 'Just enough editor',
    copy: 'Headings, lists, links, quotes, and code—without a wall of controls.',
  },
  {
    Icon: LockKeyhole,
    title: 'Private by default',
    copy: 'Every note belongs to you. Nothing is public until you decide it should be.',
  },
  {
    Icon: Link2,
    title: 'Share, then revoke',
    copy: 'Create a hard-to-guess public link and disable it instantly whenever you want.',
  },
] satisfies ReadonlyArray<{ Icon: LucideIcon; title: string; copy: string }>;

export function LandingPage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="min-h-dvh overflow-hidden bg-paper text-stone-900">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav className="flex items-center gap-2" aria-label="Account">
          {session ? (
            <Link to="/notes" className="btn-primary">
              Open my notes <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link to="/sign-in" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/sign-up" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>
      <main>
        <section className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 text-center sm:px-8 sm:pt-28">
          <div className="pointer-events-none absolute left-1/2 top-12 z-0 size-128 -translate-x-1/2 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="relative z-10">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
              A quieter place to think
            </p>
            <h1 className="mx-auto max-w-4xl font-serif text-6xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-8xl">
              Small notes.
              <br />
              <span className="text-amber-600">Clear thoughts.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-stone-600">
              Write without the clutter. Keep thoughts private, or share one with a simple link when
              it is ready.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                to={session ? '/notes/new' : '/sign-up'}
                className="btn-primary px-6 py-3 text-base"
              >
                Start writing <ArrowRight className="size-5" />
              </Link>
              {!session ? (
                <Link to="/sign-in" className="btn-secondary px-6 py-3 text-base">
                  I have an account
                </Link>
              ) : null}
            </div>
          </div>
        </section>
        <section className="border-y border-stone-200/80 bg-white/55">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-3 sm:px-8">
            {features.map(({ Icon, title, copy }) => (
              <article key={title}>
                <span className="mb-5 grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-serif text-xl font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="py-8 text-center text-xs text-stone-400">
        TinyNotes · Made for thoughts worth keeping
      </footer>
    </div>
  );
}
