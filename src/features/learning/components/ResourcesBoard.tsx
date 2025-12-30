import { useState } from 'react';
import {
    Plus,
    Search,
    FileText,
    Loader2,
    BookOpen,
    ArrowRight,
    Trash2,
    X,
    Folder as FolderIcon,
    ChevronRight,
    Filter,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleDrivePicker } from '../../../hooks/useGoogleDrivePicker';
import { createResource, deleteResources, moveResource } from '../learningService';
import type { Resource } from '../types';
import { PageHeader } from '../../../components/PageHeader';
import { useResourceFileSystem } from '../hooks/useResourceFileSystem';

interface ResourcesBoardProps {
    onSelectResource: (resource: Resource) => void;
    workspace: string; // 'learning'
}

export function ResourcesBoard({ onSelectResource, workspace }: ResourcesBoardProps) {
    // File System Hook
    const {
        currentFolderId,
        folders,
        resources,
        breadcrumbs,
        isLoading: isLoadingFS,
        navigateTo,
        createFolder,
        refresh
    } = useResourceFileSystem();

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    // Google Drive Picker
    const { openPicker, isReady: isPickerReady } = useGoogleDrivePicker({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        developerKey: import.meta.env.VITE_GOOGLE_API_KEY || ''
    });

    const handleAddFromDrive = () => {
        openPicker(async (file) => {
            const newResource = await createResource({
                title: file.name,
                drive_file_id: file.id,
                drive_embed_link: file.embedUrl,
                mime_type: file.mimeType,
                folder_id: currentFolderId
            });

            if (newResource) {
                refresh();
            }
        });
    };

    const handleCreateFolder = async () => {
        const name = window.prompt('Enter folder name:');
        if (name && name.trim()) {
            await createFolder(name);
        }
    };

    const handleSelectForDelete = (resourceId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(resourceId)) {
            newSelected.delete(resourceId);
        } else {
            newSelected.add(resourceId);
        }
        setSelectedIds(newSelected);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;

        const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.size} resources?`);
        if (!confirmed) return;

        try {
            const success = await deleteResources(Array.from(selectedIds));
            if (success) {
                await refresh();
                setSelectedIds(new Set());
                setIsDeleteMode(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, resource: Resource) => {
        e.dataTransfer.setData('resourceId', resource.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTargetId(folderId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDropTargetId(null);
    };

    const handleDrop = async (e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        setDropTargetId(null);
        const resourceId = e.dataTransfer.getData('resourceId');

        if (resourceId) {
            const success = await moveResource(resourceId, folderId);
            if (success) {
                refresh();
            }
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' ||
            (activeFilter === 'Pdfs' && r.mime_type === 'application/pdf') ||
            (activeFilter === 'Videos' && r.mime_type?.startsWith('video/')) ||
            (activeFilter === 'Links' && !r.drive_file_id);

        return matchesSearch && matchesFilter;
    });

    const isEmerald = workspace === 'learning';

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
            <div className="px-6 pt-6 shrink-0">
                <PageHeader
                    title="Resource Library"
                    description="Central repository for your learning materials."
                    stats={[
                        { label: 'Files', value: resources.length },
                        { label: 'Folders', value: folders.length }
                    ]}
                    themeColor={isEmerald ? 'emerald' : 'indigo'}
                >
                    <div className="flex items-center gap-3">
                        {!isDeleteMode ? (
                            <>
                                {/* Search Bar */}
                                <div className="relative group mr-2">
                                    <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isEmerald ? 'text-emerald-500/50 group-focus-within:text-emerald-500' : 'text-indigo-500/50 group-focus-within:text-indigo-500'}`} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className={`w-40 focus:w-64 bg-slate-900/50 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:border-transparent transition-all ${isEmerald
                                            ? 'focus:ring-emerald-500/50'
                                            : 'focus:ring-indigo-500/50'}`}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Filters Toggle */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`p-2.5 rounded-xl transition-all border border-white/5 flex items-center gap-2
                                            ${showFilters
                                                ? isEmerald ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                        title="Filter"
                                    >
                                        <Filter className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{activeFilter === 'All' ? 'Filter' : activeFilter}</span>
                                    </button>

                                    {/* Dropdown for filters */}
                                    <AnimatePresence>
                                        {showFilters && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl p-1 shadow-xl z-50 flex flex-col min-w-[120px]"
                                            >
                                                {['All', 'Pdfs', 'Videos', 'Links'].map((filter) => (
                                                    <button
                                                        key={filter}
                                                        onClick={() => {
                                                            setActiveFilter(filter);
                                                            setShowFilters(false);
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${activeFilter === filter
                                                            ? isEmerald ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        {filter}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="h-6 w-px bg-white/10 mx-1" />

                                <button
                                    onClick={handleCreateFolder}
                                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-white/5"
                                    title="New Folder"
                                >
                                    <FolderIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsDeleteMode(true)}
                                    className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-white/5"
                                    title="Manage Resources"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleAddFromDrive}
                                    disabled={!isPickerReady}
                                    className={`flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg disabled:opacity-50 ${isEmerald
                                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                                        }`}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add from Drive
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <span className="text-xs font-bold text-red-500">{selectedIds.size} Selected</span>
                                </div>
                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={selectedIds.size === 0}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Confirm Delete
                                </button>
                                <button
                                    onClick={() => {
                                        setIsDeleteMode(false);
                                        setSelectedIds(new Set());
                                    }}
                                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-white/5"
                                    title="Cancel"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </PageHeader>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-slate-400 overflow-x-auto no-scrollbar py-2 mb-4">
                    <button
                        onClick={() => navigateTo(null)}
                        className={`hover:text-white transition-colors ${!currentFolderId ? 'text-white font-medium' : ''}`}
                    >
                        Library
                    </button>
                    {breadcrumbs.map((crumb) => (
                        <div key={crumb.id} className="flex items-center gap-2 flex-shrink-0">
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                            <button
                                onClick={() => navigateTo(crumb.id)}
                                className={`hover:text-white transition-colors ${crumb.id === currentFolderId ? 'text-white font-medium' : ''}`}
                            >
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                {isLoadingFS ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 className={`w-8 h-8 animate-spin ${isEmerald ? 'text-emerald-500' : 'text-indigo-500'}`} />
                        <p className="text-slate-500 animate-pulse">Loading...</p>
                    </div>
                ) : (
                    <>
                        {/* Folders Grid */}
                        {folders.length > 0 && !searchQuery && (
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">Folders</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {folders.map(folder => (
                                        <div
                                            key={folder.id}
                                            onClick={() => navigateTo(folder.id)}
                                            onDragOver={(e) => handleDragOver(e, folder.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, folder.id)}
                                            className={`group flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all active:scale-[0.98]
                                                ${dropTargetId === folder.id
                                                    ? `bg-slate-800 ring-2 ${isEmerald ? 'ring-emerald-500' : 'ring-indigo-500'}`
                                                    : 'bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10'
                                                }`}
                                        >
                                            <FolderIcon className={`w-5 h-5 transition-colors ${isEmerald ? 'text-emerald-500 group-hover:text-emerald-400' : 'text-indigo-500 group-hover:text-indigo-400'}`} />
                                            <span className="font-medium text-slate-300 group-hover:text-white truncate">{folder.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resources Grid */}
                        {filteredResources.length > 0 ? (
                            <div>
                                {folders.length > 0 && <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">Files</h3>}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                    {filteredResources.map((resource) => (
                                        <motion.div
                                            layoutId={resource.id}
                                            key={resource.id}
                                            draggable={!isDeleteMode}
                                            onDragStart={(e) => !isDeleteMode && handleDragStart(e as unknown as React.DragEvent, resource)}
                                            onClick={() => {
                                                if (isDeleteMode) handleSelectForDelete(resource.id);
                                                else onSelectResource(resource);
                                            }}
                                            className={`group relative bg-slate-900/40 border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer
                                                ${isDeleteMode
                                                    ? selectedIds.has(resource.id)
                                                        ? 'border-red-500 bg-red-500/5'
                                                        : 'border-white/10 hover:border-white/20'
                                                    : `border-white/5 hover:bg-slate-900/60 ${isEmerald ? 'hover:border-emerald-500/30' : 'hover:border-indigo-500/30'}`
                                                }`}
                                        >
                                            {/* Selection Checkbox */}
                                            {isDeleteMode && (
                                                <div className={`absolute top-2 right-2 z-20 w-4 h-4 rounded-full border flex items-center justify-center transition-all
                                                    ${selectedIds.has(resource.id)
                                                        ? 'bg-red-500 border-red-500'
                                                        : 'bg-black/40 border-white/20'
                                                    }`}>
                                                    {selectedIds.has(resource.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                            )}

                                            {/* Preview Placeholder */}
                                            <div className="aspect-[3/2] bg-slate-800/50 flex items-center justify-center relative overflow-hidden">
                                                <div className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${isEmerald ? 'from-emerald-500/5' : 'from-indigo-500/5'}`} />
                                                <FileText className={`w-8 h-8 transition-all duration-500 ${isDeleteMode && selectedIds.has(resource.id) ? 'text-red-500 scale-110' : 'text-pink-500 group-hover:scale-110'}`} />

                                                {/* Overlay badge */}
                                                <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/5 text-[8px] uppercase font-bold text-slate-400">
                                                    PDF
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-2.5">
                                                <h3 className={`text-xs font-semibold mb-0.5 truncate leading-tight transition-colors ${isDeleteMode && selectedIds.has(resource.id) ? 'text-red-400' : `text-slate-200 ${isEmerald ? 'group-hover:text-emerald-400' : 'group-hover:text-indigo-400'}`
                                                    }`}>
                                                    {resource.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <div className={`w-1 h-1 rounded-full ${isDeleteMode && selectedIds.has(resource.id) ? 'bg-red-500' : 'bg-pink-500'}`} />
                                                    <span className="text-[9px] text-slate-500 font-medium uppercase">Pdf</span>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isDeleteMode) handleSelectForDelete(resource.id);
                                                        else onSelectResource(resource);
                                                    }}
                                                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center justify-center gap-1.5
                                                        ${isDeleteMode
                                                            ? selectedIds.has(resource.id)
                                                                ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                                                                : 'bg-slate-800 border-white/5 text-slate-400 hover:border-red-500/50 hover:text-red-500'
                                                            : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                        }`}
                                                >
                                                    {isDeleteMode ? (
                                                        selectedIds.has(resource.id) ? 'Selected' : 'Select'
                                                    ) : (
                                                        <>
                                                            <span>Open</span>
                                                            <ArrowRight className="w-2.5 h-2.5" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : folders.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/5 rounded-[40px] bg-slate-900/20">
                                <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mb-4 text-slate-600">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <h3 className="text-white font-semibold mb-1">Folder is empty</h3>
                                <p className="text-slate-500 text-xs">Add a file or create a sub-folder to get started.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
