import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { AddResourceButton } from './components/AddResourceButton';
import { Search, FileText, Video, Link as LinkIcon, Trash2, ArrowRight, LayoutGrid, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SkillTreeBoard } from './components/SkillTreeBoard';

interface Resource {
    id: string;
    title: string;
    type: 'pdf' | 'video' | 'link' | 'article';
    external_id?: string;
    embed_link?: string;
    url?: string;
    created_at: string;
}

export function LibraryBoard() {
    const { workspace } = useWorkspace();
    const navigate = useNavigate();
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'pdf' | 'video' | 'link'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'flow'>('grid');

    useEffect(() => {
        if (viewMode === 'grid') {
            fetchResources();
        }
    }, [workspace, viewMode]);

    const fetchResources = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('workspace', workspace)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching resources:', error);
        } else {
            setResources(data as Resource[]);
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this resource?')) return;

        const { error } = await supabase.from('resources').delete().eq('id', id);
        if (error) {
            alert('Failed to delete resource');
        } else {
            setResources(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleOpen = (resource: Resource) => {
        // Special internal route for 'Study Mode'
        navigate(`/study/${resource.id}`);
    };

    const filteredResources = resources.filter(res => {
        const matchesType = filterType === 'all' || res.type === filterType || (filterType === 'link' && res.type === 'article');
        const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
            {/* Header */}
            <header className="px-6 py-4 border-b border-emerald-900/30 bg-slate-900/50 backdrop-blur-sm shadow-xl sticky top-0 z-20 shrink-0">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400">
                                <FileText size={20} />
                            </span>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">
                                    Resource Library
                                </h1>
                                <p className="text-slate-400 text-xs">
                                    Central repository for your learning materials.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                    title="Grid View"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('flow')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'flow' ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                    title="Flow View (Skill Tree)"
                                >
                                    <Network size={18} />
                                </button>
                            </div>

                            {/* Only show Add Button here in Grid mode, as Flow mode has its own */}
                            {viewMode === 'grid' && (
                                <AddResourceButton onResourceAdded={(newRes) => setResources(prev => [newRes, ...prev])} />
                            )}
                        </div>
                    </div>

                    {/* Toolbar: Search & Filter (Only in Grid Mode) */}
                    {viewMode === 'grid' && (
                        <div className="flex items-center gap-4 mt-1 ml-12 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search resources..."
                                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600 transition-all"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                                {(['all', 'pdf', 'video', 'link'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`
                                            px-3 py-1 rounded-md text-[11px] font-medium capitalize transition-all
                                            ${filterType === type
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        {type === 'all' ? 'All' : type + 's'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-hidden relative">
                {viewMode === 'flow' ? (
                    <div className="absolute inset-0 z-0">
                        <SkillTreeBoard />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-emerald-900/30 scrollbar-track-transparent">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="animate-spin text-emerald-500">
                                    <FileText size={32} />
                                </div>
                            </div>
                        ) : filteredResources.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                                <FileText size={64} className="mb-4 text-slate-700" />
                                <p className="text-lg font-medium">No resources found.</p>
                                <p className="text-sm">Try adding some from Google Drive!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredResources.map(resource => (
                                    <div
                                        key={resource.id}
                                        onClick={() => handleOpen(resource)}
                                        className="group relative bg-slate-900/40 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-300 hover:bg-slate-800/60 hover:shadow-2xl hover:shadow-emerald-900/10 cursor-pointer flex flex-col gap-3 group/card"
                                    >
                                        {/* Icon / Thumbnail Area */}
                                        <div className="aspect-video bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-slate-700 transition-colors relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {resource.type === 'pdf' ? (
                                                <FileText size={40} className="text-rose-500 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                                            ) : resource.type === 'video' ? (
                                                <Video size={40} className="text-sky-500 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                                            ) : (
                                                <LinkIcon size={40} className="text-amber-500 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-slate-200 truncate group-hover:text-emerald-400 transition-colors" title={resource.title}>
                                                    {resource.title}
                                                </h3>
                                                <button
                                                    onClick={(e) => handleDelete(resource.id, e)}
                                                    className="text-slate-600 hover:text-rose-400 p-1 rounded-md opacity-0 group-hover/card:opacity-100 transition-opacity"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 capitalize mt-1 flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${resource.type === 'pdf' ? 'bg-rose-500' : resource.type === 'video' ? 'bg-sky-500' : 'bg-amber-500'}`} />
                                                {resource.type}
                                            </p>
                                        </div>

                                        {/* Footer Action */}
                                        <div className="mt-2 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-emerald-400/80 transition-colors">
                                            <span>Study Mode</span>
                                            <ArrowRight size={14} className="-ml-1 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
