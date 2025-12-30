import { useState, useEffect } from 'react';
import { Map, Plus, ChevronRight, Clock, Search, X, Loader2, Trash2 } from 'lucide-react';
import { fetchRoadmaps, createRoadmap, deleteRoadmap } from '../roadmapService';
import type { Roadmap } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export function RoadmapBoard({ }: { workspace: string }) {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const loadRoadmaps = async () => {
        setLoading(true);
        const data = await fetchRoadmaps();
        setRoadmaps(data);
        setLoading(false);
    };

    useEffect(() => {
        loadRoadmaps();
    }, []);

    const handleDeleteRoadmap = async (e: React.MouseEvent, id: string, title: string) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete the "${title}" roadmap? This will delete all its milestones and tasks.`)) {
            return;
        }

        setIsDeleting(id);
        try {
            const success = await deleteRoadmap(id);
            if (success) {
                setRoadmaps(prev => prev.filter(r => r.id !== id));
            }
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredRoadmaps = roadmaps.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
            <div className="p-8 pb-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                            <Map className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Your Roadmaps</h1>
                            <p className="text-slate-500 text-sm">Organized paths to master your subjects.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Roadmap
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                        type="text"
                        placeholder="Search your roadmaps..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-slate-500 animate-pulse">Syncing Roadmaps...</p>
                    </div>
                ) : filteredRoadmaps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRoadmaps.map((roadmap) => (
                            <motion.div
                                layoutId={roadmap.id}
                                key={roadmap.id}
                                className="group bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all cursor-pointer relative"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${roadmap.status === 'active' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                        {roadmap.status}
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteRoadmap(e, roadmap.id, roadmap.title)}
                                        disabled={isDeleting === roadmap.id}
                                        className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all"
                                    >
                                        {isDeleting === roadmap.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                    {roadmap.title}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-2 mb-6">
                                    {roadmap.description || 'No description provided.'}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Clock size={14} />
                                            <span>Just now</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                            <Map className="w-10 h-10 text-slate-700" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">No Roadmaps Yet</h2>
                        <p className="text-slate-500 max-w-sm mb-8">
                            Create your first learning roadmap to track your progress and master new skills.
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20"
                        >
                            Create a Roadmap
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateRoadmapModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={() => {
                            setIsCreateModalOpen(false);
                            loadRoadmaps();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function CreateRoadmapModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || loading) return;

        setLoading(true);
        try {
            const result = await createRoadmap({ title, description });
            if (result) onSuccess();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">New Roadmap</h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Title
                        </label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g., Master React & Next.js"
                            className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            placeholder="What's your goal for this roadmap?"
                            className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[100px] resize-none"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-400 hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            Create Roadmap
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
