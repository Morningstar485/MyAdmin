import type { Note } from '../types';
import { Trash2 } from 'lucide-react';

interface NoteCardProps {
    note: Note;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    themeColor?: 'indigo' | 'emerald';
}

export function NoteCard({ note, onClick, onDelete, themeColor = 'indigo' }: NoteCardProps) {
    const themeColors = {
        indigo: {
            hoverBorder: 'hover:border-indigo-500/50',
            hoverShadow: 'hover:shadow-indigo-500/10',
            iconBg: 'hover:bg-indigo-500',
            iconText: 'hover:text-white'
        },
        emerald: {
            hoverBorder: 'hover:border-emerald-500/50',
            hoverShadow: 'hover:shadow-emerald-500/10',
            iconBg: 'hover:bg-emerald-500',
            iconText: 'hover:text-white'
        }
    };

    const colors = themeColors[themeColor];

    return (
        <div
            onClick={onClick}
            className={`group relative bg-slate-900/40 border border-white/5 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col gap-2 h-44 ${colors.hoverBorder} hover:bg-slate-900/80 hover:shadow-xl ${colors.hoverShadow}`}
        >
            <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-slate-200 text-base leading-snug mb-1.5 line-clamp-2 group-hover:text-white transition-colors">
                    {note.title || 'Untitled Note'}
                </h3>

                <div
                    className="prose prose-invert prose-sm max-w-none text-slate-500 group-hover:text-slate-400 is-editor-content line-clamp-3 transition-colors text-xs"
                    dangerouslySetInnerHTML={{ __html: note.content || '<p class="opacity-50 italic text-xs">No content</p>' }}
                />
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-slate-500 transition-colors">
                    {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(e);
                }}
                className={`absolute top-3 right-3 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 text-slate-500 bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400`}
                title="Delete Note"
            >
                <Trash2 size={14} />
            </button>
        </div>
    )
}
