import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    FileText,
    Loader2,
    BookOpen,
    LayoutGrid,
    ArrowRight
} from 'lucide-react';
import { useGoogleDrivePicker } from '../../hooks/useGoogleDrivePicker';
import { fetchResources, createResource } from './learningService';
import type { Resource } from './types';
import { motion } from 'framer-motion';
import type { View } from '../../layouts/AppShell';

// View Imports
import { Dashboard } from '../dashboard/Dashboard';
import { TodoBoard } from '../todo/TodoBoard';
import { PlannerBoard } from '../planner/PlannerBoard';
import { NotesBoard } from '../notes/NotesBoard';
import { StudySession } from './components/StudySession';

interface LearningWorkspaceProps {
    currentView: View;
}

export function LearningWorkspace({ currentView }: LearningWorkspaceProps) {
    // State
    const [resources, setResources] = useState<Resource[]>([]);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [isLoadingResources, setIsLoadingResources] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    console.log("DEBUG ENV:", import.meta.env.VITE_GOOGLE_API_KEY);

    // Google Drive Picker
    const { openPicker, isReady: isPickerReady } = useGoogleDrivePicker({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        developerKey: import.meta.env.VITE_GOOGLE_API_KEY || ''
    });

    // Load resources on mount
    const loadResources = useCallback(async () => {
        setIsLoadingResources(true);
        try {
            const data = await fetchResources();
            setResources(data);
        } finally {
            setIsLoadingResources(false);
        }
    }, []);

    useEffect(() => {
        loadResources();
    }, [loadResources]);

    const handleAddFromDrive = () => {
        openPicker(async (file) => {
            const newResource = await createResource({
                title: file.name,
                drive_file_id: file.id,
                drive_embed_link: file.embedUrl,
                mime_type: file.mimeType
            });

            if (newResource) {
                await loadResources();
                setSelectedResource(newResource);
            }
        });
    };

    const handleSelectResource = (resource: Resource) => {
        setSelectedResource(resource);
    };

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' ||
            (activeFilter === 'Pdfs' && r.mime_type === 'application/pdf') ||
            (activeFilter === 'Videos' && r.mime_type?.startsWith('video/')) ||
            (activeFilter === 'Links' && !r.drive_file_id); // Assuming links don't have drive IDs

        return matchesSearch && matchesFilter;
    });

    // Layout Logic
    const isLibraryView = currentView === 'library';
    const isStudyView = isLibraryView && selectedResource !== null;

    const renderMainContent = () => {
        if (isStudyView && selectedResource) {
            return (
                <StudySession
                    resource={selectedResource}
                    onClose={() => setSelectedResource(null)}
                />
            );
        }

        switch (currentView) {
            case 'dashboard':
                return <Dashboard workspace="learning" />;
            case 'planner':
                return <PlannerBoard workspace="learning" />;
            case 'tasks':
                return <TodoBoard workspace="learning" />;
            case 'notes':
                return <NotesBoard workspace="learning" />;
            case 'library':
                return (
                    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
                        {/* Library Header */}
                        <div className="p-8 pb-4 shrink-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                                        <BookOpen className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white tracking-tight">Resource Library</h1>
                                        <p className="text-slate-500 text-sm">Central repository for your learning materials.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-slate-900 border border-white/5 p-1 rounded-xl">
                                        <button className="p-2 bg-slate-800 text-white rounded-lg shadow-sm">
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-slate-500 hover:text-slate-300">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleAddFromDrive}
                                        disabled={!isPickerReady}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add from Drive
                                    </button>
                                </div>
                            </div>

                            {/* Filters & Search */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1 group">
                                    <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search your library..."
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/10">
                                    {['All', 'Pdfs', 'Videos', 'Links'].map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setActiveFilter(filter)}
                                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${activeFilter === filter
                                                ? 'bg-indigo-500/10 text-indigo-500'
                                                : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Grid Content */}
                        <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                            {isLoadingResources ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-4">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <p className="text-slate-500 animate-pulse">Syncing Library...</p>
                                </div>
                            ) : filteredResources.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                                    {filteredResources.map((resource) => (
                                        <motion.div
                                            layoutId={resource.id}
                                            key={resource.id}
                                            className="group relative bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300"
                                        >
                                            {/* Preview Placeholder */}
                                            <div className="aspect-video bg-slate-800/50 flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <FileText className="w-10 h-10 text-pink-500 group-hover:scale-110 transition-transform duration-500" />

                                                {/* Overlay badge */}
                                                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/5 text-[9px] uppercase font-bold text-slate-400">
                                                    PDF
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4">
                                                <h3 className="text-sm font-semibold text-white mb-0.5 truncate leading-tight group-hover:text-indigo-400 transition-colors">
                                                    {resource.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mb-3">
                                                    <div className="w-1 h-1 rounded-full bg-pink-500" />
                                                    <span className="text-[10px] text-slate-500 font-medium">Pdf</span>
                                                </div>

                                                <button
                                                    onClick={() => handleSelectResource(resource)}
                                                    className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 hover:bg-indigo-600 group/btn rounded-lg transition-all duration-300"
                                                >
                                                    <span className="text-[11px] font-bold text-slate-400 group-hover/btn:text-white">Start Reading</span>
                                                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/5 rounded-[40px] bg-slate-900/20">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mb-4 text-slate-600">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-1">Your library is empty</h3>
                                    <p className="text-slate-500 text-xs">Import your first PDF from Google Drive to get started.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'settings':
                return <div className="p-8 text-slate-500">Settings coming soon for Learning Workspace...</div>;
            default:
                return <Dashboard workspace="learning" />;
        }
    };

    return (
        <div className="h-full flex overflow-hidden bg-slate-950">
            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
                {renderMainContent()}
            </main>
        </div>
    );
}
