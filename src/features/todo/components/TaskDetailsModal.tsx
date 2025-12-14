import { Calendar, Clock, Tag as TagIcon } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import type { Todo, Tag } from '../../todo/types';

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    todo: Todo | null;
}

export function TaskDetailsModal({ isOpen, onClose, todo }: TaskDetailsModalProps) {
    if (!todo) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={todo.title}>
            <div className="space-y-6">
                {/* Status & Metadata Badges */}
                <div>
                    <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${todo.completed
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                            {todo.completed ? 'Completed' : todo.status}
                        </span>
                        {todo.duration && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                                <Clock size={12} />
                                {todo.duration}m
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                {todo.description ? (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {todo.description}
                        </p>
                    </div>
                ) : (
                    <div className="text-slate-500 italic">No description provided.</div>
                )}

                {/* Metadata & Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-400">
                    <div className="bg-slate-800/30 p-3 rounded-lg flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-md text-slate-400">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-0.5">Created</p>
                            <p className="text-slate-200">
                                {new Date(todo.created_at).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {todo.tags && todo.tags.length > 0 && (
                        <div className="bg-slate-800/30 p-3 rounded-lg flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-md text-slate-400">
                                <TagIcon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Tags</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {todo.tags.map((tag: Tag) => (
                                        <span
                                            key={tag.id}
                                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${tag.color.replace('text-', 'bg-').replace('500', '500/20')} ${tag.color} border border-transparent`}
                                            style={{ borderColor: 'currentColor', opacity: 0.9 }}
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
