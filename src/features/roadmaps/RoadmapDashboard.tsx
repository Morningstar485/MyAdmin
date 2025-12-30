import { useState, useEffect } from 'react';
import { Plus, Loader2, ArrowRight, Map as MapIcon, X } from 'lucide-react';
import { fetchRoadmaps, createRoadmap } from '../../services/roadmapService';
import type { Roadmap } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../components/PageHeader';

export function RoadmapDashboard({ onSelectRoadmap, workspace = 'learning' }: { onSelectRoadmap: (id: string) => void, workspace?: string }) {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isEmerald = workspace === 'learning';

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const loadRoadmaps = async () => {
        try {
            setLoading(true);
            const data = await fetchRoadmaps();
            setRoadmaps(data);
        } catch (err) {
            setError('Failed to load roadmaps. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoadmaps();
    }, []);

    const handleCreateRoadmap = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            setIsCreating(true);
            const created = await createRoadmap(newTitle, newDescription);
            if (created) {
                setNewTitle('');
                setNewDescription('');
                setIsModalOpen(false);
                await loadRoadmaps();
            }
        } finally {
            setIsCreating(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex-1 min-h-screen bg-slate-950 px-6 pt-6 overflow-y-auto">
            <div>
                <PageHeader
                    title="My Learning Roadmaps"
                    description="Your personalized paths to mastery."
                    stats={[{ label: 'Total', value: roadmaps.length }]}
                    themeColor={isEmerald ? 'emerald' : 'indigo'}
                >
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={`flex items-center gap-2 text-white px-6 py-3 rounded-2xl font-semibold transition-all shadow-lg active:scale-95 ${isEmerald
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                            }`}
                    >
                        <Plus size={20} />
                        <span>New Roadmap</span>
                    </button>
                </PageHeader>


                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <Loader2 className="animate-spin text-indigo-500" size={40} />
                        <p className="text-slate-500 animate-pulse">Mapping your journey...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                        <p className="text-red-400 font-medium">{error}</p>
                    </div>
                ) : roadmaps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/40 border border-dashed border-white/10 rounded-3xl">
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                            <MapIcon className="text-slate-600" size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No roadmaps found</h2>
                        <p className="text-slate-500 max-w-sm mb-8">
                            Start your learning journey by creating your first roadmap.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                        >
                            Create First Roadmap
                        </button>
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    >
                        {roadmaps.map((roadmap) => (
                            <RoadmapCard
                                key={roadmap.id}
                                roadmap={roadmap}
                                variants={item}
                                onSelect={() => onSelectRoadmap(roadmap.id)}
                                isEmerald={isEmerald}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Create Roadmap Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-white">Create Roadmap</h2>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateRoadmap} className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Roadmap Title</label>
                                        <input
                                            autoFocus
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="e.g. Master React Native in 3 months"
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Description (Optional)</label>
                                        <textarea
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                            placeholder="What's the goal of this journey?"
                                            rows={3}
                                            className="w-full bg-slate-950 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                        />
                                    </div>
                                    <button
                                        disabled={isCreating || !newTitle.trim()}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                <span>Creating Path...</span>
                                            </>
                                        ) : (
                                            <span>Create Roadmap</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function RoadmapCard({ roadmap, variants, onSelect, isEmerald }: { roadmap: Roadmap, variants: any, onSelect: () => void, isEmerald: boolean }) {
    // Calculate progress from real data
    const progress = roadmap.total_tasks && roadmap.total_tasks > 0
        ? Math.round((roadmap.completed_tasks! / roadmap.total_tasks) * 100)
        : 0;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'active':
                return isEmerald
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'paused':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        if (status === 'active') return 'In Progress';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <motion.div
            variants={variants}
            className={`group relative bg-slate-900/60 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl flex flex-col h-full ${isEmerald
                ? 'hover:border-emerald-500/50 hover:shadow-emerald-500/10'
                : 'hover:border-indigo-500/50 hover:shadow-indigo-500/10'
                }`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl ${isEmerald
                ? 'from-emerald-600/5'
                : 'from-indigo-600/5'
                }`} />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${getStatusStyles(roadmap.status)}`}>
                        {getStatusLabel(roadmap.status)}
                    </span>
                    <div className={`p-1.5 rounded-lg bg-slate-800 text-slate-400 transition-colors ${isEmerald
                        ? 'group-hover:text-emerald-400'
                        : 'group-hover:text-indigo-400'
                        }`}>
                        <MapIcon size={16} />
                    </div>
                </div>

                <h3 className={`text-lg font-bold text-white mb-2 transition-colors line-clamp-1 ${isEmerald
                    ? 'group-hover:text-emerald-400'
                    : 'group-hover:text-indigo-400'
                    }`}>
                    {roadmap.title}
                </h3>

                <p className="text-slate-400 text-xs mb-4 line-clamp-2 min-h-[32px]">
                    {roadmap.description || 'No description provided for this learning journey.'}
                </p>

                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                        <span className="text-xs font-bold text-white tracking-tight">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r rounded-full ${isEmerald
                                ? 'from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                : 'from-indigo-600 to-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.5)]'
                                }`}
                        />
                    </div>

                    <button
                        onClick={onSelect}
                        className={`w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-200 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all duration-300 group/btn ${isEmerald
                            ? 'hover:bg-emerald-600'
                            : 'hover:bg-indigo-600'
                            }`}
                    >
                        Continue Journey
                        <ArrowRight size={14} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
