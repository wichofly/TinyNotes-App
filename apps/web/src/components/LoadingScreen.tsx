import { Brand } from './Brand';

export function LoadingScreen({ label = 'Loading your notes…' }: { label?: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <Brand linked={false} />
        <span className="size-6 animate-spin rounded-full border-2 border-stone-300 border-t-amber-500" />
        <p className="text-sm text-stone-500" aria-live="polite">
          {label}
        </p>
      </div>
    </main>
  );
}
