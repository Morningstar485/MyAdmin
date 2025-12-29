import { useState, useEffect, useCallback } from 'react';
import type { Resource, LearningNote } from '../types';
import { saveNote, fetchNoteForResource } from '../learningService';
import { RichTextEditor } from '../../notes/components/RichTextEditor';
import { Save, Loader2, ArrowLeft, GripVertical } from 'lucide-react';

interface StudySessionProps {
    resource: Resource;
    onClose?: () => void;
}

export function StudySession({ resource, onClose }: StudySessionProps) {
    const [_note, setNote] = useState<LearningNote | null>(null);
    const [noteContent, setNoteContent] = useState<any>('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Resizer State
    const [splitPct, setSplitPct] = useState(65); // Default 65% for PDF
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const loadNote = async () => {
            setIsLoading(true);
            try {
                const data = await fetchNoteForResource(resource.id);
                setNote(data);
                setNoteContent(data?.content || '');
            } finally {
                setIsLoading(false);
            }
        };
        loadNote();
    }, [resource.id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const saved = await saveNote(resource.id, resource.title, noteContent);
            if (saved) {
                setNote(saved);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Resizer Handlers
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const newPct = (e.clientX / window.innerWidth) * 100;
        // Constraint: between 20% and 80%
        if (newPct > 20 && newPct < 85) {
            setSplitPct(newPct);
        }
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-slate-400 animate-pulse">Initializing Study Environment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-10 shadow-xl">
                <div className="flex items-center gap-6 overflow-hidden">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all border border-white/5 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-semibold">Back to Library</span>
                    </button>

                    <div className="h-6 w-px bg-white/10 shrink-0" />

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Currently Reading</span>
                        <h2 className="text-sm font-bold text-white truncate max-w-md">{resource.title}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Revision
                    </button>
                </div>
            </header>

            {/* Split View Container */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* PDF Viewer Section */}
                <div
                    style={{ width: `${splitPct}%` }}
                    className="h-full bg-slate-900 relative flex flex-col"
                >
                    <iframe
                        src={resource.drive_embed_link}
                        className="w-full h-full border-none"
                        title={resource.title}
                        allow="autoplay"
                    />

                    {/* Interaction Shield (Hidden overlay during drag to prevent iframe from stealing mouse events) */}
                    {isDragging && <div className="absolute inset-0 z-20 pointer-events-none" />}
                </div>

                {/* Draggable Resizer / Slider */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`
                        w-1.5 h-full relative z-30 cursor-col-resize group transition-colors duration-200
                        ${isDragging ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 hover:bg-slate-700'}
                    `}
                >
                    {/* Drag Handle Accent */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl">
                        <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                </div>

                {/* Editor Section */}
                <div
                    style={{ width: `${100 - splitPct}%` }}
                    className="h-full bg-slate-950 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
                >
                    <div className="flex-1 overflow-auto p-8 pt-6 custom-scrollbar">
                        <div className="max-w-4xl mx-auto w-full">
                            <RichTextEditor
                                content={noteContent}
                                onChange={setNoteContent}
                                editable={true}
                                isExpanded={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
