import { useState, useMemo, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon, List, Highlighter, Loader2, Link as LinkIcon, Unlink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { compressImage } from '../../../utils/compressImage';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    editable?: boolean;
    isExpanded: boolean;
}

export function RichTextEditor({ content, onChange, editable = true, isExpanded }: RichTextEditorProps) {
    const [isUploading, setIsUploading] = useState(false);

    const extensions = useMemo(() => [
        StarterKit,
        Highlight,
        Underline,
        Image.configure({
            inline: true,
            allowBase64: true,
        }),
        Link.configure({
            openOnClick: true,
            autolink: true,
            defaultProtocol: 'https',
            HTMLAttributes: {
                target: '_blank',
                rel: 'noopener noreferrer',
                class: 'cursor-pointer text-indigo-400 hover:text-indigo-300 hover:underline',
            },
        }),
        Placeholder.configure({
            placeholder: 'Write something amazing... (Paste images to upload)',
        }),
    ], []);

    const editorProps = useMemo(() => ({
        attributes: {
            class: `prose prose-invert max-w-none focus:outline-none text-slate-300 ${isExpanded ? 'min-h-[60vh]' : 'min-h-[300px]'}`,
        },
        handlePaste: (view: any, event: ClipboardEvent) => {
            if (!event.clipboardData || !event.clipboardData.files.length) return false;

            const file = event.clipboardData.files[0];
            if (!file.type.startsWith('image/')) return false;

            event.preventDefault();
            setIsUploading(true);

            (async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("No authenticated user");

                    const compressed = await compressImage(file);
                    const path = `${user.id}/${Date.now()}_${crypto.randomUUID()}.webp`;

                    const { error: uploadError } = await supabase.storage
                        .from('note_images')
                        .upload(path, compressed);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('note_images')
                        .getPublicUrl(path);

                    view.dispatch(view.state.tr.replaceSelectionWith(
                        view.state.schema.nodes.image.create({ src: publicUrl })
                    ));
                } catch (err) {
                    console.error("Image upload failed:", err);
                    alert("Failed to upload image.");
                } finally {
                    setIsUploading(false);
                }
            })();

            return true;
        }
    }), [isExpanded]);

    const editor = useEditor({
        extensions,
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onBlur: ({ editor }) => {
            // Sanitize links on blur to ensure protocol
            const { tr } = editor.state;
            let modified = false;

            editor.state.doc.descendants((node, pos) => {
                if (node.isText) {
                    const linkMark = node.marks.find(mark => mark.type.name === 'link');
                    if (linkMark && linkMark.attrs.href) {
                        const href = linkMark.attrs.href;
                        // Check if missing protocol (and not a mailto)
                        if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
                            const newHref = `https://${href}`;
                            tr.addMark(pos, pos + node.nodeSize,
                                linkMark.type.create({ ...linkMark.attrs, href: newHref })
                            );
                            modified = true;
                        }
                    }
                }
            });

            if (modified) {
                editor.view.dispatch(tr);
                onChange(editor.getHTML()); // Update parent state
            }
        },
        editorProps: editorProps
    }, [extensions, editorProps]); // Dependencies to ensure updates

    // Sync editable state
    useEffect(() => {
        if (editor && editor.isEditable !== editable) {
            editor.setEditable(editable);
        }
    }, [editor, editable]);

    // Sync content if it changes externally (and isn't just an echo of the typing)
    // NOTE: This can be tricky with collaborative editing or fast typing, 
    // but for this simple use case, we typically only update if the new content is significantly different 
    // or if we switched notes. For now, we rely on the parent unmounting/mounting for note switches 
    // because NotesBoard toggles modal. 
    // But for safety, we can check if the editor is empty and content provided is not.
    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            // Only update if difference is meaningful to prevent cursor jumps?
            // Actually, for basic note app, controlled input pattern is hard with Tiptap.
            // Best practice: rely on initial content, and only force update if ID changes.
            // But we don't have ID prop here. 
            // We will skip content sync for now as the Modal unmounts ensuring fresh start.
        }
    }, [editor, content]);

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        let url = window.prompt('URL', previousUrl || '');

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        // Don't focus if clicking a link
        if ((e.target as HTMLElement).closest('a')) {
            return;
        }
        // Only focus if editable is true, or just let default behavior happen logic?
        // Actually, if we are in read-only, we usually don't need to force focus on container click.
        if (editable) {
            editor.commands.focus();
        }
    };

    return (
        <div className="flex flex-col gap-2 relative">
            {isUploading && (
                <div className="absolute inset-0 z-50 bg-black/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700">
                        <Loader2 className="animate-spin text-indigo-500" size={20} />
                        <span className="text-sm font-medium">Compressing & Uploading...</span>
                    </div>
                </div>
            )}

            {editable && (
                <div className="flex items-center gap-2 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50 w-full mb-1">
                    <div className="flex items-center gap-1 overflow-x-auto">
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
                        <div className="w-px h-4 bg-slate-700 mx-1 shrink-0" />
                        <ToolbarButton
                            onClick={setLink}
                            isActive={editor.isActive('link')}
                            icon={<LinkIcon size={16} />}
                            label="Set Link"
                        />
                        <ToolbarButton
                            onClick={() => editor.chain().focus().unsetLink().run()}
                            isActive={false}
                            isDisabled={!editor.isActive('link')}
                            icon={<Unlink size={16} />}
                            label="Unset Link"
                        />
                        <div className="w-px h-4 bg-slate-700 mx-1 shrink-0" />
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
                </div>
            )}
            <div className={`
                bg-slate-900/50 rounded-lg border border-slate-700/50 p-4 
                ${editable ? 'cursor-text' : ''}
                ${isExpanded ? 'min-h-[60vh]' : 'min-h-[300px]'}
                transition-all duration-300
            `}
                onClick={handleContainerClick}
            >
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

function ToolbarButton({ onClick, isActive, isDisabled, icon, label }: { onClick: () => void, isActive: boolean, isDisabled?: boolean, icon: React.ReactNode, label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            title={label}
            className={`
                p-1.5 rounded-md transition-all shrink-0
                ${isDisabled ? 'opacity-30 cursor-not-allowed text-slate-500' :
                    isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }
            `}
        >
            {icon}
        </button>
    )
}
