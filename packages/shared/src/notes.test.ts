import { describe, expect, it } from 'vitest';
import { createNoteSchema, emptyRichTextDocument, richTextDocumentSchema } from './notes';

describe('richTextDocumentSchema', () => {
  it('accepts the empty TipTap document', () => {
    expect(richTextDocumentSchema.safeParse(emptyRichTextDocument).success).toBe(true);
    expect(richTextDocumentSchema.safeParse({ type: 'doc' }).success).toBe(true);
  });

  it('accepts supported formatting and safe links', () => {
    const document = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'TinyNotes',
              marks: [{ type: 'bold' }, { type: 'link', attrs: { href: 'https://example.com' } }],
            },
          ],
        },
      ],
    };
    expect(richTextDocumentSchema.safeParse(document).success).toBe(true);
  });

  it('rejects executable links and unsupported nodes', () => {
    const unsafe = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'click',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    };
    expect(richTextDocumentSchema.safeParse(unsafe).success).toBe(false);
    expect(
      richTextDocumentSchema.safeParse({ type: 'doc', content: [{ type: 'image' }] }).success,
    ).toBe(false);
  });

  it('rejects deeply nested malformed input without throwing', () => {
    let deeplyNested: unknown = {};
    for (let depth = 0; depth < 15_000; depth += 1) {
      deeplyNested = { nested: deeplyNested };
    }

    expect(richTextDocumentSchema.safeParse(deeplyNested).success).toBe(false);
  });
});

describe('createNoteSchema', () => {
  it('trims titles and rejects whitespace-only titles', () => {
    expect(
      createNoteSchema.parse({ title: '  Hello  ', content: emptyRichTextDocument }).title,
    ).toBe('Hello');
    expect(
      createNoteSchema.safeParse({ title: '   ', content: emptyRichTextDocument }).success,
    ).toBe(false);
  });
});
