import { Clock, Tag as TagIcon, Play, Pause, Square } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import type { Todo, Tag } from '../../todo/types';
import { useTimer } from '../../../contexts/TimerContext';

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    todo: Todo | null;
}

export function TaskDetailsModal({ isOpen, onClose, todo }: TaskDetailsModalProps) {
    if (!todo) return null;

    const { activeTaskId, isRunning, elapsedTime, startTimer, pauseTimer, stopTimer, formatTime } = useTimer();



    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={todo.title}
            headerAction={
                <div className="flex items-center gap-3 mr-2">
                    {/* Timer Controls */}
                    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/50">
                        {activeTaskId === todo.id && isRunning ? (
                            <button onClick={pauseTimer} className="p-1.5 text-amber-400 hover:bg-slate-700 rounded-md transition-colors" title="Pause Timer"><Pause size={14} className="fill-current" /></button>
                        ) : (
                            <button onClick={() => startTimer(todo.id, todo.title)} className={`flex items-center gap-2 px-2 py-1.5 ${activeTaskId === todo.id ? 'text-green-400' : 'text-slate-400 hover:text-white'} hover:bg-slate-700 rounded-md transition-colors`} title="Start Timer">
                                <Play size={14} className={activeTaskId === todo.id ? "fill-current" : ""} />
                                <span className="text-xs font-bold">Start Timer</span>
                            </button>
                        )}
                        {activeTaskId === todo.id && (
                            <button onClick={stopTimer} className="p-1.5 text-red-400 hover:bg-slate-700 rounded-md transition-colors" title="Stop Timer"><Square size={14} className="fill-current" /></button>
                        )}
                    </div>
                    {activeTaskId === todo.id && (
                        <span className="font-mono text-xs font-bold text-slate-300 min-w-[50px]">{formatTime(elapsedTime)}</span>
                    )}

                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${todo.completed
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                        {todo.completed ? 'Completed' : todo.status}
                    </span>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Duration Badge (if exists) */}
                {todo.duration && (
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                                <Clock size={12} />
                                {todo.duration}m
                            </span>
                        </div>
                    </div>
                )}

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
                <div className="grid grid-cols-1 gap-4 text-sm text-slate-400">
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
