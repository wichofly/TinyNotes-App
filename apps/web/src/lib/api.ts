import {
  apiErrorSchema,
  type ApiErrorCode,
  type ApiErrorResponse,
  type CreateNoteInput,
  type NoteListItem,
  type OwnedNote,
  type PublicNote,
  type UpdateNoteInput,
} from '@tinynotes/shared';
import { authClient } from './auth-client';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let payload: ApiErrorResponse | undefined;
    try {
      const body: unknown = await response.json();
      const parsed = apiErrorSchema.safeParse(body);
      if (parsed.success) payload = parsed.data;
    } catch {
      // A proxy or network edge may return a non-JSON error.
    }
    if (response.status === 401) void authClient.signOut();
    throw new ApiError(
      response.status,
      payload?.error.code ?? 'INTERNAL_ERROR',
      payload?.error.message ?? 'The request failed. Please try again.',
      payload?.error.fields,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  listNotes: () => apiFetch<{ notes: NoteListItem[] }>('/api/notes'),
  getNote: (noteId: string) => apiFetch<{ note: OwnedNote }>(`/api/notes/${noteId}`),
  createNote: (input: CreateNoteInput) =>
    apiFetch<{ note: OwnedNote }>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateNote: (noteId: string, input: UpdateNoteInput) =>
    apiFetch<{ note: OwnedNote }>(`/api/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  deleteNote: (noteId: string) => apiFetch<void>(`/api/notes/${noteId}`, { method: 'DELETE' }),
  enableSharing: (noteId: string) =>
    apiFetch<{ share: { isPublic: true; shareUrl: string } }>(`/api/notes/${noteId}/share`, {
      method: 'POST',
    }),
  disableSharing: (noteId: string) =>
    apiFetch<{ share: { isPublic: false; shareUrl: null } }>(`/api/notes/${noteId}/share`, {
      method: 'DELETE',
    }),
  getPublicNote: (shareToken: string) =>
    apiFetch<{ note: PublicNote }>(`/api/public/notes/${shareToken}`),
};
