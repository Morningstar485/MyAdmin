import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { useFileSystem } from './hooks/useFileSystem';
import { Modal } from '../../components/Modal';
import { RichTextEditor } from './components/RichTextEditor';
import { supabase } from '../../lib/supabase';
import type { Note } from './types';
import { Folder as FolderIcon, FileText, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export function NotesBoard() {
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
    } = useFileSystem();

    const { workspace } = useWorkspace();

    // 2. Local State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isEditingMode, setIsEditingMode] = useState(false); // Read-only vs Edit toggle

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

    return (
        <div className="h-full flex flex-col px-6 pt-6 overflow-hidden">
            <PageHeader
                title="My Notes"
                description="Capture ideas and documents."
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFolderModalOpen(true)}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                    >
                        + New Folder
                    </button>
                    <button
                        onClick={handleCreateNote}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
                    >
                        + New Note
                    </button>
                </div>
            </PageHeader>

            {/* Breadcrumbs & Navigation */}
            <div className="flex items-center gap-2 mb-6 text-sm text-slate-400 overflow-x-auto pb-2">
                <button
                    onClick={() => navigateTo(null)}
                    className={`hover:text-indigo-400 transition-colors ${!currentFolderId ? 'text-indigo-400 font-medium' : ''}`}
                >
                    Home
                </button>
                {breadcrumbs.map((crumb) => (
                    <div key={crumb.id} className="flex items-center gap-2">
                        <ChevronRight size={14} />
                        <button
                            onClick={() => navigateTo(crumb.id)}
                            className={`hover:text-indigo-400 transition-colors ${crumb.id === currentFolderId ? 'text-indigo-400 font-medium' : ''}`}
                        >
                            {crumb.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pb-20">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40 text-slate-500">Loading...</div>
                ) : (
                    <>
                        {/* Folders Grid */}
                        {folders.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Folders</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {folders.map(folder => (
                                        <button
                                            key={folder.id}
                                            onClick={() => navigateTo(folder.id)}
                                            className="group flex flex-col items-center justify-center p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-indigo-500/50 transition-all"
                                        >
                                            <FolderIcon size={32} className="text-indigo-500/80 mb-3 group-hover:scale-110 transition-transform" fill="currentColor" fillOpacity={0.2} />
                                            <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate w-full text-center">{folder.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes Grid */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</h3>
                                <span className="text-xs text-slate-600">{notes.length} notes</span>
                            </div>

                            {notes.length === 0 && folders.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                                    <div className="p-4 bg-slate-800 rounded-full mb-4">
                                        <FileText size={32} className="text-slate-600" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No notes in this folder</p>
                                    <button
                                        onClick={handleCreateNote}
                                        className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                    >
                                        Create your first note
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {notes.map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => handleOpenNote(note)}
                                        className="group bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col h-48 relative"
                                    >
                                        <h4 className="font-bold text-slate-200 mb-2 line-clamp-2 leading-tight pr-6">{note.title || 'Untitled Note'}</h4>
                                        <div
                                            className="text-sm text-slate-400 line-clamp-4 prose prose-invert prose-sm"
                                            dangerouslySetInnerHTML={{ __html: note.content || '<p class="opacity-50 italic">No content</p>' }}
                                        />
                                        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-600">
                                            <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                                            className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
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
                maxWidth="4xl"
                title={
                    <div className="flex items-center gap-3 max-w-xl">
                        <span className="truncate text-lg font-semibold text-slate-100">
                            {isEditingMode
                                ? (editingNote ? 'Edit Note' : 'New Note')
                                : (editingNote?.title || 'Untitled Note')
                            }
                        </span>
                        {!isEditingMode && editingNote && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full shrink-0 border border-indigo-500/30">Read Only</span>
                        )}
                    </div>
                }
                headerAction={
                    // Edit Toggle Button in Header
                    editingNote ? (
                        <button
                            onClick={() => setIsEditingMode(!isEditingMode)}
                            className={`
                                p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium
                                ${isEditingMode
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                }
                            `}
                            title={isEditingMode ? "Finish Editing" : "Edit Note"}
                        >
                            <Pencil size={16} />
                            <span className="hidden sm:inline">{isEditingMode ? 'Editing' : 'Edit'}</span>
                        </button>
                    ) : null
                }
            >
                <div className="flex flex-col h-[70vh]">
                    {/* Title Input - Only in Edit Mode */}
                    {isEditingMode && (
                        <input
                            type="text"
                            placeholder="Note Title"
                            className="bg-transparent text-2xl font-bold text-white border-none focus:ring-0 px-0 mb-4 placeholder:text-slate-600"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            autoFocus={!editingNote}
                        />
                    )}

                    <div className="flex-1 overflow-hidden bg-slate-950/50 rounded-xl border border-slate-800/50">
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
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNote}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20"
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
                        className="w-full bg-slate-800 border-none rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setIsFolderModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateFolder}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20"
                        >
                            Create Folder
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
