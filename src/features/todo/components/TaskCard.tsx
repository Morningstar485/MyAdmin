import type { Todo } from '../types';
import { Check, Clock, Trash2, Edit2 } from 'lucide-react';

interface TaskCardProps {
    todo: Todo;
    onToggle: (id: string) => void;
    isEditing?: boolean;
    onDelete?: (id: string) => void;
    onEdit?: (todo: Todo) => void;
    onClick?: (todo: Todo) => void;
}

export function TaskCard({ todo, onToggle, isEditing, onDelete, onEdit, onClick }: TaskCardProps) {
    const isCompleted = todo.completed;

    return (
        <div
            className={`
                group relative bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 
                hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-black/20 
                transition-all duration-300 ease-out
                ${isCompleted ? 'opacity-50 hover:opacity-100 grayscale-[0.5]' : ''}
                ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-yellow-500/50 border-dashed hover:border-yellow-500/50' : ''}
            `}
            onClick={() => {
                if (isEditing) {
                    onEdit?.(todo);
                } else {
                    onClick?.(todo);
                }
            }}
        >
            <div className="flex items-start gap-3">
                {!isEditing && (
                    <div className="pt-0.5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle(todo.id);
                            }}
                            className={`
                                w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
                                ${isCompleted
                                    ? 'bg-indigo-500 border-indigo-500 text-white scale-100'
                                    : 'border-slate-600 hover:border-indigo-400 text-transparent scale-95 hover:scale-100'
                                }
                            `}
                        >
                            <Check size={12} strokeWidth={3} />
                        </button>
                    </div>
                )}

                {isEditing && (
                    <div className="pt-0.5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(todo.id);
                            }}
                            className="w-5 h-5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h3 className={`
                        font-semibold text-base leading-tight mb-1 truncate
                        ${isCompleted ? 'text-slate-500 line-through decoration-slate-600 decoration-2' : 'text-slate-200'}
                    `}>
                        {todo.title}
                    </h3>

                    {/* Description hidden in card view per user request */}

                    <div className="mt-3 flex items-center space-x-3">
                        <div className="flex items-center text-xs text-slate-500 group-hover:text-slate-400 bg-slate-800/50 w-fit px-2 py-1 rounded-md">
                            <Clock size={12} className="mr-1.5" />
                            <span>{new Date(todo.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        {todo.duration && todo.duration > 0 && (
                            <div className="flex items-center text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                                <span className="font-medium">{todo.duration}m</span>
                            </div>
                        )}
                    </div>

                    {todo.tags && todo.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {todo.tags.map(tag => (
                                <div key={tag.id} className="flex items-center text-[10px] font-medium text-slate-300 bg-slate-700/50 px-2 py-1 rounded-md border border-slate-600/30">
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tag.color}`}></div>
                                    {tag.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 size={14} className="text-yellow-500" />
                </div>
            )}
        </div>
    )
}
