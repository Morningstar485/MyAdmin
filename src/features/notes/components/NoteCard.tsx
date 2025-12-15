import type { Note } from '../types';
import { Trash2 } from 'lucide-react';

interface NoteCardProps {
    note: Note;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
}

export function NoteCard({ note, onClick, onDelete }: NoteCardProps) {
    // Strip HTML for a clean preview, or render it safely. 
    // For now, let's render it but limit height.
    return (
        <div
            onClick={onClick}
            className="group relative bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600 rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer flex flex-col gap-3 break-inside-avoid mb-4"
        >
            {note.title && (
                <h3 className="font-semibold text-slate-100 text-lg leading-tight">{note.title}</h3>
            )}

            <div
                className="prose prose-invert prose-sm max-w-none text-slate-400 line-clamp-[8] pointer-events-none ProseMirror"
                dangerouslySetInnerHTML={{ __html: note.content }}
            />

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="text-[10px] text-slate-600 font-medium">
                {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
        </div>
    )
}
