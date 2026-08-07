import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateNoteInput } from '@tinynotes/shared';
import { EditorForm } from '../components/EditorForm';
import { ApiError, api } from '../lib/api';

export function NewNotePage() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateNoteInput) => api.createNote(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  return (
    <EditorForm
      saving={mutation.isPending}
      saveLabel="Create note"
      error={
        mutation.error instanceof ApiError
          ? mutation.error.message
          : mutation.isError
            ? 'The note could not be created.'
            : undefined
      }
      onSave={async (value) => {
        const result = await mutation.mutateAsync(value);
        return `/notes/${result.note.id}`;
      }}
    />
  );
}
