import { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { Todo, TodoStatus } from '../types';
import { SortableTaskItem } from './SortableTaskItem';

interface TodoColumnProps {
    title: string;
    status: TodoStatus;
    todos: Todo[];
    onToggle: (id: string) => void;
    isEditing?: boolean;
    onDelete?: (id: string) => void;
    onEdit?: (todo: Todo) => void;
    onTaskClick?: (todo: Todo) => void;
}

export function TodoColumn({ title, status, todos, onToggle, isEditing, onDelete, onEdit, onTaskClick }: TodoColumnProps) {
    const { setNodeRef } = useDroppable({
        id: status,
    });

    const activeTodos = todos.filter(t => !t.completed);
    const totalMinutes = activeTodos.reduce((acc, t) => acc + (t.duration || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const todoIds = useMemo(() => todos.map(t => t.id), [todos]);

    return (
        <div className="flex flex-col h-fit max-h-full min-w-[280px]">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-1">{title}</h2>

            <div className="flex flex-col border border-slate-700/50 rounded-2xl bg-slate-900/20 overflow-hidden relative min-h-0">
                <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
                    <div
                        ref={setNodeRef}
                        className="overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent max-h-[calc(100vh-250px)] min-h-[100px]"
                    >
                        {todos.map(todo => (
                            <SortableTaskItem
                                key={todo.id}
                                todo={todo}
                                onToggle={onToggle}
                                isEditing={isEditing}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onClick={onTaskClick}
                            />
                        ))}
                        {todos.length === 0 && (
                            <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-800/50 rounded-xl text-slate-600 text-sm pointer-events-none">
                                No tasks here
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>

            <div className="mt-3 flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
                <span>{activeTodos.length} Pending</span>
                {totalMinutes > 0 && (
                    <span className="text-indigo-400">{timeString} Remaining</span>
                )}
            </div>
        </div>
    )
}
