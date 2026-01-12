import { useState } from 'react';
import { Zap, CornerDownLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export function QuickCapture() {
    const [input, setInput] = useState('');
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

    return (
        <div className="col-span-1 md:col-span-2 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col group focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-500">
                    <Zap size={20} className={isSaving ? 'animate-pulse' : ''} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Quick Add</h3>
                </div>
                <AnimatePresence>
                    {justSaved && (
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-emerald-500 font-bold"
                        >
                            Saved!
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1 relative">
                <textarea
                    className="w-full h-full bg-transparent resize-none border-none focus:ring-0 p-0 text-lg text-slate-300 placeholder:text-slate-600"
                    placeholder="What's on your mind?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                />
                <div className="absolute bottom-0 right-0 p-2 text-slate-600 transition-opacity opacity-0 group-focus-within:opacity-100 pointer-events-none">
                    <CornerDownLeft size={16} />
                </div>
            </div>
        </div>
    );
}
