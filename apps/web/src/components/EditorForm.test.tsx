import type { RichTextNode } from '@tinynotes/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { EditorForm } from './EditorForm';

vi.mock('./RichTextEditor', async () => {
  const React = await import('react');
  return {
    RichTextEditor: ({
      content,
      onChange,
    }: {
      content: RichTextNode;
      onChange: (content: RichTextNode) => void;
    }) => {
      const initialized = React.useRef(false);
      React.useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        onChange({
          type: content.type,
          ...(content.content === undefined ? {} : { content: content.content }),
        });
      }, [content, onChange]);
      return <div aria-label="Note body" />;
    },
  };
});

describe('EditorForm', () => {
  it('ignores object key ordering when tracking a saved document', async () => {
    const initialContent: RichTextNode = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Saved body' }] }],
    };
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <EditorForm
              initialTitle="Saved title"
              initialContent={initialContent}
              saving={false}
              onSave={vi.fn()}
            />
          ),
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('button', { name: 'Save note' })).toBeDisabled();
  });

  it('keeps a failed draft editable and marked as unsaved', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error('offline'));
    const router = createMemoryRouter(
      [{ path: '/', element: <EditorForm saving={false} onSave={onSave} /> }],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    const title = screen.getByLabelText('Note title');
    await user.type(title, 'Draft survives');
    await user.click(screen.getByRole('button', { name: 'Save note' }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(title).toHaveValue('Draft survives');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save note' })).toBeEnabled();
  });
});
