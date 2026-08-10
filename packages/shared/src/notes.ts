import { z } from 'zod';

export const MAX_CONTENT_BYTES = 200 * 1024;
export const MAX_PLAIN_TEXT_CHARACTERS = 50_000;
export const MAX_DOCUMENT_DEPTH = 40;
export const MAX_DOCUMENT_NODES = 10_000;

const nodeTypes = new Set([
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'hardBreak',
  'horizontalRule',
]);

const markTypes = new Set(['bold', 'italic', 'strike', 'code', 'link']);
const containerTypes = new Set([
  'doc',
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
]);
const leafTypes = new Set(['text', 'hardBreak', 'horizontalRule']);
const allowedChildren: Record<string, Set<string>> = {
  doc: new Set([
    'paragraph',
    'heading',
    'bulletList',
    'orderedList',
    'blockquote',
    'codeBlock',
    'horizontalRule',
  ]),
  paragraph: new Set(['text', 'hardBreak']),
  heading: new Set(['text', 'hardBreak']),
  bulletList: new Set(['listItem']),
  orderedList: new Set(['listItem']),
  listItem: new Set(['paragraph', 'bulletList', 'orderedList', 'blockquote', 'codeBlock']),
  blockquote: new Set([
    'paragraph',
    'heading',
    'bulletList',
    'orderedList',
    'blockquote',
    'codeBlock',
    'horizontalRule',
  ]),
  codeBlock: new Set(['text']),
};
const safeLinkPattern = /^(https?:|mailto:)/i;

export type RichTextMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type RichTextNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
};

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function validateMark(mark: unknown): mark is RichTextMark {
  if (!mark || typeof mark !== 'object' || Array.isArray(mark)) return false;
  const value = mark as Record<string, unknown>;
  if (typeof value.type !== 'string' || !markTypes.has(value.type)) return false;

  if (value.type === 'link') {
    if (!hasOnlyKeys(value, ['type', 'attrs'])) return false;
    if (!value.attrs || typeof value.attrs !== 'object' || Array.isArray(value.attrs)) return false;
    const attrs = value.attrs as Record<string, unknown>;
    return (
      hasOnlyKeys(attrs, ['href', 'target', 'rel', 'class']) &&
      typeof attrs.href === 'string' &&
      attrs.href.length <= 2_048 &&
      safeLinkPattern.test(attrs.href) &&
      (attrs.target === undefined || attrs.target === null || attrs.target === '_blank') &&
      (attrs.rel === undefined || attrs.rel === null || typeof attrs.rel === 'string') &&
      (attrs.class === undefined || attrs.class === null || typeof attrs.class === 'string')
    );
  }

  return hasOnlyKeys(value, ['type']) && value.attrs === undefined;
}

function validateNode(
  node: unknown,
  state: { nodes: number; textCharacters: number },
  depth: number,
  parentType?: string,
): node is RichTextNode {
  if (depth > MAX_DOCUMENT_DEPTH || !node || typeof node !== 'object' || Array.isArray(node)) {
    return false;
  }

  state.nodes += 1;
  if (state.nodes > MAX_DOCUMENT_NODES) return false;

  const value = node as Record<string, unknown>;
  if (typeof value.type !== 'string' || !nodeTypes.has(value.type)) return false;

  const allowedKeys = ['type', 'content', 'marks', 'text', 'attrs'];
  if (!hasOnlyKeys(value, allowedKeys)) return false;

  if (value.type === 'doc' && depth !== 0) return false;
  if (value.type !== 'doc' && depth === 0) return false;
  if (parentType && !allowedChildren[parentType]?.has(value.type)) return false;

  if (value.type === 'text') {
    if (typeof value.text !== 'string') return false;
    state.textCharacters += value.text.length;
    if (state.textCharacters > MAX_PLAIN_TEXT_CHARACTERS) return false;
    if (value.content !== undefined || value.attrs !== undefined) return false;
    if (value.marks !== undefined) {
      if (!Array.isArray(value.marks) || !value.marks.every(validateMark)) return false;
      if (parentType === 'codeBlock' && value.marks.length > 0) return false;
    }
    return true;
  }

  if (value.text !== undefined || value.marks !== undefined) return false;

  if (value.type === 'heading') {
    if (!value.attrs || typeof value.attrs !== 'object' || Array.isArray(value.attrs)) return false;
    const attrs = value.attrs as Record<string, unknown>;
    if (!hasOnlyKeys(attrs, ['level']) || ![1, 2, 3].includes(attrs.level as number)) return false;
  } else if (value.type === 'orderedList') {
    if (value.attrs !== undefined) {
      if (typeof value.attrs !== 'object' || Array.isArray(value.attrs)) return false;
      const attrs = value.attrs as Record<string, unknown>;
      if (
        !hasOnlyKeys(attrs, ['start']) ||
        !Number.isInteger(attrs.start) ||
        (attrs.start as number) < 1
      ) {
        return false;
      }
    }
  } else if (value.type === 'codeBlock') {
    if (value.attrs !== undefined) {
      if (typeof value.attrs !== 'object' || Array.isArray(value.attrs)) return false;
      const attrs = value.attrs as Record<string, unknown>;
      if (
        !hasOnlyKeys(attrs, ['language']) ||
        !(attrs.language === null || typeof attrs.language === 'string')
      ) {
        return false;
      }
    }
  } else if (value.attrs !== undefined) {
    return false;
  }

  if (leafTypes.has(value.type)) return value.content === undefined;
  if (!containerTypes.has(value.type)) return false;
  if (value.content === undefined) {
    return ['doc', 'paragraph', 'heading', 'codeBlock'].includes(value.type);
  }
  if (!Array.isArray(value.content)) return false;
  if (
    ['bulletList', 'orderedList', 'listItem', 'blockquote'].includes(value.type) &&
    value.content.length === 0
  ) {
    return false;
  }
  return value.content.every((child) =>
    validateNode(child, state, depth + 1, value.type as string),
  );
}

function isValidRichTextDocument(value: unknown): value is RichTextNode {
  if (!validateNode(value, { nodes: 0, textCharacters: 0 }, 0)) return false;
  const serialized = JSON.stringify(value);
  return new TextEncoder().encode(serialized).byteLength <= MAX_CONTENT_BYTES;
}

export const richTextDocumentSchema = z.custom<RichTextNode>(isValidRichTextDocument, {
  message: 'Content is not a supported rich-text document.',
});

export const emptyRichTextDocument: RichTextNode = { type: 'doc', content: [] };

export const noteIdSchema = z.string().uuid('Note ID is invalid.');
export const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32}$/, 'Share token is invalid.');
export const noteTitleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required.')
  .max(120, 'Title must be 120 characters or fewer.');

export const createNoteSchema = z.object({
  title: noteTitleSchema,
  content: richTextDocumentSchema,
});

export const updateNoteSchema = z
  .object({
    title: noteTitleSchema.optional(),
    content: richTextDocumentSchema.optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.content !== undefined, {
    message: 'Provide a title or content to update.',
  });

export const noteListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  isPublic: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ownedNoteSchema = noteListItemSchema.extend({
  content: richTextDocumentSchema,
  shareUrl: z.string().url().nullable(),
});

export const publicNoteSchema = z.object({
  title: z.string(),
  content: richTextDocumentSchema,
  publishedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteListItem = z.infer<typeof noteListItemSchema>;
export type OwnedNote = z.infer<typeof ownedNoteSchema>;
export type PublicNote = z.infer<typeof publicNoteSchema>;
