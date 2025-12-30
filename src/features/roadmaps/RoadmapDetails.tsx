import { useState, useEffect } from 'react';
import { ChevronLeft, Search, FileText, List, GripVertical, ChevronDown, ChevronRight, CheckCircle2, Circle, Plus, X, Loader2, Link as LinkIcon, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { fetchRoadmapById, fetchMilestonesForRoadmap, updateRoadmapItem, createMilestone, createRoadmapItem, fetchLibraryResources } from '../../services/roadmapService';
import type { Roadmap, MilestoneWithItems, RoadmapItem } from './types';
import type { Resource } from '../learning/types';
import { motion, AnimatePresence } from 'framer-motion';

interface RoadmapDetailsProps {
    roadmapId: string;
    onBack: () => void;
}

export function RoadmapDetails({ roadmapId, onBack }: RoadmapDetailsProps) {
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [milestones, setMilestones] = useState<MilestoneWithItems[]>([]);
    const [libraryResources, setLibraryResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // UI State for adding milestones/tasks
    const [isAddingMilestone, setIsAddingMilestone] = useState(false);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
    const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);

    const loadData = async () => {
        const [roadmapData, milestonesData, resourcesData] = await Promise.all([
            fetchRoadmapById(roadmapId),
            fetchMilestonesForRoadmap(roadmapId),
            fetchLibraryResources()
        ]);

        setRoadmap(roadmapData);
        setMilestones(milestonesData);
        setLibraryResources(resourcesData);

        // Auto-expand the first milestone if it's the first load
        if (loading && milestonesData.length > 0) {
            setExpandedMilestones(new Set([milestonesData[0].id]));
        }
    };

    useEffect(() => {
        async function init() {
            setLoading(true);
            await loadData();
            setLoading(false);
        }
        init();
    }, [roadmapId]);

    const toggleMilestone = (id: string) => {
        const newExpanded = new Set(expandedMilestones);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedMilestones(newExpanded);
    };

    const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
        const updated = await updateRoadmapItem(itemId, { is_completed: isCompleted });
        if (updated) {
            await loadData(); // Refresh to get updated progress in headers
        }
    };

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMilestoneTitle.trim()) return;

        setIsCreatingMilestone(true);
        const created = await createMilestone(roadmapId, newMilestoneTitle, milestones.length);
        if (created) {
            setNewMilestoneTitle('');
            setIsAddingMilestone(false);
            await loadData();
            setExpandedMilestones(prev => new Set([...prev, created.id]));
        }
        setIsCreatingMilestone(false);
    };

    const handleAddTask = async (milestoneId: string, title: string) => {
        const milestone = milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        const orderIndex = milestone.roadmap_items.length;
        const created = await createRoadmapItem(milestoneId, title, orderIndex);
        if (created) {
            await loadData();
        }
    };

    const handleAssignResource = async (itemId: string, resourceId: string) => {
        const updated = await updateRoadmapItem(itemId, { resource_id: resourceId });
        if (updated) {
            await loadData();
        }
    };

    // Drag and Drop handlers for resources
    const onDragStart = (e: React.DragEvent, resourceId: string) => {
        e.dataTransfer.setData('resourceId', resourceId);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                    <p className="text-slate-500 text-sm animate-pulse font-medium">Loading your journey...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* Header */}
            <header className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            {roadmap?.title || 'Roadmap Details'}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">

                            <span className={`text-[10px] font-bold uppercase tracking-widest ${roadmap?.status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                                }`}>
                                {roadmap?.status || 'Active'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddingMilestone(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        <span>Add Milestone</span>
                    </button>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2.5 rounded-xl border transition-all active:scale-95 flex items-center gap-2 ${isSidebarOpen
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        title={isSidebarOpen ? "Hide Library" : "Show Library"}
                    >
                        {isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                        <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Library</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Panel: Roadmap Timeline (On the Left) */}
                <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
                    <div className="p-8 max-w-4xl mx-auto w-full">
                        <AnimatePresence>
                            {isAddingMilestone && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-6 overflow-hidden"
                                >
                                    <form onSubmit={handleAddMilestone} className="bg-slate-900/60 border border-emerald-500/30 rounded-[32px] p-4 flex items-center gap-4 shadow-2xl shadow-emerald-500/10">
                                        <input
                                            autoFocus
                                            value={newMilestoneTitle}
                                            onChange={(e) => setNewMilestoneTitle(e.target.value)}
                                            placeholder="e.g. Fundamental Concepts"
                                            className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={isCreatingMilestone || !newMilestoneTitle.trim()}
                                            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isCreatingMilestone ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : (
                                                <span>Create</span>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingMilestone(false)}
                                            className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
                                        >
                                            <X size={18} />
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {milestones.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/40 border border-dashed border-white/10 rounded-3xl">
                                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                                    <List className="text-slate-600" size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Build your timeline</h3>
                                <p className="text-slate-500 max-w-sm mb-8">
                                    Add milestones and drag resources from your library to organize your learning path.
                                </p>
                                <button
                                    onClick={() => setIsAddingMilestone(true)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                                >
                                    Add First Milestone
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {milestones.map((milestone, index) => (
                                    <MilestoneAccordion
                                        key={milestone.id}
                                        milestone={milestone}
                                        index={index}
                                        isExpanded={expandedMilestones.has(milestone.id)}
                                        onToggle={() => toggleMilestone(milestone.id)}
                                        onToggleItem={handleToggleItem}
                                        onAddTask={handleAddTask}
                                        onAssignResource={handleAssignResource}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Panel: Library (Resources) */}
                <AnimatePresence initial={false}>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="border-l border-white/5 flex flex-col bg-slate-900/20 shrink-0 overflow-hidden"
                        >
                            <div className="p-6 flex-1 overflow-y-auto min-w-[280px]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                                        Library
                                    </h3>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                                    >
                                        <PanelRightClose size={18} />
                                    </button>
                                </div>
                                <div className="relative mb-6">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        type="text"
                                        placeholder="Search library..."
                                        className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    {libraryResources.length === 0 ? (
                                        <div className="py-10 text-center">
                                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No resources found</p>
                                        </div>
                                    ) : (
                                        libraryResources.map(res => (
                                            <div
                                                key={res.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, res.id)}
                                                className="p-3 bg-slate-900/40 border border-white/5 rounded-xl flex items-center gap-3 group cursor-grab active:cursor-grabbing hover:border-emerald-500/30 hover:bg-slate-800/40 transition-all"
                                            >
                                                <GripVertical size={14} className="text-slate-700 group-hover:text-slate-500" />
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                                                    <FileText size={16} className="text-emerald-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-slate-300 truncate font-medium">{res.title}</p>
                                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{res.type || 'Resource'}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function MilestoneAccordion({
    milestone,
    index,
    isExpanded,
    onToggle,
    onToggleItem,
    onAddTask,
    onAssignResource
}: {
    milestone: MilestoneWithItems;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
    onToggleItem: (id: string, completed: boolean) => Promise<void>;
    onAddTask: (milestoneId: string, title: string) => Promise<void>;
    onAssignResource: (itemId: string, resourceId: string) => Promise<void>;
}) {
    const itemsCount = milestone.roadmap_items.length;
    const completedItems = milestone.roadmap_items.filter(i => i.is_completed).length;

    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (itemsCount > 0 && completedItems === itemsCount) {
        status = 'completed';
    } else if (completedItems > 0) {
        status = 'in_progress';
    }

    const isCompleted = status === 'completed';

    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItemTitle, setNewItemTitle] = useState('');

    const handleAddItemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemTitle.trim()) return;
        await onAddTask(milestone.id, newItemTitle);
        setNewItemTitle('');
        setIsAddingItem(false);
    };

    return (
        <div className={`overflow-hidden rounded-[20px] border transition-all duration-300 ${isExpanded
            ? 'bg-slate-900/40 border-emerald-500/30 shadow-xl shadow-emerald-500/5'
            : 'bg-slate-900/20 border-white/20 hover:border-white/30'
            }`}>
            <div className="w-full flex items-center justify-between p-3 px-4 group">
                <button
                    onClick={onToggle}
                    className="flex-1 flex items-center text-left gap-3"
                >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border transition-all duration-300 ${isCompleted
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-800/50 text-slate-400 border-white/5'
                        }`}>
                        {isCompleted ? <CheckCircle2 size={14} /> : index + 1}
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold tracking-tight transition-colors duration-300 ${isExpanded ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            Milestone {index + 1}: {milestone.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-px rounded-md border ${status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                                : status === 'in_progress'
                                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/10'
                                    : 'bg-slate-800/50 text-slate-500 border-white/5'
                                }`}>
                                {status === 'completed' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Not Started'}
                            </span>

                            {/* Visual Progress Bar */}
                            <div className="flex items-center gap-2" title={`${completedItems}/${itemsCount} Tasks Completed`}>
                                <div className="w-16 h-1 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${itemsCount > 0 ? (completedItems / itemsCount) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </button>

                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAddingItem(true);
                            if (!isExpanded) onToggle();
                        }}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                    >
                        <Plus size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Add Task</span>
                    </button>
                    <button
                        onClick={onToggle}
                        className={`p-1.5 rounded-lg transition-all duration-300 ${isExpanded ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-600 group-hover:text-slate-400'}`}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="px-7 pb-4 pt-0">
                            {milestone.description && (
                                <p className="text-sm text-slate-400 mb-6 bg-slate-950/40 p-4 rounded-2xl border border-white/5 leading-relaxed">
                                    {milestone.description}
                                </p>
                            )}

                            <div className="space-y-2">
                                {milestone.roadmap_items.map((item) => (
                                    <RoadmapItemRow
                                        key={item.id}
                                        item={item}
                                        onToggle={() => onToggleItem(item.id, !item.is_completed)}
                                        onDrop={(resourceId) => onAssignResource(item.id, resourceId)}
                                    />
                                ))}

                                {isAddingItem && (
                                    <form onSubmit={handleAddItemSubmit} className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-xl border border-emerald-500/20 shadow-xl shadow-emerald-500/5 mt-2">
                                        <input
                                            autoFocus
                                            value={newItemTitle}
                                            onChange={(e) => setNewItemTitle(e.target.value)}
                                            placeholder="What needs to be done?"
                                            className="flex-1 bg-transparent border-none text-sm text-slate-200 focus:outline-none placeholder:text-slate-700 px-3 py-1"
                                        />
                                        <button
                                            type="submit"
                                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 bg-emerald-500/10 rounded-lg transition-colors"
                                        >
                                            Add
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingItem(false)}
                                            className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function RoadmapItemRow({ item, onToggle, onDrop }: { item: RoadmapItem, onToggle: () => void, onDrop: (resourceId: string) => void }) {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const resourceId = e.dataTransfer.getData('resourceId');
        if (resourceId) {
            onDrop(resourceId);
        }
    };

    return (

        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all duration-300 group ${isOver
                ? 'bg-emerald-500/10 border-emerald-500 scale-[1.02]'
                : item.is_completed
                    ? 'bg-slate-950/40 border-white/20 opacity-80'
                    : 'bg-slate-950/60 border-white/20 hover:border-emerald-500/20 hover:bg-slate-950/80'
                }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggle}
                        className={`transition-all duration-300 p-1 rounded-lg ${item.is_completed ? 'text-emerald-500 hover:scale-110' : 'text-slate-700 hover:text-emerald-400'
                            }`}>
                        {item.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <span className={`text-sm font-medium transition-all duration-300 ${item.is_completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {item.title}
                    </span>
                </div>
                {item.resources && (
                    <div className={`p-1 rounded-md transition-colors ${item.is_completed ? 'bg-emerald-500/5 text-emerald-500/50' : 'bg-slate-800 text-emerald-400 border border-emerald-500/20'}`}>
                        <LinkIcon size={14} />
                    </div>
                )}
            </div>

            {/* Attached Resource Badge */}
            {item.resources && (
                <div className="ml-10 flex items-center">
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-900 border border-emerald-500/20 rounded-md shadow-sm">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-wider truncate max-w-[200px]">
                            {item.resources.title}
                        </span>
                        <div className="text-[8px] bg-slate-800 text-slate-500 px-1 rounded font-black tracking-tighter uppercase">
                            {item.resources.type || 'PDF'}
                        </div>
                    </div>
                </div>
            )}

            {/* Drop Indicator */}
            {isOver && !item.resources && (
                <div className="ml-10 border-2 border-dashed border-emerald-500/30 rounded-lg py-1.5 flex items-center justify-center gap-2">
                    <LinkIcon size={12} className="text-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Release to assign</span>
                </div>
            )}
        </div>
    );
}
