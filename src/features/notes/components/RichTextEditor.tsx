import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon, List, Highlighter } from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    editable?: boolean;
}

export function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Highlight,
            Underline,
            Placeholder.configure({
                placeholder: 'Write something amazing...',
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] text-slate-300',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            {editable && (
                <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50 w-fit">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={<Bold size={16} />}
                        label="Bold"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={<Italic size={16} />}
                        label="Italic"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        icon={<UnderlineIcon size={16} />}
                        label="Underline"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        isActive={editor.isActive('strike')}
                        icon={<Strikethrough size={16} />}
                        label="Strike"
                    />
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        isActive={editor.isActive('highlight')}
                        icon={<Highlighter size={16} />}
                        label="Highlight"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={<List size={16} />}
                        label="Bullet List"
                    />
                </div>
            )}
            <div className={`
                bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 
                ${editable ? 'min-h-[200px] cursor-text' : ''}
            `}
                onClick={() => editor.commands.focus()}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

function ToolbarButton({ onClick, isActive, icon, label }: { onClick: () => void, isActive: boolean, icon: React.ReactNode, label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            className={`
                p-1.5 rounded-md transition-all
                ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}
            `}
        >
            {icon}
        </button>
    )
}
