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
import { type Plan, type PlanStatus, type Todo } from '../todo/types';
import { PlanCard } from './components/PlanCard';
import { TaskCard } from '../todo/components/TaskCard';
import { Plus } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { PlanDetailsModal } from './components/PlanDetailsModal';

const PLAN_COLUMNS: { title: string; status: PlanStatus }[] = [
    { title: 'Not Started', status: 'Not Started' },
    { title: 'Going On', status: 'Going On' },
    { title: 'Stuck', status: 'Stuck' },
    { title: 'Completed', status: 'Completed' },
];

export function PlannerBoard() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [unallocatedTasks, setUnallocatedTasks] = useState<Todo[]>([]);
    const [allTasks, setAllTasks] = useState<Todo[]>([]); // To calculate progress
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPlanTitle, setNewPlanTitle] = useState('');
    const [newPlanDescription, setNewPlanDescription] = useState('');
    const [isUnallocatedOpen, setIsUnallocatedOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<'plan' | 'task' | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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
    }, []);

    async function fetchData() {
        // Fetch Plans
        const { data: plansData } = await supabase.from('plans').select('*').order('created_at');
        if (plansData) setPlans((plansData as Plan[]).filter(p => p.status !== 'Archived'));

        // Fetch Todos (needed for unallocated list + progress calc)
        const { data: todosData } = await supabase
            .from('todos')
            .select(`
                *,
                todo_tags ( tag:tags (*) ),
                plan:plans (*)
            `)
            .eq('is_archived', false);

        if (todosData) {
            const formattedTodos = todosData.map((t: any) => ({
                ...t,
                tags: t.todo_tags.map((tt: any) => tt.tag).filter(Boolean)
            })) as Todo[];

            setAllTasks(formattedTodos);
            // Only show incomplete tasks in the unallocated sidebar
            setUnallocatedTasks(formattedTodos.filter(t => !t.plan_id && !t.completed));
        }
    }

    const handleCreatePlan = async () => {
        if (!newPlanTitle.trim()) return;

        const newPlan = {
            title: newPlanTitle,
            description: newPlanDescription,
            status: 'Not Started' as PlanStatus,
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
            setIsCreateModalOpen(false);
        }
    };

    // --- DnD Handlers ---
    // We are implementing simple drag from Sidebar (Task) to Plan (Project). 
    // Reordering within lists is omitted for MVP simplicity.

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        setActiveId(active.id as string);

        // Determine type based on where it came from
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

            // Optimistic Update: Update 'allTasks' to reflect the change so PlanCard stats update instantly.
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

    // Handle manual status change (e.g., from Dropdown)


    const handleUpdatePlan = async (planId: string, updates: Partial<Plan>) => {
        // Optimistic
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
        const { error } = await supabase.from('plans').update(updates).eq('id', planId);
        if (error) {
            console.error('Error updating plan:', error);
            fetchData();
        }
    };

    const handleAssignTask = async (taskId: string, planId: string) => {
        // Optimistic
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
            status: 'Today',
            completed: false
        };

        // We need the ID for optimistic update, but Supabase generates it. 
        // Best to just wait for response for creation to ensure data integrity.
        const { data, error } = await supabase.from('todos').insert([newTask]).select('*, todo_tags ( tag:tags (*) )').single();

        if (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task');
            return;
        }

        if (data) {
            const formattedTask: Todo = {
                ...data,
                tags: data.todo_tags ? data.todo_tags.map((tt: any) => tt.tag).filter(Boolean) : []
            };
            setAllTasks(prev => [...prev, formattedTask]);
        }
    };

    const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
        // Optimistic
        setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));
        setUnallocatedTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));

        const { error } = await supabase.from('todos').update({ completed: !currentStatus }).eq('id', taskId);
        if (error) {
            console.error('Error toggling task:', error);
            fetchData();
        }
    };

    const [isEditing, setIsEditing] = useState(false);

    const handleDeletePlan = async (planId: string) => {
        if (!confirm('Are you sure you want to delete this plan? This will effectively archive it.')) return;

        // Optimistic
        setPlans(prev => prev.filter(p => p.id !== planId));

        // Soft delete/Archive tasks first to preserve them
        const { error: taskError } = await supabase
            .from('todos')
            .update({ is_archived: true, plan_id: null })
            .eq('plan_id', planId);

        if (taskError) {
            console.error('Error archiving plan tasks:', taskError);
            // We continue to try deleting the plan, or should we stop? 
            // If we stop, the plan remains but tasks might be partially archived? 
            // In Supabase update is atomic for the query.
            // Let's warn but try delete.
        }

        const { error: delError } = await supabase.from('plans').delete().eq('id', planId);
        if (delError) {
            alert('Could not delete plan.');
            fetchData();
        }
    };

    const handleFlush = async () => {
        const completedPlans = plans.filter(p => p.status === 'Completed');
        const plansToArchive = completedPlans.filter(p => {
            const planTasks = allTasks.filter(t => t.plan_id === p.id);
            return planTasks.length > 0 && planTasks.every(t => t.completed);
        });

        if (plansToArchive.length === 0) {
            alert('No fully completed plans to flush.');
            return;
        }

        if (!confirm(`Flush ${plansToArchive.length} completed plans? They will be archived along with their tasks.`)) return;

        const ids = plansToArchive.map(p => p.id);

        // Optimistic
        setPlans(prev => prev.filter(p => !ids.includes(p.id)));
        setAllTasks(prev => prev.filter(t => !ids.includes(t.plan_id || '')));

        // Deep Flush: Archive associated tasks (soft delete) and decouple from plan?
        // Wait, if we archive the plan, we probably want the tasks to stay associated with it for stats?
        // But user said "Flush... effectively archives". 
        // If I decouple (plan_id=null), then the plan has no tasks technically for stats query (unless I check history).
        // Better: Keep `plan_id` BUT set `is_archived = true`.
        const { error: tasksError } = await supabase
            .from('todos')
            .update({ is_archived: true }) // Keep plan_id so we can count tasks for the archived plan later
            .in('plan_id', ids);

        if (tasksError) {
            console.error('Error archiving tasks:', tasksError);
            alert('Failed to archive associated tasks');
            fetchData();
            return;
        }

        // Archive Plans
        const { error } = await supabase
            .from('plans')
            .update({ status: 'Archived' })
            .in('id', ids);

        if (error) {
            console.error('Error archiving plans:', error);
            alert('Failed to archive plans');
            fetchData();
        } else {
            alert(`Archived ${ids.length} plans.`);
        }
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
                            <span className="sm:hidden">Tasks</span>
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">New Plan</span>
                            <span className="sm:hidden">New</span>
                        </button>
                    </div>
                </PageHeader>

                <div className="flex-1 overflow-x-hidden overflow-y-auto lg:overflow-x-auto lg:overflow-y-hidden pb-6 relative">
                    {/* Main Board: Planner Columns */}
                    <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:min-w-[800px] min-w-full pb-20 lg:pb-0">
                        {PLAN_COLUMNS.map(col => (
                            <DroppableColumn
                                key={col.status}
                                col={col}
                                plans={plans}
                                allTasks={allTasks}
                                setSelectedPlanId={setSelectedPlanId}
                                isEditing={isEditing}
                                onDeletePlan={handleDeletePlan}
                            />
                        ))}
                    </div>

                    {/* Floating Sidebar: Miscellaneous Tasks */}
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

// --- Helper Components ---

// --- Helper Components ---
// Defined here to access isEditing easily or use context. But passing props is fine.

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
    setSelectedPlanId,
    isEditing,
    onDeletePlan
}: {
    col: { title: string, status: PlanStatus },
    plans: Plan[],
    allTasks: Todo[],
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
                flex-1 min-w-[250px] h-full flex flex-col rounded-xl px-2 py-4 border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm transition-colors
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

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar px-1">
                {plans.filter(p => p.status === col.status).map(plan => {
                    const planTasks = allTasks.filter(t => t.plan_id === plan.id);
                    const completed = planTasks.filter(t => t.completed).length;

                    return (
                        <DroppablePlan
                            key={plan.id}
                            plan={plan}
                            taskCount={planTasks.length}
                            completedCount={completed}
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
    onClick,
    isEditing,
    onDelete
}: {
    plan: Plan;
    taskCount: number;
    completedCount: number;
    onClick: () => void;
    isEditing: boolean;
    onDelete: () => void;
}) {
    // Make Plan droppable (for tasks) AND draggable (for itself)
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: plan.id,
        data: { type: 'plan', plan }
    });

    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: plan.id,
        data: { type: 'plan', plan }
    });

    // Merge refs
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
                isEditing={isEditing}
                onDelete={onDelete}
            />
        </div>
    );
}


