'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Undo,
  Redo
} from 'lucide-react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
    ],
    content: content,
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const MenuButton = ({
    onClick,
    isActive = false,
    children
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg transition ${isActive
        ? 'bg-[#001A72] text-white'
        : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-50">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <Bold size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <Italic size={16} />
        </MenuButton>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 size={16} />
        </MenuButton>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          <List size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          <ListOrdered size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
        >
          <Quote size={16} />
        </MenuButton>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <MenuButton onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={16} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={16} />
        </MenuButton>
      </div>
      <div
        className="p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none cursor-text"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
