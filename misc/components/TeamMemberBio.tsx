'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

interface TeamMemberBioProps {
  content: string;
  preview?: boolean;
}

const getPlainText = (content: string) => content
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

export default function TeamMemberBio({ content, preview = false }: TeamMemberBioProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Underline],
    content,
    editable: false,
    editorProps: {
      attributes: { class: 'rich-text-content' },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content, editor]);

  if (preview) {
    return <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">{editor?.getText() || getPlainText(content)}</p>;
  }

  if (!editor) {
    return <div className="rich-text-content leading-8 text-gray-600">{getPlainText(content)}</div>;
  }

  return <EditorContent editor={editor} className="leading-8 text-gray-600" />;
}
