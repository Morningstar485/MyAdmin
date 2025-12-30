import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { useFileSystem } from './hooks/useFileSystem';
import { Modal } from '../../components/Modal';
import { RichTextEditor } from './components/RichTextEditor';
import { supabase } from '../../lib/supabase';
import type { Note } from './types';
import { Folder as FolderIcon, FileText, ChevronRight, Pencil, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { NoteCard } from './components/NoteCard';

export function NotesBoard({ workspace: workspaceProp }: { workspace?: string }) {
    const { workspace: workspaceContext } = useWorkspace();
    const workspace = workspaceProp || workspaceContext;

    // 1. File System Hook
    const {
        currentFolderId,
        folders,
        notes,
        breadcrumbs,
        isLoading,
        navigateTo,
        createFolder,
        refresh
    } = useFileSystem(workspace); // Pass workspace to hook

    // 2. Local State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isEditingMode, setIsEditingMode] = useState(false); // Read-only vs Edit toggle
    const [isCompactMode, setIsCompactMode] = useState(false);

    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');

    // For Folders
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Reset state when modal closes
    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setEditingNote(null);
        setNoteTitle('');
        setNoteContent('');
        setIsEditingMode(false);
    };

    const handleOpenNote = (note: Note) => {
        setEditingNote(note);
        setNoteTitle(note.title);
        setNoteContent(note.content);
        setIsEditingMode(false); // Default to Read Only
        setIsCreateModalOpen(true);
    };

    const handleCreateNote = () => {
        setEditingNote(null);
        setNoteTitle('');
        setNoteContent('');
        setIsEditingMode(true); // New notes are editable
        setIsCreateModalOpen(true);
    };

    const handleSaveNote = async () => {
        if (!noteTitle.trim()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (editingNote) {
                // Update
                const { error } = await supabase
                    .from('notes')
                    .update({
                        title: noteTitle,
                        content: noteContent,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingNote.id);

                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('notes')
                    .insert([{
                        title: noteTitle,
                        content: noteContent,
                        is_pinned: false,
                        folder_id: currentFolderId,
                        user_id: user.id,
                        workspace // Inject Workspace
                    }]);

                if (error) throw error;
            }

            refresh();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note');
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) throw error;
            refresh();
            handleCloseModal(); // In case we delete from within modal (if we add that button)
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Failed to delete note');
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        await createFolder(newFolderName);
        setNewFolderName('');
        setIsFolderModalOpen(false);
    };

    // Calculate Grid Stats?
    // Not really needed for Notes, but easy enough.

    // Theme Logic
    const themeColor = workspace === 'learning' ? 'emerald' : 'indigo';
    const isEmerald = themeColor === 'emerald';

    return (
        <div className="h-full flex flex-col px-6 pt-6 overflow-hidden bg-slate-950">
            <PageHeader
                title="My Notes"
                description="Capture ideas and organize your thoughts."
                stats={[
                    { label: 'Notes', value: notes.length },
                    { label: 'Folders', value: folders.length }
                ]}
                themeColor={themeColor}
            >
                <button
                    onClick={() => setIsFolderModalOpen(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800`}
                >
                    + New Folder
                </button>
                <button
                    onClick={handleCreateNote}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${isEmerald
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                        }`}
                >
                    + New Note
                </button>
            </PageHeader>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-8 text-sm text-slate-500 overflow-x-auto pb-2 shrink-0">
                <button
                    onClick={() => navigateTo(null)}
                    className={`hover:text-white transition-colors ${!currentFolderId ? (isEmerald ? 'text-emerald-400 font-bold' : 'text-indigo-400 font-bold') : ''}`}
                >
                    Home
                </button>
                {breadcrumbs.map((crumb) => (
                    <div key={crumb.id} className="flex items-center gap-2">
                        <ChevronRight size={14} className="text-slate-700" />
                        <button
                            onClick={() => navigateTo(crumb.id)}
                            className={`hover:text-white transition-colors ${crumb.id === currentFolderId ? (isEmerald ? 'text-emerald-400 font-bold' : 'text-indigo-400 font-bold') : ''}`}
                        >
                            {crumb.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40 text-slate-600">
                        <Loader2 className="animate-spin text-slate-700" size={24} />
                    </div>
                ) : (
                    <>
                        {/* Folders Section */}
                        {folders.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-1">Folders</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {folders.map(folder => (
                                        <button
                                            key={folder.id}
                                            onClick={() => navigateTo(folder.id)}
                                            className={`group flex items-center gap-3 p-4 bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-slate-800 hover:border-white/10 cursor-pointer transition-all active:scale-[0.98] w-full text-left`}
                                        >
                                            <FolderIcon
                                                className={`w-5 h-5 transition-colors ${isEmerald
                                                    ? 'text-emerald-500 group-hover:text-emerald-400'
                                                    : 'text-indigo-500 group-hover:text-indigo-400'}`}
                                            />
                                            <span className="font-medium text-slate-300 group-hover:text-white truncate">{folder.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4 pl-1">
                                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Notes</h3>
                                <span className="text-[10px] font-bold text-slate-700 bg-slate-900 px-2 py-1 rounded-full border border-white/5">
                                    {notes.length}
                                </span>
                            </div>

                            {notes.length === 0 && folders.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-slate-800/50 rounded-3xl bg-slate-900/20">
                                    <div className="p-5 bg-slate-900 rounded-2xl mb-4 border border-white/5">
                                        <FileText size={40} className="text-slate-700" />
                                    </div>
                                    <p className="text-slate-500 font-medium mb-1">It's quiet here...</p>
                                    <p className="text-xs text-slate-600 mb-6">Create a note to get started.</p>
                                    <button
                                        onClick={handleCreateNote}
                                        className={`text-sm font-bold hover:underline transition-colors ${isEmerald ? 'text-emerald-400' : 'text-indigo-400'}`}
                                    >
                                        Create your first note
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                {notes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onClick={() => handleOpenNote(note)}
                                        onDelete={() => handleDeleteNote(note.id)}
                                        themeColor={themeColor}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Note Editor Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                maxWidth={isCompactMode ? 'max-w-xl' : 'max-w-5xl'}
                centerTitle
                title={
                    <span className="truncate text-lg font-bold text-slate-100">
                        {isEditingMode
                            ? (editingNote ? 'Edit Note' : 'New Note')
                            : (editingNote?.title || 'Untitled Note')
                        }
                    </span>
                }
                headerAction={
                    <>
                        <button
                            onClick={() => setIsCompactMode(!isCompactMode)}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                            title={isCompactMode ? "Expand View" : "Compact View"}
                        >
                            {isCompactMode ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                        </button>
                        {editingNote && (
                            <button
                                onClick={() => setIsEditingMode(!isEditingMode)}
                                className={`p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${isEditingMode
                                    ? isEmerald ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                                    }`}
                                title={isEditingMode ? "Finish Editing" : "Edit Note"}
                            >
                                <Pencil size={14} />
                                <span className="hidden sm:inline">{isEditingMode ? 'Editing' : 'Edit'}</span>
                            </button>
                        )}
                    </>
                }
            >
                <div className="flex flex-col h-[70vh]">
                    {isEditingMode && (
                        <input
                            type="text"
                            placeholder="Note Title"
                            className="bg-transparent text-2xl font-bold text-white border-none focus:ring-0 px-0 mb-4 placeholder:text-slate-700"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            autoFocus={!editingNote}
                        />
                    )}

                    <div className="flex-1 overflow-hidden bg-slate-950/30 rounded-2xl border border-white/5">
                        <RichTextEditor
                            content={noteContent}
                            onChange={setNoteContent}
                            editable={isEditingMode}
                            isExpanded={true}
                        />
                    </div>

                    {isEditingMode && (
                        <div className="flex justify-end gap-3 pt-6 shrink-0">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNote}
                                className={`text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${isEmerald
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                                    }`}
                            >
                                Save Note
                            </button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* New Folder Modal */}
            <Modal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                title="Create New Folder"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Folder Name"
                        className={`w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 ${isEmerald ? 'focus:ring-emerald-500/50' : 'focus:ring-indigo-500/50'
                            }`}
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setIsFolderModalOpen(false)}
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateFolder}
                            className={`text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${isEmerald
                                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                                }`}
                        >
                            Create Folder
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
