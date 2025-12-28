import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { useStudySession } from './hooks/useStudySession';
import { RichTextEditor } from '../notes/components/RichTextEditor';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

export function StudyPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { resource, note, isLoading, error } = useStudySession(id);
    const [leftPaneWidth, setLeftPaneWidth] = useState(60); // Percentage
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = (e.clientX / window.innerWidth) * 100;
            if (newWidth > 20 && newWidth < 80) { // Min/Max constraints
                setLeftPaneWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizing]);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const [editorContent, setEditorContent] = useState('');

    useEffect(() => {
        if (note?.content) {
            setEditorContent(typeof note.content === 'string' ? note.content : '');
        }
    }, [note]);

    const handleSaveNote = async (html: string) => {
        if (!note) return;
        setEditorContent(html);
    };

    // Auto-save effect
    useEffect(() => {
        if (!note || !editorContent) return;
        const timeoutId = setTimeout(async () => {
            await supabase.from('notes').update({ content: editorContent }).eq('id', note.id);
        }, 1500);
        return () => clearTimeout(timeoutId);
    }, [editorContent, note]);

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-emerald-500 gap-3">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-slate-400 font-medium animate-pulse">Setting up your desk...</p>
            </div>
        );
    }

    if (error || !resource || !note) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
                <p className="text-rose-400 mb-4">Failed to load study session.</p>
                <button
                    onClick={() => navigate('/library')}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Library
                </button>
            </div>
        );
    }

    // Viewer Logic
    const renderViewer = () => {
        if (resource.type === 'pdf') {
            const url = resource.embed_link || `https://drive.google.com/file/d/${resource.external_id}/preview`;
            return (
                <iframe
                    src={url}
                    className="w-full h-full border-none bg-slate-900"
                    title="PDF Viewer"
                    allow="autoplay"
                />
            );
        }

        if (resource.type === 'video') {
            const url = resource.embed_link || resource.url;
            return (
                <iframe
                    src={url}
                    className="w-full h-full border-none bg-slate-900"
                    title="Video Viewer"
                    allowFullScreen
                />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-slate-900/50">
                <h2 className="text-xl font-bold text-white mb-2">{resource.title}</h2>
                <p className="text-slate-400 mb-6 max-w-md">
                    This resource cannot be embedded directly. Please open it in a new tab to view while taking notes.
                </p>
                <a
                    href={resource.url || resource.embed_link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
                >
                    <ExternalLink size={18} />
                    Open Resource
                </a>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
            {/* Header / Nav */}
            <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/library')}
                        className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Back to Library"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-200 text-sm leading-tight truncate max-w-sm ml-2">
                            {resource.title}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider ml-2">
                            Study Mode
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 italic hidden sm:block">
                        Notes autosave...
                    </span>
                </div>
            </header>

            {/* Split Screen Body */}
            <div className="flex-1 flex overflow-hidden relative" onMouseUp={() => setIsResizing(false)}>
                {/* Left Pane: Viewer */}
                <div
                    style={{ width: `${leftPaneWidth}%` }}
                    className="h-full bg-black border-r border-slate-800 relative shrink-0"
                >
                    {/* Overlay to catch mouse events during drag so iframe doesn't steal them */}
                    {isResizing && <div className="absolute inset-0 z-50 bg-transparent" />}
                    {renderViewer()}
                </div>

                {/* Drag Handle */}
                <div
                    className="w-1.5 hover:w-2 bg-slate-800 hover:bg-emerald-500 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] cursor-col-resize z-40 transition-all flex items-center justify-center group"
                    onMouseDown={startResizing}
                >
                    <div className="h-8 w-0.5 bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
                </div>

                {/* Right Pane: Editor */}
                <div
                    style={{ width: `${100 - leftPaneWidth}%` }}
                    className="h-full flex flex-col bg-slate-950 min-w-[300px] shrink-0"
                >
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        <div className="max-w-2xl mx-auto h-full">
                            <RichTextEditor
                                content={editorContent}
                                onChange={handleSaveNote}
                                isExpanded={true}
                                editable={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
