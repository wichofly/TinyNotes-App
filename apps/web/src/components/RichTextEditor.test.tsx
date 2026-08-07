import type { RichTextNode } from '@tinynotes/shared';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
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
});
