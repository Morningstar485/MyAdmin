import { useState, useEffect } from 'react';
import type { Plan, Todo } from '../../todo/types';
import { Modal } from '../../../components/Modal';
import { TaskCard } from '../../todo/components/TaskCard';
import { Clock, Target, CheckCircle2, Plus, Save } from 'lucide-react';
import { RichTextEditor } from '../../notes/components/RichTextEditor';

interface PlanDetailsModalProps {
    plan: Plan | null;
    tasks: Todo[];
    unallocatedTasks: Todo[];
    isOpen: boolean;
    onClose: () => void;
    onUpdatePlan: (planId: string, updates: Partial<Plan>) => void;
    onAssignTask: (taskId: string, planId: string) => void;
    onCreateTask: (title: string, planId: string) => void;
    onToggleTask: (taskId: string, currentStatus: boolean) => void;
}

export function PlanDetailsModal({
    plan,
    tasks,
    unallocatedTasks,
    isOpen,
    onClose,
    onUpdatePlan,
    onAssignTask,
    onCreateTask,
    onToggleTask
}: PlanDetailsModalProps) {
    const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
    const [description, setDescription] = useState('');
    const [showAddTask, setShowAddTask] = useState(false); // 'existing' | 'new' | null (simplified to boolean for dropdown vs input?)
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [activeTab, setActiveTab] = useState<'existing' | 'new'>('new');

    useEffect(() => {
        if (plan) {
            setDescription(plan.description || '');
        }
    }, [plan?.id, plan?.description]);

    if (!plan) return null;

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    const handleSaveDescription = () => {
        onUpdatePlan(plan.id, { description });
        setIsDescriptionEditing(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={plan.title} maxWidth="max-w-4xl">
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="flex gap-4 flex-wrap">
                    <div className="relative">
                        <select
                            value={plan.status}
                            onChange={(e) => onUpdatePlan(plan.id, { status: e.target.value as any })}
                            className={`
                                appearance-none pl-8 pr-8 py-1.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer
                                ${plan.status === 'Not Started' ? 'bg-slate-800 text-slate-300 border-slate-700' : ''}
                                ${plan.status === 'Going On' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : ''}
                                ${plan.status === 'Stuck' ? 'bg-red-500/10 text-red-300 border-red-500/20' : ''}
                                ${plan.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : ''}
                            `}
                        >
                            <option value="Not Started">Not Started</option>
                            <option value="Going On">Going On</option>
                            <option value="Stuck">Stuck</option>
                            <option value="Completed">Completed</option>
                        </select>
                        <Target size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none" />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m1 1 4 4 4-4" /></svg>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-sm font-medium flex items-center gap-2">
                        <Clock size={16} />
                        Created {new Date(plan.created_at).toLocaleDateString()}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 group">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Description</h4>
                        {!isDescriptionEditing ? (
                            <button onClick={() => setIsDescriptionEditing(true)} className="text-xs text-indigo-400 hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                Edit
                            </button>
                        ) : (
                            <button onClick={handleSaveDescription} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                <Save size={12} /> Save
                            </button>
                        )}
                    </div>

                    {isDescriptionEditing ? (
                        <RichTextEditor content={description} onChange={setDescription} />
                    ) : (
                        <div
                            className="prose prose-invert prose-sm max-w-none text-slate-200"
                            dangerouslySetInnerHTML={{ __html: plan.description || '<p class="text-slate-500 italic">No description provided.</p>' }}
                        />
                    )}
                </div>

                {/* Progress */}
                <div>
                    <div className="flex justify-between text-sm mb-2 text-slate-400">
                        <span>Progress</span>
                        <span className="font-semibold text-indigo-400">{progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Tasks List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            Tasks ({completedCount}/{tasks.length})
                        </h4>
                        <button
                            onClick={() => setShowAddTask(!showAddTask)}
                            className="text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors"
                        >
                            <Plus size={14} /> Add Task
                        </button>
                    </div>

                    {showAddTask && (
                        <div className="mb-4 p-4 bg-slate-800 rounded-xl border border-slate-700 animate-in slide-in-from-top-2">
                            <div className="flex gap-4 mb-4 border-b border-slate-700 pb-2">
                                <button
                                    onClick={() => setActiveTab('new')}
                                    className={`text-sm font-medium pb-1 px-1 transition-colors ${activeTab === 'new' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Create New
                                </button>
                                <button
                                    onClick={() => setActiveTab('existing')}
                                    className={`text-sm font-medium pb-1 px-1 transition-colors ${activeTab === 'existing' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Link Existing
                                </button>
                            </div>

                            {activeTab === 'new' ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="New task title..."
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newTaskTitle.trim()) {
                                                onCreateTask(newTaskTitle, plan.id);
                                                setNewTaskTitle('');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newTaskTitle.trim()) {
                                                onCreateTask(newTaskTitle, plan.id);
                                                setNewTaskTitle('');
                                            }
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                    >
                                        Create
                                    </button>
                                </div>
                            ) : (
                                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {unallocatedTasks.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic p-2">No unallocated tasks available.</p>
                                    ) : (
                                        unallocatedTasks.map(task => (
                                            <button
                                                key={task.id}
                                                onClick={() => onAssignTask(task.id, plan.id)}
                                                className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-slate-700 group transition-colors"
                                            >
                                                <span className="text-sm text-slate-300 group-hover:text-white truncate">{task.title}</span>
                                                <Plus size={14} className="text-slate-500 group-hover:text-indigo-400" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {tasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {tasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    todo={task}
                                    onToggle={() => onToggleTask(task.id, task.completed)}
                                    isEditing={false}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                            No tasks assigned to this plan yet.
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
