import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../../../lib/supabase';
import type { TaskColumn } from '../../todo/types';
import { Trash2, Plus, GripVertical, AlertCircle } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, column, onDelete }: { id: string, column: TaskColumn, onDelete: (id: string, title: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 group ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}>
            <div className="cursor-grab text-slate-600 hover:text-slate-400 touch-none" {...attributes} {...listeners}>
                <GripVertical size={16} />
            </div>
            <span className="flex-1 text-slate-200 font-medium">{column.title}</span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onDelete(column.id, column.title)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    title="Delete Section"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

export interface ColumnManagerHandle {
    save: () => Promise<void>;
    reset: () => void;
}

interface ColumnManagerProps {
    onDirtyChange: (isDirty: boolean) => void;
}

export const ColumnManager = forwardRef<ColumnManagerHandle, ColumnManagerProps>(({ onDirtyChange }, ref) => {
    const [originalColumns, setOriginalColumns] = useState<TaskColumn[]>([]);
    const [columns, setColumns] = useState<TaskColumn[]>([]);
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    // Removed unused isCreating state

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchColumns();
    }, []);

    // Check dirty state
    useEffect(() => {
        const isDirty =
            columns.length !== originalColumns.length ||
            deletedIds.size > 0 ||
            JSON.stringify(columns.map(c => c.id)) !== JSON.stringify(originalColumns.map(c => c.id)) ||
            columns.some(c => c.id.startsWith('temp-'));

        onDirtyChange(isDirty);
    }, [columns, originalColumns, deletedIds, onDirtyChange]);


    const fetchColumns = async () => {
        setIsLoading(true);
        try {
            // 1. Try to initialize defaults
            const { error: rpcError } = await supabase.rpc('initialize_default_task_columns');
            if (rpcError) console.error('Error initializing columns:', rpcError);

            // 2. Fetch columns
            const { data, error } = await supabase
                .from('task_columns')
                .select('*')
                .order('position');

            if (error) throw error;

            const loaded = data || [];
            setOriginalColumns(loaded);
            setColumns(loaded);
            setDeletedIds(new Set());
            onDirtyChange(false);
        } catch (error) {
            console.error('Error fetching columns:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useImperativeHandle(ref, () => ({
        save: async () => {
            // 1. Handle Deletes
            if (deletedIds.size > 0) {
                const realIdsToDelete = Array.from(deletedIds).filter(id => !id.startsWith('temp-'));
                if (realIdsToDelete.length > 0) {
                    const { error } = await supabase.from('task_columns').delete().in('id', realIdsToDelete);
                    if (error) throw error;
                }
            }

            // 2. Handle Upserts
            const upserts = columns.map((col, index) => {
                const isTemp = col.id.startsWith('temp-');
                return {
                    id: isTemp ? undefined : col.id,
                    title: col.title,
                    position: index,
                };
            });

            const existingItems = upserts.filter(u => u.id);
            const newItems = upserts.filter(u => !u.id);

            if (existingItems.length > 0) {
                const { error: updateError } = await supabase.from('task_columns').upsert(existingItems);
                if (updateError) throw updateError;
            }

            if (newItems.length > 0) {
                const { error: insertError } = await supabase.from('task_columns').insert(newItems);
                if (insertError) throw insertError;
            }

            await fetchColumns();
        },
        reset: () => {
            setColumns(originalColumns);
            setDeletedIds(new Set());
        }
    }));

    const handleAddColumn = async () => {
        if (!newColumnTitle.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const newCol: TaskColumn = {
            id: tempId,
            title: newColumnTitle.trim(),
            position: columns.length,
            created_at: new Date().toISOString()
        };

        setColumns(prev => [...prev, newCol]);
        setNewColumnTitle('');
    };

    const handleDeleteColumn = async (id: string, title: string) => {
        // Only check DB if it's a real column
        if (!id.startsWith('temp-')) {
            const { count, error: countError } = await supabase
                .from('todos')
                .select('id', { count: 'exact', head: true })
                .eq('status', title)
                .eq('is_archived', false);

            if (countError) {
                console.error('Error checking tasks:', countError);
                return;
            }

            if (count && count > 0) {
                alert(`Cannot delete "${title}" because it contains ${count} active tasks. Please move them first.`);
                return;
            }
        }

        if (!confirm(`Mark "${title}" for deletion?`)) return;

        setColumns(prev => prev.filter(c => c.id !== id));
        setDeletedIds(prev => new Set(prev).add(id));
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setColumns((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    if (isLoading) return <div className="text-slate-500 text-sm">Loading sections...</div>;

    return (
        <section className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 relative">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                    <GripVertical size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Task Sections</h3>
                    <p className="text-slate-400 text-sm">
                        Customize the columns.
                        <span className="text-indigo-400 ml-1 font-medium">Changes are local until saved.</span>
                    </p>
                </div>
            </div>

            <div className="space-y-3 max-w-md">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {columns.map((col) => (
                            <SortableItem key={col.id} id={col.id} column={col} onDelete={handleDeleteColumn} />
                        ))}
                    </SortableContext>
                </DndContext>

                <div className="flex gap-2 pt-2">
                    <input
                        type="text"
                        placeholder="New Section Name"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                    />
                    <button
                        onClick={handleAddColumn}
                        disabled={!newColumnTitle.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-900/30 p-3 rounded-lg">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>Deleting a section is only possible if it has no active tasks. Changes must be saved to take effect.</p>
            </div>

            {(columns.length !== originalColumns.length || deletedIds.size > 0) && (
                <div className="absolute top-4 right-4 text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">
                    Unsaved Changes
                </div>
            )}
        </section>
    );
});
