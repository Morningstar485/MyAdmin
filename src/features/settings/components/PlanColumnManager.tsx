import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { PlanColumn } from '../../todo/types';
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

function SortableItem({ id, column, onDelete }: { id: string, column: PlanColumn, onDelete: (id: string, title: string) => void }) {
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
        <div ref={setNodeRef} style={style} className={`flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 group ${isDragging ? 'opacity-50 ring-2 ring-indigo-500' : ''}`}>
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

export function PlanColumnManager() {
    const [columns, setColumns] = useState<PlanColumn[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchColumns();
    }, []);

    const fetchColumns = async () => {
        try {
            const { data, error } = await supabase
                .from('plan_columns')
                .select('*')
                .order('position');

            if (error) throw error;
            setColumns(data || []);
        } catch (error) {
            console.error('Error fetching plan columns:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddColumn = async () => {
        if (!newColumnTitle.trim()) return;
        setIsCreating(true);

        try {
            const newPosition = columns.length > 0
                ? Math.max(...columns.map(c => c.position)) + 1
                : 0;

            const { data, error } = await supabase
                .from('plan_columns')
                .insert([{ title: newColumnTitle.trim(), position: newPosition }])
                .select()
                .single();

            if (error) throw error;

            setColumns(prev => [...prev, data]);
            setNewColumnTitle('');
        } catch (error) {
            console.error('Error creating plan column:', error);
            alert('Failed to create column');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteColumn = async (id: string, title: string) => {
        // 1. Check for existing plans
        const { count, error: countError } = await supabase
            .from('plans')
            .select('id', { count: 'exact', head: true })
            .eq('status', title);

        if (countError) {
            console.error('Error checking plans:', countError);
            return;
        }

        if (count && count > 0) {
            alert(`Cannot delete "${title}" because it contains ${count} active plans. Please move them first.`);
            return;
        }

        if (!confirm(`delete "${title}" section?`)) return;

        try {
            const { error } = await supabase
                .from('plan_columns')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setColumns(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting plan column:', error);
            alert('Failed to delete column');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setColumns((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update positions in DB
                const updates = newItems.map((col, index) => ({
                    id: col.id,
                    title: col.title,
                    position: index,
                    created_at: col.created_at
                }));

                // Fire and forget
                supabase.from('plan_columns').upsert(updates).then(({ error }) => {
                    if (error) console.error('Error updating plan positions:', error);
                });

                return newItems;
            });
        }
    };

    if (isLoading) return <div className="text-slate-500 text-sm">Loading sections...</div>;

    return (
        <section className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500">
                    <GripVertical size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Planner Sections</h3>
                    <p className="text-slate-400 text-sm">
                        Customize the columns on your Planner Board.
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
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                    />
                    <button
                        onClick={handleAddColumn}
                        disabled={isCreating || !newColumnTitle.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-900/30 p-3 rounded-lg">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>Deleting a section is only possible if it has no active plans. Move plans to another section first. Drag to reorder.</p>
            </div>
        </section>
    );
}
