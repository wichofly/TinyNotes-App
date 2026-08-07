import { richTextDocumentSchema, type RichTextNode } from '@tinynotes/shared';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from 'lucide-react';
import { useEffect } from 'react';

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: false,
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: 'https',
    protocols: ['http', 'https', 'mailto'],
  }),
];

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ label, active, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className="editor-tool"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previousUrl ?? 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    try {
      const normalized = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
      const parsed = new URL(normalized);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        window.alert('Use an http, https, or mailto link.');
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: parsed.href }).run();
    } catch {
      window.alert('Enter a valid link.');
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-50/80 p-2"
      role="toolbar"
      aria-label="Text formatting"
    >
      <ToolbarButton
        label="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden="true" />
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden="true" />
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden="true" />
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        label="Blockquote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </ToolbarButton>
      <ToolbarButton
        label="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden="true" />
      <ToolbarButton label="Add or edit link" active={editor.isActive('link')} onClick={setLink}>
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Remove link"
        disabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Unlink />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  disabled = false,
}: {
  content: RichTextNode;
  onChange: (document: RichTextNode) => void;
  disabled?: boolean;
}) {
  const editor = useEditor({
    extensions,
    content,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'tiptap-content min-h-80 focus:outline-none',
        'aria-label': 'Note body',
      },
    },
    onUpdate({ editor: currentEditor }) {
      const parsed = richTextDocumentSchema.safeParse(currentEditor.getJSON());
      if (parsed.success) onChange(parsed.data);
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return <div className="min-h-96 animate-pulse rounded-2xl bg-stone-100" />;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export function ReadOnlyContent({ content }: { content: RichTextNode }) {
  const editor = useEditor({
    extensions,
    content,
    editable: false,
    editorProps: { attributes: { class: 'tiptap-content public-content' } },
  });

  return editor ? <EditorContent editor={editor} /> : null;
}
