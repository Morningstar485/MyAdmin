import { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { PageHeader } from '../../components/PageHeader';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { type Plan, type PlanStatus, type Todo, type Tag, TAG_COLORS } from '../todo/types';
import { PlanCard } from './components/PlanCard';
import { TaskCard } from '../todo/components/TaskCard';
import { Plus } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { PlanDetailsModal } from './components/PlanDetailsModal';

export function PlannerBoard({ workspace: workspaceProp }: { workspace?: string }) {
    const { workspace: workspaceContext } = useWorkspace();
    const workspace = workspaceProp || workspaceContext;

    // Dynamic Columns State
    const [columns, setColumns] = useState<{ title: string; status: PlanStatus }[]>([]);

    const [plans, setPlans] = useState<Plan[]>([]);
    const [unallocatedTasks, setUnallocatedTasks] = useState<Todo[]>([]);
    const [allTasks, setAllTasks] = useState<Todo[]>([]); // To calculate progress
    const [notes, setNotes] = useState<{ id: string, plan_id: string }[]>([]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPlanTitle, setNewPlanTitle] = useState('');
    const [newPlanDescription, setNewPlanDescription] = useState('');
    const [isUnallocatedOpen, setIsUnallocatedOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<'plan' | 'task' | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    // Tags State
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState('');
    const [isCreatingTag, setIsCreatingTag] = useState(false);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 1024px)').matches);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
            disabled: isMobile
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
            disabled: isMobile
        })
    );

    useEffect(() => {
        fetchData();
    }, [workspace]); // Refetch on workspace change

    async function fetchData() {
        // 1. Fetch Columns
        const { data: columnsData, error: columnsError } = await supabase
            .from('plan_columns')
            .select('*')
            .eq('workspace', workspace)
            .order('position');

        if (columnsError) console.error('Error fetching columns:', columnsError);

        const loadedColumns = (columnsData && columnsData.length > 0)
            ? columnsData.map(c => ({ title: c.title, status: c.title }))
            : [
                { title: 'Not Started', status: 'Not Started' },
                { title: 'Going On', status: 'Going On' },
                { title: 'Stuck', status: 'Stuck' },
                { title: 'Completed', status: 'Completed' },
            ];

        setColumns(loadedColumns);

        // Fetch Plans
        const { data: plansData } = await supabase
            .from('plans')
            .select('*')
            .eq('workspace', workspace)
            .order('created_at');
        if (plansData) setPlans((plansData as Plan[]).filter(p => p.status !== 'Archived'));

        // Fetch Notes (Lightweight)
        const { data: notesData } = await supabase
            .from('notes')
            .select('id, plan_id')
            .eq('workspace', workspace);

        if (notesData) setNotes(notesData);

        // Fetch Tags
        const { data: tagsData } = await supabase
            .from('tags')
            .select('*')
            .eq('workspace', workspace);
        if (tagsData) setTags(tagsData);

        // Fetch Todos
        const { data: todosData } = await supabase
            .from('todos')
            .select(`
                *,
                todo_tags ( tag:tags (*) ),
                plan:plans (*)
            `)
            .eq('workspace', workspace);

        if (todosData) {
            const formattedTodos = todosData.map((t: any) => ({
                ...t,
                tags: t.todo_tags.map((tt: any) => tt.tag).filter(Boolean)
            })) as Todo[];

            setAllTasks(formattedTodos);
            setUnallocatedTasks(formattedTodos.filter(t => !t.plan_id && !t.completed && !t.is_archived));
        }
    }

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)].value;
        const newTag = {
            name: newTagName,
            color: randomColor,
            workspace
        };

        const { data, error } = await supabase.from('tags').insert([newTag]).select().single();
        if (error) {
            console.error('Error creating tag:', error);
            alert('Failed to create tag');
            return;
        }

        if (data) {
            setTags(prev => [...prev, data]);
            setSelectedTagId(data.id);
            setNewTagName('');
            setIsCreatingTag(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlanTitle.trim()) return;

        const defaultStatus = columns.length > 0 ? columns[0].status : 'Not Started';

        const newPlan = {
            title: newPlanTitle,
            description: newPlanDescription,
            status: defaultStatus,
            workspace,
            tag_id: selectedTagId || null
        };

        const { data, error } = await supabase.from('plans').insert([newPlan]).select().single();
        if (error) {
            console.error('Error creating plan', error);
            alert('Failed to create plan');
            return;
        }

        if (data) {
            setPlans(prev => [...prev, data as Plan]);
            setNewPlanTitle('');
            setNewPlanDescription('');
            setSelectedTagId(null);
            setIsCreateModalOpen(false);
        }
    };

    // --- DnD Handlers ---
    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        setActiveId(active.id as string);

        if (active.data.current?.type === 'task') {
            setActiveType('task');
        } else {
            setActiveType('plan');
        }
    }

    function handleDragOver() {
        // Essential for sortable, but less critical for simple drop-on-target
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        setActiveType(null);

        if (!over) return;

        // If dropping a Task onto a Plan
        if (active.data.current?.type === 'task' && over.data.current?.type === 'plan') {
            const taskId = active.id as string;
            const planId = over.id as string;

            // Optimistic Update
            setUnallocatedTasks(prev => prev.filter(t => t.id !== taskId));
            setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, plan_id: planId } : t));

            const { error } = await supabase
                .from('todos')
                .update({ plan_id: planId })
                .eq('id', taskId);

            if (error) {
                console.error('Error assigning task:', error);
                alert('Failed to assign task');
                fetchData(); // Revert
            }
        }

        // If dropping a Plan onto a Column
        if (active.data.current?.type === 'plan' && over.data.current?.type === 'col') {
            const planId = active.id as string;
            const newStatus = over.id as PlanStatus;

            // Optimistic
            setPlans(prev => prev.map(p => p.id === planId ? { ...p, status: newStatus } : p));

            const { error } = await supabase
                .from('plans')
                .update({ status: newStatus })
                .eq('id', planId);

            if (error) {
                console.error('Error moving plan:', error);
                alert('Failed to move plan');
                fetchData();
            }
        }
    }

    const handleUpdatePlan = async (planId: string, updates: Partial<Plan>) => {
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
        const { error } = await supabase.from('plans').update(updates).eq('id', planId);
        if (error) {
            console.error('Error updating plan:', error);
            fetchData();
        }
    };

    const handleAssignTask = async (taskId: string, planId: string) => {
        setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, plan_id: planId } : t));
        setUnallocatedTasks(prev => prev.filter(t => t.id !== taskId));

        const { error } = await supabase.from('todos').update({ plan_id: planId }).eq('id', taskId);
        if (error) {
            console.error('Error assigning task:', error);
            fetchData();
        }
    };

    const handleCreateTask = async (title: string, planId: string) => {
        const newTask = {
            title,
            plan_id: planId,
            status: 'Later',
            completed: false
        };

        const { data, error } = await supabase.from('todos').insert([newTask]).select('*, todo_tags ( tag:tags (*) )').single();

        if (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task');
            return;
        }

        if (data) {
            const plan = plans.find(p => p.id === planId);
            const taskTags: Tag[] = [];

            if (data.todo_tags) {
                data.todo_tags.forEach((tt: any) => {
                    if (tt.tag) taskTags.push(tt.tag);
                });
            }

            // Auto-assign Plan Tag
            if (plan?.tag_id) {
                const { error: tagError } = await supabase
                    .from('todo_tags')
                    .insert({ todo_id: data.id, tag_id: plan.tag_id });

                if (!tagError) {
                    const inheritedTag = tags.find(t => t.id === plan.tag_id);
                    if (inheritedTag) taskTags.push(inheritedTag);
                }
            }

            const formattedTask: Todo = {
                ...data,
                tags: taskTags
            };
            setAllTasks(prev => [...prev, formattedTask]);
        }
    };

    const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newStatus } : t));
        setUnallocatedTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newStatus } : t));

        const { error } = await supabase.from('todos').update({ completed: newStatus }).eq('id', taskId);

        if (error) {
            console.error('Error toggling task:', error);
            fetchData();
            return;
        }

        if (newStatus) {
            const task = allTasks.find(t => t.id === taskId);
            if (task && task.plan_id) {
                const planTasks = allTasks.filter(t => t.plan_id === task.plan_id);
                const allCompleted = planTasks.every(t => t.id === taskId ? true : t.completed);

                if (allCompleted) {
                    const plan = plans.find(p => p.id === task.plan_id);
                    if (plan && plan.status !== 'Completed' && plan.status !== 'Archived') {
                        handleUpdatePlan(plan.id, { status: 'Completed' });
                    }
                }
            }
        }
    };

    const [isEditing, setIsEditing] = useState(false);

    const handleDeletePlan = async (planId: string) => {
        if (!confirm('Are you sure you want to delete this plan? This will effectively archive it.')) return;

        setPlans(prev => prev.filter(p => p.id !== planId));

        const { error: taskError } = await supabase
            .from('todos')
            .update({ is_archived: true, plan_id: null })
            .eq('plan_id', planId);

        if (taskError) console.error('Error archiving plan tasks:', taskError);

        const { error: delError } = await supabase.from('plans').delete().eq('id', planId);
        if (delError) {
            alert('Could not delete plan.');
            fetchData();
        }
    };

    const handleFlush = async () => {
        const completedPlans = plans.filter(p => p.status === 'Completed');

        const plansToFlush = completedPlans.filter(p => {
            const planTasks = allTasks.filter(t => t.plan_id === p.id && !t.is_archived);
            return planTasks.length === 0 || planTasks.every(t => t.completed);
        });

        const incompletePlans = completedPlans.filter(p => !plansToFlush.includes(p));
        if (incompletePlans.length > 0) {
            alert(`Cannot flush ${incompletePlans.length} plans because they still have incomplete tasks.`);
            return;
        }

        if (plansToFlush.length === 0) {
            alert('No fully completed plans to flush.');
            return;
        }

        if (!confirm(`Flush ${plansToFlush.length} plans? This will archive the Plans and their Tasks.`)) return;

        const ids = plansToFlush.map(p => p.id);

        setAllTasks(prev => prev.map(t => ids.includes(t.plan_id || '') ? { ...t, is_archived: true } : t));

        await supabase.from('todos').update({ is_archived: true }).in('plan_id', ids);

        setPlans(prev => prev.filter(p => !ids.includes(p.id)));

        await supabase.from('plans').update({ status: 'Archived' as any }).in('id', ids);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full flex flex-col px-6 pt-6 overflow-hidden relative">
                <PageHeader
                    title="Planner"
                    description="Manage major projects and allocate tasks."
                >
                    <div className="flex items-center gap-2 lg:gap-3 flex-wrap justify-end">
                        <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 mr-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`p-1.5 rounded-md transition-all ${isEditing ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Edit Plans"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 1 22l1.5-6.5Z" /><path d="m15 5 4 4" /></svg>
                            </button>
                            <button
                                onClick={handleFlush}
                                className="p-1.5 rounded-md transition-all text-slate-400 hover:text-white hover:bg-red-500/20"
                                title="Flush Completed Plans"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </button>
                        </div>
                        <button
                            onClick={() => setIsUnallocatedOpen(!isUnallocatedOpen)}
                            className={`
                                px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors border flex items-center gap-2
                                ${isUnallocatedOpen
                                    ? 'bg-slate-700 text-white border-slate-600'
                                    : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-800 hover:text-white'
                                }
                            `}
                        >
                            <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unallocatedTasks.length}</span>
                            <span className="hidden sm:inline">Miscellaneous Tasks</span>
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">New Plan</span>
                        </button>
                    </div>
                </PageHeader>

                <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto lg:overflow-x-auto lg:overflow-y-hidden pb-6 relative">
                    <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:min-w-[800px] min-w-full pb-20 lg:pb-0">
                        {columns.map(col => (
                            <DroppableColumn
                                key={col.status}
                                col={col}
                                plans={plans}
                                allTasks={allTasks}
                                notes={notes}
                                setSelectedPlanId={setSelectedPlanId}
                                isEditing={isEditing}
                                onDeletePlan={handleDeletePlan}
                            />
                        ))}
                    </div>

                    {isUnallocatedOpen && (
                        <div className={`
                            bg-slate-900 border-slate-700 flex flex-col shadow-2xl z-40
                            fixed inset-0 lg:absolute lg:top-0 lg:right-0 lg:bottom-6 lg:w-80 lg:border lg:rounded-2xl
                        `}>
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between safe-top">
                                <div>
                                    <h3 className="font-bold text-slate-200">Miscellaneous Tasks</h3>
                                    <p className="text-xs text-slate-500">Drag to a plan</p>
                                </div>
                                <button
                                    onClick={() => setIsUnallocatedOpen(false)}
                                    className="p-2 -mr-2 text-slate-500 hover:text-white"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-900/50">
                                {unallocatedTasks.map(task => (
                                    <DraggableTask key={task.id} task={task} />
                                ))}
                                {unallocatedTasks.length === 0 && (
                                    <div className="text-center py-10 text-slate-600 text-sm">
                                        All tasks allocated!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DragOverlay>
                    {activeId && activeType === 'task' ? (
                        <div className="opacity-80 rotate-3 cursor-grabbing">
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-600/50 shadow-2xl w-72">
                                <span className="font-medium text-slate-200">Dragging task...</span>
                            </div>
                        </div>
                    ) : null}
                    {activeId && activeType === 'plan' ? (
                        <div className="opacity-80 rotate-3 cursor-grabbing w-[300px]">
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-600/50 shadow-2xl">
                                <h3 className="font-bold text-slate-200">Moving Plan...</h3>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>

                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create New Plan"
                >
                    <div className="space-y-4">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Plan Title (e.g. Q4 Marketing)"
                            className="w-full bg-slate-800 border-none rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500"
                            value={newPlanTitle}
                            onChange={e => setNewPlanTitle(e.target.value)}
                        />
                        <textarea
                            placeholder="Description..."
                            className="w-full bg-slate-800 border-none rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                            value={newPlanDescription}
                            onChange={e => setNewPlanDescription(e.target.value)}
                        />

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-slate-400">Auto-Apply Tag</label>
                                {!isCreatingTag ? (
                                    <button
                                        onClick={() => setIsCreatingTag(true)}
                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                    >
                                        <Plus size={12} /> New Tag
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsCreatingTag(false)}
                                        className="text-[10px] text-slate-500 hover:text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>

                            {isCreatingTag && (
                                <div className="flex gap-2 mb-3 animate-in slide-in-from-top-1">
                                    <input
                                        type="text"
                                        placeholder="Tag Name"
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        value={newTagName}
                                        onChange={e => setNewTagName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                                    />
                                    <button
                                        onClick={handleCreateTag}
                                        className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedTagId(null)}
                                    className={`text-xs px-2 py-1 rounded border transition-colors ${!selectedTagId ? 'bg-slate-700 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                >
                                    None
                                </button>
                                {tags.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => setSelectedTagId(tag.id === selectedTagId ? null : tag.id)}
                                        className={`text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1 ${selectedTagId === tag.id ? 'bg-slate-700 border-indigo-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${tag.color}`} />
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePlan}
                                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
                            >
                                Create Plan
                            </button>
                        </div>
                    </div>
                </Modal>

                <PlanDetailsModal
                    isOpen={!!selectedPlanId}
                    onClose={() => setSelectedPlanId(null)}
                    plan={plans.find(p => p.id === selectedPlanId) || null}
                    tasks={allTasks.filter(t => t.plan_id === selectedPlanId)}
                    unallocatedTasks={unallocatedTasks}
                    onUpdatePlan={handleUpdatePlan}
                    onAssignTask={handleAssignTask}
                    onCreateTask={handleCreateTask}
                    onToggleTask={handleToggleTask}
                />
            </div>
        </DndContext>
    );
}

