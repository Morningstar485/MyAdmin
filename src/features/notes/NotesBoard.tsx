import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Plus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Note } from './types';
import { NoteCard } from './components/NoteCard';
import { RichTextEditor } from './components/RichTextEditor';
import { Modal } from '../../components/Modal';

export function NotesBoard() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');

    // Editor State
    const [editorContent, setEditorContent] = useState('');
    const [title, setTitle] = useState('');

    useEffect(() => {
        fetchNotes();
    }, []);

    async function fetchNotes() {
        // ... (fetch logic remains same, but we can't search consistently on client if we paginate, 
        // but here we fetch all, so client-side filtering is fine)
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('updated_at', { ascending: false });

        if (error) console.error('Error fetching notes:', error);
        if (data) setNotes(data as Note[]);
    }

    // ... (modal handlers same)
    const openCreateModal = () => {
        setEditingNote(null);
        setTitle('');
        setEditorContent('');
        setIsModalOpen(true);
    };

    const openEditModal = (note: Note) => {
        setEditingNote(note);
        setTitle(note.title);
        setEditorContent(note.content);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!title.trim() && !editorContent.trim()) return;

        const noteData = {
            title,
            content: editorContent,
            updated_at: new Date().toISOString(),
        };

        if (editingNote) {
            // Update
            const { error } = await supabase
                .from('notes')
                .update(noteData)
                .eq('id', editingNote.id);

            if (error) {
                console.error('Error updating note:', error);
                alert('Failed to update note');
                return;
            }

            setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, ...noteData } : n));
        } else {
            // Create
            const { data, error } = await supabase
                .from('notes')
                .insert([noteData])
                .select()
                .single();

            if (error || !data) {
                console.error('Error creating note:', error);
                alert('Failed to create note');
                return;
            }

            setNotes(prev => [data, ...prev]);
        }

        setIsModalOpen(false);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Delete this note?")) return;

        setNotes(prev => prev.filter(n => n.id !== id));

        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting note:', error);
            alert('Failed to delete note');
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col px-6 pt-6 touch-none">
            <PageHeader
                title="Notes"
                description="Capture your thoughts and ideas."
                stats={[{ label: 'Total Notes', value: notes.length }]}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notes..."
                            className="bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 w-64 focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Note
                    </button>
                </div>
            </PageHeader>

            <div className="flex-1 overflow-y-auto pb-20">
                {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        <p>{searchQuery ? 'No matching notes found' : 'No notes yet'}</p>
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                        {filteredNotes.map(note => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onClick={() => openEditModal(note)}
                                onDelete={(e) => handleDelete(e, note.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingNote ? 'Edit Note' : 'New Note'}
            >
                <div className="space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full bg-slate-800 border-none rounded-lg px-4 py-3 text-lg font-bold text-white placeholder:text-slate-500 focus:ring-0"
                        autoFocus
                    />
                    <RichTextEditor
                        content={editorContent}
                        onChange={setEditorContent}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
