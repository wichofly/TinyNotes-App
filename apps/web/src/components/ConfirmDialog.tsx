import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | undefined;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const isOpen = dialog.hasAttribute('open');
    if (open && !isOpen) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    if (!open && isOpen) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-white p-0 shadow-2xl backdrop:bg-stone-900/40"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClose={onClose}
      aria-labelledby="confirm-title"
    >
      <div className="p-7">
        <span className="mb-5 grid size-11 place-items-center rounded-2xl bg-red-100 text-red-600">
          <AlertTriangle className="size-5" />
        </span>
        <h2 id="confirm-title" className="font-serif text-2xl font-bold text-stone-900">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
        {error ? (
          <p className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-7 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
