import { MAX_PLAIN_TEXT_CHARACTERS, type RichTextNode } from '@tinynotes/shared';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
  it("reports TipTap's empty document as valid", async () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();

    render(
      <RichTextEditor
        content={{ type: 'doc', content: [] }}
        onChange={onChange}
        onValidityChange={onValidityChange}
      />,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onValidityChange).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledWith({ type: 'doc' });
  });

  it('reports an equivalent document when TipTap initializes saved content', async () => {
    const content: RichTextNode = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Saved body' }] }],
    };
    const onChange = vi.fn();

    render(<RichTextEditor content={content} onChange={onChange} />);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onChange).toHaveBeenCalledWith(content);
  });

  it('reports editor content that exceeds the supported limits', async () => {
    const content: RichTextNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'x'.repeat(MAX_PLAIN_TEXT_CHARACTERS + 1) }],
        },
      ],
    };
    const onValidityChange = vi.fn();

    render(
      <RichTextEditor content={content} onChange={vi.fn()} onValidityChange={onValidityChange} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(onValidityChange).toHaveBeenCalledWith(false);
  });
});