function DraggableTask({ task }: { task: Todo }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task.id,
        data: { type: 'task', task }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <TaskCard todo={task} isEditing={false} onToggle={() => { }} />
        </div>
    );
}

function DroppableColumn({
    col,
    plans,
    allTasks,
    notes,
    setSelectedPlanId,
    isEditing,
    onDeletePlan
}: {
    col: { title: string, status: PlanStatus },
    plans: Plan[],
    allTasks: Todo[],
    notes: { id: string, plan_id: string }[],
    setSelectedPlanId: (id: string | null) => void,
    isEditing: boolean,
    onDeletePlan: (id: string) => void
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: col.status,
        data: { type: 'col', status: col.status }
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                flex-1 min-w-[250px] min-h-0 h-full flex flex-col rounded-xl px-2 py-4 border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm transition-colors
                ${isOver ? 'bg-slate-800/50 ring-2 ring-indigo-500/50' : ''}
            `}
        >
            <div className={`
                flex items-center justify-between mb-4 px-2 py-2 rounded-lg border-b-2
                ${col.status === 'Not Started' ? 'border-slate-500 text-slate-400' : ''}
                ${col.status === 'Going On' ? 'border-indigo-500 text-indigo-400' : ''}
                ${col.status === 'Stuck' ? 'border-red-500 text-red-400' : ''}
                ${col.status === 'Completed' ? 'border-emerald-500 text-emerald-400' : ''}
            `}>
                <h3 className="font-bold text-sm uppercase tracking-wider">{col.title}</h3>
                <span className="bg-slate-800 text-xs px-2 py-1 rounded-full text-slate-400 font-mono">
                    {plans.filter(p => p.status === col.status).length}
                </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar p-2">
                {plans.filter(p => p.status === col.status).map(plan => {
                    const planTasks = allTasks.filter(t => t.plan_id === plan.id);
                    const completed = planTasks.filter(t => t.completed).length;
                    const planNotes = notes.filter(n => n.plan_id === plan.id).length;

                    return (
                        <DroppablePlan
                            key={plan.id}
                            plan={plan}
                            taskCount={planTasks.length}
                            completedCount={completed}
                            noteCount={planNotes}
                            hasMindMap={true}
                            onClick={() => setSelectedPlanId(plan.id)}
                            isEditing={isEditing}
                            onDelete={() => onDeletePlan(plan.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function DroppablePlan({
    plan,
    taskCount,
    completedCount,
    noteCount,
    hasMindMap,
    onClick,
    isEditing,
    onDelete
}: {
    plan: Plan;
    taskCount: number;
    completedCount: number;
    noteCount: number;
    hasMindMap: boolean;
    onClick: () => void;
    isEditing: boolean;
    onDelete: () => void;
}) {
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: plan.id,
        data: { type: 'plan', plan }
    });

    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: plan.id,
        data: { type: 'plan', plan }
    });

    const setNodeRef = (el: HTMLElement | null) => {
        setDropRef(el);
        setDragRef(el);
    };

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`transition-all rounded-xl touch-none ${isOver && !isDragging ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 bg-slate-800' : ''}`}
        >
            <PlanCard
                plan={plan}
                onClick={onClick}
                taskCount={taskCount}
                completedCount={completedCount}
                noteCount={noteCount}
                hasMindMap={hasMindMap}
                isEditing={isEditing}
                onDelete={onDelete}
            />
        </div>
    );
}

// Add CSS for custom scrollbar if not already globally available
// <style>{`
//   .custom-scrollbar::-webkit-scrollbar { width: 6px; }
//   .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
//   .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
//   .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
// `}</style>
