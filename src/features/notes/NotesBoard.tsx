import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Plus, Search, FolderPlus, Home, ChevronRight, ArrowLeft, Maximize2, Minimize2, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Note } from './types';
import { NoteCard } from './components/NoteCard';
import { DraggableNote } from './components/DraggableNote';
import { DroppableFolder } from './components/DroppableFolder';
import { RichTextEditor } from './components/RichTextEditor';
import { Modal } from '../../components/Modal';
import { useFileSystem } from './hooks/useFileSystem';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';

export function NotesBoard() {
    const {
        currentFolderId,
        folders,
        notes,
        breadcrumbs,
        isLoading,
        navigateTo,
        createFolder,
        moveNote,
        refresh
    } = useFileSystem();

    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isEditorExpanded, setIsEditorExpanded] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDraggable, setActiveDraggable] = useState<Note | null>(null);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Prevent accidental drags
            },
        })
    );

    // Editor State
    const [editorContent, setEditorContent] = useState('');
    const [title, setTitle] = useState('');

    const openCreateNoteModal = () => {
        setEditingNote(null);
        setTitle('');
        setEditorContent('');
        setIsEditingMode(true); // New notes start in edit mode
        setIsNoteModalOpen(true);
    };

    const openEditNoteModal = (note: Note) => {
        setEditingNote(note);
        setTitle(note.title);
        setEditorContent(note.content || '');
        setIsEditingMode(false); // Existing notes start in read-only
        setIsNoteModalOpen(true);
    };

    const handleSaveNote = async () => {
        if (!title.trim() && !editorContent.trim()) return;

        const noteData = {
            title,
            content: editorContent,
            updated_at: new Date().toISOString(),
            folder_id: editingNote ? undefined : currentFolderId // Only set folder on create
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (editingNote) {
            const { error } = await supabase.from('notes').update(noteData).eq('id', editingNote.id);
            if (error) {
                console.error('Error updating note:', error);
                alert('Failed to update note');
            }
        } else {
            const { error } = await supabase.from('notes').insert([{ ...noteData, user_id: user.id }]);
            if (error) {
                console.error('Error creating note:', error);
                alert('Failed to create note');
            }
        }

        setIsNoteModalOpen(false);
        refresh();
    };

    const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Delete this note?")) return;

        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) {
            console.error('Error deleting note:', error);
            alert('Failed to delete note');
        } else {
            refresh();
        }
    };

    const handleCreateFolder = () => {
        const name = prompt("Enter folder name:");
        if (name && name.trim()) {
            createFolder(name.trim());
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current?.type === 'note') {
            setActiveDraggable(active.data.current.note as Note);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDraggable(null);

        if (!over) return;

        // If dropped on a folder
        if (active.data.current?.type === 'note' && over.data.current?.type === 'folder') {
            const noteId = (active.data.current.note as Note).id;
            const targetFolderId = (over.data.current.folder as any).id;

            if (window.confirm(`Move note to "${over.data.current.folder.name}"?`)) {
                await moveNote(noteId, targetFolderId);
            }
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFolders = folders.filter(folder =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col px-6 pt-6 touch-none">
                <PageHeader
                    title="Notes"
                    description="Capture your thoughts and organized ideas."
                    stats={[
                        { label: 'Folders', value: folders.length },
                        { label: 'Notes', value: notes.length }
                    ]}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search current folder..."
                                className="bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 w-64 focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>

                        <button
                            onClick={handleCreateFolder}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <FolderPlus size={18} />
                            New Folder
                        </button>

                        <button
                            onClick={openCreateNoteModal}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            New Note
                        </button>
                    </div>
                </PageHeader>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-6 text-sm text-slate-400 overflow-x-auto pb-2">
                    <button
                        onClick={() => navigateTo(null)}
                        className={`flex items-center gap-1 hover:text-white transition-colors ${currentFolderId === null ? 'text-white font-semibold' : ''}`}
                    >
                        <Home size={14} />
                        Root
                    </button>
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id} className="flex items-center gap-2 shrink-0">
                            <ChevronRight size={14} className="text-slate-600" />
                            <DropZoneBreadcrumb
                                name={crumb.name}
                                onClick={() => navigateTo(crumb.id)}
                                active={index === breadcrumbs.length - 1}
                            />
                        </div>
                    ))}
                </div>

                {/* Back Button (Mobile/Convenience) */}
                {currentFolderId && (
                    <div className="mb-4">
                        <button
                            onClick={() => navigateTo(breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].id : null)}
                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <ArrowLeft size={12} /> Back to parent
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-20 text-slate-500">Loading directory...</div>
                    ) : (filteredNotes.length === 0 && filteredFolders.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                            <p>{searchQuery ? 'No matching items found' : 'This folder is empty.'}</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Folders Section */}
                            {filteredFolders.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pl-1">Folders</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {filteredFolders.map(folder => (
                                            <DroppableFolder
                                                key={folder.id}
                                                folder={folder}
                                                onClick={() => navigateTo(folder.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes Section */}
                            {filteredNotes.length > 0 && (
                                <div>
                                    {filteredFolders.length > 0 && <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 pl-1">Notes</h3>}
                                    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                                        {filteredNotes.map(note => (
                                            <DraggableNote
                                                key={note.id}
                                                note={note}
                                                onClick={() => openEditNoteModal(note)}
                                                onDelete={(e) => handleDeleteNote(e, note.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DragOverlay>
                    {activeDraggable ? (
                        <div className="opacity-80 rotate-2 scale-105">
                            <NoteCard note={activeDraggable} onClick={() => { }} onDelete={(e) => e.stopPropagation()} />
                        </div>
                    ) : null}
                </DragOverlay>

                <Modal
                    isOpen={isNoteModalOpen}
                    onClose={() => {
                        setIsNoteModalOpen(false);
                        setIsEditorExpanded(false); // Reset on close
                        setIsEditingMode(false);
                    }}
                    title={
                        <div className="flex items-center gap-2 max-w-xl">
                            <span className="truncate">
                                {isEditingMode
                                    ? (editingNote ? 'Edit Note' : 'New Note')
                                    : (editingNote?.title || 'Untitled Note')
                                }
                            </span>
                            {!isEditingMode && editingNote && (
                                <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full shrink-0">Read Only</span>
                            )}
                        </div>
                    }
                    maxWidth={isEditorExpanded ? 'max-w-5xl' : 'max-w-xl'}
                    headerAction={
                        <div className="flex items-center gap-1">
                            {!isEditingMode && editingNote && (
                                <button
                                    onClick={() => setIsEditingMode(true)}
                                    title="Edit Note"
                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                    <Pencil size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => setIsEditorExpanded(!isEditorExpanded)}
                                title={isEditorExpanded ? "Collapse View" : "Expand View"}
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                                {isEditorExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        {isEditingMode && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-slate-800 border-none rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="Note title"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Content</label>
                            <RichTextEditor
                                content={editorContent}
                                onChange={setEditorContent}
                                isExpanded={isEditorExpanded}
                                editable={isEditingMode} // Pass editable prop
                            />
                        </div>
                        {isEditingMode && (
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={handleSaveNote}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20"
                                >
                                    Save Note
                                </button>
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </DndContext>
    )
}

// Helper for breadcrumbs (optional: make them droppable too? Future task)
function DropZoneBreadcrumb({ name, onClick, active }: { name: string, onClick: () => void, active: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`hover:text-white transition-colors ${active ? 'text-white font-bold' : ''}`}
        >
            {name}
        </button>
    )
}
