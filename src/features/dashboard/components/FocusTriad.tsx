import { useState, useEffect } from 'react';
import { Target, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { Todo } from '../../todo/types';
import { motion, AnimatePresence } from 'framer-motion';

export function FocusTriad() {
    const [tasks, setTasks] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopTasks();
    }, []);

    async function fetchTopTasks() {
        try {
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .eq('completed', false)
                .eq('is_archived', false)
                .eq('workspace', 'work'); // Enforce 'work' context for Focus

            if (error) throw error;

            if (data) {
                // Priority Map
                const priorityWeight: Record<string, number> = {
                    'Today': 0,
                    'This Week': 1,
                    'Later': 2
                };

                const sorted = (data as Todo[]).sort((a, b) => {
                    // 1. Priority (Status)
                    const pA = priorityWeight[a.status] ?? 3;
                    const pB = priorityWeight[b.status] ?? 3;
                    if (pA !== pB) return pA - pB;

                    // 2. Oldest First (created_at ASC)
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                });

                setTasks(sorted.slice(0, 3));
            }
        } catch (err) {
            console.error('Error fetching Focus Triad:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleComplete = async (id: string) => {
        // Optimistic UI
        setTasks(prev => prev.filter(t => t.id !== id));

        // API
        await supabase
            .from('todos')
            .update({ 
                completed: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        // Optional: Refetch to fill the slot? 
        fetchTopTasks();
    };

    if (loading) {
        return (
            <div className="col-span-1 row-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col gap-4">
                <div className="h-6 w-24 bg-slate-800 rounded animate-pulse"></div>
                <div className="flex-1 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 w-full bg-slate-800/50 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="col-span-1 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 text-orange-500">
                <Target size={20} className="text-orange-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Critical Tasks</h3>
            </div>

            {/* List */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
                <AnimatePresence mode="popLayout">
                    {tasks.length > 0 ? (
                        tasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="group relative p-4 rounded-xl bg-slate-800/50 border-l-4 border-indigo-500 hover:bg-slate-800 transition-all shadow-sm hover:shadow-md cursor-pointer flex items-start gap-4"
                                onClick={() => handleComplete(task.id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2">
                                        {task.title}
                                    </h4>
                                </div>

                                <div className="shrink-0 pt-1">
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-600 group-hover:border-emerald-500 group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors">
                                        <Check size={14} className="opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center text-slate-400"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                                <Check size={32} />
                            </div>
                            <p className="font-medium">All Clear!</p>
                            <p className="text-xs opacity-60 mt-1">No urgent work tasks found.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
