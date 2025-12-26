import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Todo, TodoStatus, Tag } from './types';
import { TodoColumn } from './components/TodoColumn';
import { Modal } from '../../components/Modal';
import { TaskForm } from './components/TaskForm';
import { TaskCard } from './components/TaskCard';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { supabase } from '../../lib/supabase';
import { Edit2, Trash2, X } from 'lucide-react';
import { useGoogleTasks } from '../../hooks/useGoogleTasks';

export function TodoBoard() {
    // Fixed Columns (Strict Mode)
    const columns = [
        { title: 'Today', status: 'Today' },
        { title: 'This Week', status: 'This Week' },
        { title: 'Later', status: 'Later' }
    ];

    const [todos, setTodos] = useState<Todo[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTask, setEditingTask] = useState<Todo | null>(null);

    // Details Modal State
    const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // DnD State
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const googleTasks = useGoogleTasks();

    // Initial Fetch & Auto-Organizer
    useEffect(() => {
        const init = async () => {
            // Run Auto-Organizer Logic first
            await supabase.rpc('organize_board_by_deadline');
            fetchData();
        };
        init();
    }, []);

    async function fetchData() {
        try {
            // 2. Fetch Todos with Tags
            // Supabase Join: todo_tags -> tags
            const { data: todosData, error: todosError } = await supabase
                .from('todos')
                .select(`
                    *,
                    todo_tags (
                        tag:tags (*)
                    )
                `)
                .eq('is_archived', false)
                .order('order', { ascending: true })
                .order('created_at', { ascending: false });

            if (todosError) throw todosError;

            // Transform nested data to flat tags array
            if (todosData) {
                const formattedTodos = todosData.map((t: any) => ({
                    ...t,
                    tags: t.todo_tags.map((tt: any) => tt.tag).filter(Boolean)
                }));
                // Set initial todos
                setTodos(formattedTodos as Todo[]);

                if (formattedTodos.length > 0) {
                    console.log('[Fetch] First Task Keys:', Object.keys(formattedTodos[0]));
                    console.log('[Fetch] First Task GID:', formattedTodos[0].google_task_id);
                }

                // --- Trigger Incoming Sync ---
                syncWithGoogle(formattedTodos as Todo[]);
            }

            // Fetch Available Tags
            const { data: tagsData, error: tagsError } = await supabase
                .from('tags')
                .select('*')
                .order('name');

            if (tagsError) throw tagsError;
            if (tagsData) setTags(tagsData as Tag[]);

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // --- Incoming Sync Logic ---
    const syncWithGoogle = async (localTodos: Todo[]) => {
        const googleItems = await googleTasks.listGoogleTasks();
        if (!googleItems || googleItems.length === 0) return;

        let hasUpdates = false;
        const updates: any[] = [];
        const updatedTodos = [...localTodos];

        localTodos.forEach((todo, index) => {
            if (!todo.google_task_id) return;

            const googleTask = googleItems.find((gt: any) => gt.id === todo.google_task_id);
            if (!googleTask) return;

            const googleCompleted = googleTask.status === 'completed';

            // Rule: Sync Completion Status (Incoming)
            if (googleCompleted !== todo.completed) {
                // Update Local State
                updatedTodos[index] = { ...todo, completed: googleCompleted };
                hasUpdates = true;

                // Update Supabase
                updates.push(
                    supabase.from('todos').update({ completed: googleCompleted }).eq('id', todo.id)
                );
            }
        });

        if (hasUpdates) {
            setTodos(updatedTodos);
            await Promise.all(updates);
            console.log(`Synced ${updates.length} tasks from Google.`);
        }
    };

    // --- Tag Handlers ---

    const handleCreateTag = async (name: string, color: string): Promise<Tag | null> => {
        const { data, error } = await supabase
            .from('tags')
            .insert([{ name, color }])
            .select()
            .single();

        if (error) {
            console.error('Error creating tag:', error);
            alert('Failed to create tag');
            return null;
        }

        if (data) {
            setTags(prev => [...prev, data]);
            return data;
        }
        return null;
    };

    // --- DnD Handlers ---

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeTask = todos.find(t => t.id === activeId);
        const overTask = todos.find(t => t.id === overId);

        if (!activeTask) return;

        const activeColumn = activeTask.status;
        const overColumn = overTask ? overTask.status : (columns.find(c => c.status === overId)?.status);

        if (!overColumn || activeColumn === overColumn) return;

        setTodos((items) => {
            const activeIndex = items.findIndex((t) => t.id === activeId);
            const overIndex = overTask ? items.findIndex((t) => t.id === overId) : items.length + 1;

            const newItems = [...items];
            const updatedTask = { ...newItems[activeIndex], status: overColumn as TodoStatus };

            newItems[activeIndex] = updatedTask;
            return arrayMove(newItems, activeIndex, overIndex - 1);
        });
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeTask = todos.find(t => t.id === activeId);
        if (!activeTask) return;

        const finalStatus = activeTask.status;

        if (activeId !== overId) {
            setTodos((items) => {
                const oldIndex = items.findIndex((t) => t.id === activeId);
                const newIndex = items.findIndex((t) => t.id === overId);
                return arrayMove(items, oldIndex, newIndex);
            });
        }

        let newTodos = [...todos];
        const oldIndex = newTodos.findIndex(t => t.id === activeId);
        const overIndex = newTodos.findIndex(t => t.id === overId);

        if (oldIndex !== -1 && overIndex !== -1) {
            newTodos = arrayMove(newTodos, oldIndex, overIndex);
        }

        const columnTasks = newTodos.filter(t => t.status === finalStatus);
        const indexInColumn = columnTasks.findIndex(t => t.id === activeId);

        const prevTask = columnTasks[indexInColumn - 1];
        const nextTask = columnTasks[indexInColumn + 1];

        let newOrder = 0;
        if (prevTask && nextTask) {
            newOrder = ((prevTask.order || 0) + (nextTask.order || 0)) / 2;
        } else if (prevTask) {
            newOrder = (prevTask.order || 0) + 1000;
        } else if (nextTask) {
            newOrder = (nextTask.order || 0) - 1000;
        } else {
            newOrder = Date.now() / 1000;
        }

        const { error } = await supabase
            .from('todos')
            .update({
                status: finalStatus,
                order: newOrder
            })
            .eq('id', activeId);

        if (error) console.error('Error saving order:', error);
    }


    // --- CRUD Handlers ---

    const handleToggle = async (id: string) => {
        const todoToUpdate = todos.find(t => t.id === id);
        if (!todoToUpdate) return;
        const newCompleted = !todoToUpdate.completed;

        setTodos(prev => prev.map(todo =>
            todo.id === id ? { ...todo, completed: newCompleted } : todo
        ));

        // Sync to Google
        if (todoToUpdate.google_task_id) {
            googleTasks.toggleCompletion(todoToUpdate.google_task_id, newCompleted);
        }

        const { error } = await supabase
            .from('todos')
            .update({ completed: newCompleted })
            .eq('id', id);

        if (error) {
            console.error('Error updating task:', error);
            setTodos(prev => prev.map(todo =>
                todo.id === id ? { ...todo, completed: !newCompleted } : todo
            ));
        }
    };

    const handleCreate = async (title: string, description: string, status: TodoStatus, duration: number, taskTags: Tag[], due_date: string | null, syncToGoogle: boolean) => {
        const tempId = Math.random().toString(36).substr(2, 9);
        const order = Date.now() / 1000;

        const newTodo: Todo = {
            id: tempId,
            title,
            description,
            status,
            completed: false,
            duration,
            due_date,
            created_at: new Date().toISOString(),
            order,
            tags: taskTags
        };

        setTodos(prev => [newTodo, ...prev]);
        setIsModalOpen(false);

        // 1. Insert Todo
        const { data, error } = await supabase
            .from('todos')
            .insert([{ title, description, status, completed: false, duration, order, due_date }])
            .select()
            .single();

        if (error || !data) {
            console.error('Error creating task:', error);
            alert(`Failed to create task!`);
            setTodos(prev => prev.filter(t => t.id !== tempId));
            return;
        }

        let googleTaskId = null;
        // Sync to Google Tasks if requested
        if (syncToGoogle) {
            googleTaskId = await googleTasks.createTaskInGoogle({ ...newTodo, id: data.id });
            if (googleTaskId) {
                await supabase.from('todos').update({ google_task_id: googleTaskId }).eq('id', data.id);
            }
        }

        // 2. Insert Tags (Join Table)
        if (taskTags.length > 0) {
            const tagInserts = taskTags.map(tag => ({
                todo_id: data.id,
                tag_id: tag.id
            }));
            const { error: tagError } = await supabase.from('todo_tags').insert(tagInserts);
            if (tagError) console.error('Error linking tags:', tagError);
        }

        // 3. Update local state with real ID & Google ID
        setTodos(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id, google_task_id: googleTaskId } : t));
    };

    const handleUpdate = async (title: string, description: string, status: TodoStatus, duration: number, taskTags: Tag[], due_date: string | null, syncToGoogle: boolean) => {
        if (!editingTask) return;

        const updatedTodo = { ...editingTask, title, description, status, duration, tags: taskTags, due_date };

        setTodos(prev => prev.map(t => t.id === editingTask.id ? updatedTodo : t));
        setEditingTask(null);

        // Sync Update if Google ID exists
        if (editingTask.google_task_id) {
            googleTasks.updateTaskInGoogle(updatedTodo);
        } else if (syncToGoogle) {
            const googleId = await googleTasks.createTaskInGoogle(updatedTodo);
            if (googleId) {
                updatedTodo.google_task_id = googleId;
                await supabase.from('todos').update({ google_task_id: googleId }).eq('id', editingTask.id);
                setTodos(prev => prev.map(t => t.id === editingTask.id ? { ...t, google_task_id: googleId } : t));
            }
        }

        // 1. Update Todo
        const { error } = await supabase
            .from('todos')
            .update({ title, description, status, duration, due_date })
            .eq('id', editingTask.id);

        if (error) {
            console.error('Error updating task:', error);
            alert(`Failed to update task!`);
            return;
        }

        // 2. Update Tags (Delete all, then re-insert)
        await supabase.from('todo_tags').delete().eq('todo_id', editingTask.id);

        if (taskTags.length > 0) {
            const tagInserts = taskTags.map(tag => ({
                todo_id: editingTask.id,
                tag_id: tag.id
            }));
            await supabase.from('todo_tags').insert(tagInserts);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;

        const taskToDelete = todos.find(t => t.id === id);
        setTodos(prev => prev.filter(t => t.id !== id));

        // Sync Delete
        if (taskToDelete?.google_task_id) {
            googleTasks.deleteTaskInGoogle(taskToDelete.google_task_id);
        }

        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Failed to delete task');
        }
    };

    const handleFlush = async () => {
        const completedCount = todos.filter(t => t.completed).length;
        if (completedCount === 0) {
            alert("No completed tasks to flush!");
            return;
        }

        if (!window.confirm(`Flush ${completedCount} completed tasks? This cannot be undone.`)) return;

        setTodos(prev => prev.filter(t => !t.completed));

        const { error } = await supabase
            .from('todos')
            .update({ is_archived: true })
            .eq('completed', true);

        if (error) {
            console.error('Error flushing tasks:', error);
            alert('Failed to flush tasks');
            fetchData();
        }
    };

    const handleTaskClick = (todo: Todo) => {
        setSelectedTask(todo);
        setIsDetailsModalOpen(true);
    };

    const getColumnTodos = (status: TodoStatus) => {
        return todos.filter(t => t.status === status);
    };

    const activeTask = todos.find(t => t.id === activeId);

    // Calculate Stats
    const totalTasks = todos.length;
    const completedTasks = todos.filter(t => t.completed).length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full flex flex-col px-6 pt-6 touch-none">
                <PageHeader
                    title="My Tasks"
                    description="Manage your tasks efficiently."
                    progress={completionPercentage}
                    stats={[
                        { label: 'Total', value: totalTasks },
                        { label: 'Completed', value: completedTasks }
                    ]}
                >
                    <div className="flex items-center gap-2 lg:gap-3 flex-wrap justify-end">
                        <button
                            onClick={handleFlush}
                            className="px-3 py-2 lg:px-4 rounded-lg text-sm font-medium transition-all bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                            title="Delete all completed tasks"
                        >
                            <Trash2 size={18} />
                        </button>

                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`
                                px-3 py-2 lg:px-4 rounded-lg text-sm font-medium transition-all shadow-lg flex items-center gap-2
                                ${isEditMode
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-orange-500/20'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }
                            `}
                        >
                            {isEditMode ? <X size={18} /> : <Edit2 size={18} />}
                            {isEditMode ? 'Done' : 'Edit'}
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 lg:px-4 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                        >
                            + New Task
                        </button>
                    </div>
                </PageHeader>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0">
                    {columns.map(col => (
                        <TodoColumn
                            key={col.status}
                            title={col.title}
                            status={col.status}
                            todos={getColumnTodos(col.status)}
                            onToggle={handleToggle}
                            isEditing={isEditMode}
                            onDelete={handleDelete}
                            onEdit={setEditingTask}
                            onTaskClick={handleTaskClick}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <div className="opacity-80 rotate-3 cursor-grabbing">
                            <TaskCard
                                todo={activeTask}
                                onToggle={() => { }}
                                isEditing={isEditMode}
                            />
                        </div>
                    ) : null}
                </DragOverlay>

                {/* Create Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Create New Task"
                >
                    <TaskForm
                        availableTags={tags}
                        onCreateTag={handleCreateTag}
                        onSubmit={handleCreate}
                        onCancel={() => setIsModalOpen(false)}
                        submitLabel="Create Task"
                    />
                </Modal>

                {/* Edit Modal */}
                {editingTask && (
                    <Modal
                        isOpen={!!editingTask}
                        onClose={() => setEditingTask(null)}
                        title="Edit Task"
                    >
                        <TaskForm
                            initialValues={editingTask}
                            availableTags={tags}
                            onCreateTag={handleCreateTag}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditingTask(null)}
                            submitLabel="Update Task"
                        />
                    </Modal>
                )}

                {/* Task Details Modal */}
                <TaskDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    todo={selectedTask}
                />
            </div>
        </DndContext>
    )
}
