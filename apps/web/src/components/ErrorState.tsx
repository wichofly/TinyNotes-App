import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this page. Please try again.',
  onRetry,
}: {
  title?: string | undefined;
  message?: string | undefined;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertCircle className="mx-auto mb-4 size-8 text-red-500" aria-hidden="true" />
      <h2 className="font-serif text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn-secondary mt-6">
          <RefreshCw className="size-4" /> Try again
        </button>
      ) : null}
    </div>
  );
}
