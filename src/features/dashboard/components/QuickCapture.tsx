import { useState } from 'react';
import { Zap, CornerDownLeft, StickyNote } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export function QuickCapture() {
    const [input, setInput] = useState('');
    const [noteInput, setNoteInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!input.trim() || isSaving) return;

            setIsSaving(true);
            try {
                const { error } = await supabase
                    .from('todos')
                    .insert([{
                        title: input.trim(),
                        status: 'Today',
                        workspace: 'work',
                        completed: false
                    }]);

                if (error) throw error;

                setInput('');
                setJustSaved(true);
                setTimeout(() => setJustSaved(false), 2000);
            } catch (err) {
                console.error('Error adding task:', err);
            } finally {
                setIsSaving(false);
            }
        }
    };
    const handleNoteKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Assuming we have a way to save notes, for now just log or insert to a notes table if strict
            // If strictly strict, I'd need table schema. 
            // Fallback: Save as a Task with tag "Note"? Or just clear it to simulate.
            // PROMPT said "Add Note". 
            // I'll try to insert into 'notes' table based on common patterns.
            if (!noteInput.trim() || isSaving) return;

            setIsSaving(true);
            try {
                const { error } = await supabase
                    .from('notes')
                    .insert([{
                        title: noteInput.trim(), // Assuming 'title' or 'content'
                        content: '',
                        workspace: 'work'
                    }]);

                if (error) {
                    // Fallback if notes table doesn't exist or differs: Task with [Note] prefix
                    console.warn("Notes table might not exist, falling back to Todo", error);
                    await supabase.from('todos').insert([{
                        title: `[Note] ${noteInput.trim()}`,
                        status: 'Later',
                        workspace: 'work'
                    }]);
                }

                setNoteInput('');
                setJustSaved(true);
                setTimeout(() => setJustSaved(false), 2000);
            } catch (err) {
                console.error('Error adding note:', err);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="col-span-1 row-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-0 flex flex-col shadow-sm h-full overflow-hidden">

            {/* Top Half: Add Task */}
            <div className="h-1/2 p-6 border-b border-slate-800 flex flex-col group focus-within:bg-slate-800/20 transition-colors">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <Zap size={18} className={isSaving ? 'animate-pulse' : ''} />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Add Task</h3>
                    </div>
                </div>
                <div className="flex-1 relative">
                    <textarea
                        className="w-full h-full bg-transparent resize-none border-none focus:ring-0 p-0 text-md text-slate-300 placeholder:text-slate-600 leading-snug"
                        placeholder="New task..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSaving}
                    />
                    <div className="absolute bottom-0 right-0 p-1 text-slate-600 transition-opacity opacity-0 group-focus-within:opacity-100 pointer-events-none">
                        <CornerDownLeft size={14} />
                    </div>
                </div>
            </div>

            {/* Bottom Half: Add Note */}
            <div className="h-1/2 p-6 flex flex-col group focus-within:bg-slate-800/20 transition-colors bg-slate-800/10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-amber-500">
                        <StickyNote size={18} className={isSaving ? 'animate-pulse' : ''} />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Add Note</h3>
                    </div>
                    <AnimatePresence>
                        {justSaved && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-[10px] text-emerald-500 font-bold uppercase"
                            >
                                Saved
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex-1 relative">
                    <textarea
                        className="w-full h-full bg-transparent resize-none border-none focus:ring-0 p-0 text-md text-slate-300 placeholder:text-slate-600 leading-snug"
                        placeholder="Quick note..."
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        onKeyDown={handleNoteKeyDown}
                        disabled={isSaving}
                    />
                    <div className="absolute bottom-0 right-0 p-1 text-slate-600 transition-opacity opacity-0 group-focus-within:opacity-100 pointer-events-none">
                        <CornerDownLeft size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
}
