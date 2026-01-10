import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, BookOpen, Moon, Sun, Code, Dumbbell, Leaf, Brain, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { createHabit, updateHabit, deleteHabit, type Habit } from '../../../services/habitService';

interface HabitFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Habit | null;
}

const ICONS = [
    { name: 'Zap', icon: Zap },
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Moon', icon: Moon },
    { name: 'Sun', icon: Sun },
    { name: 'Code', icon: Code },
    { name: 'Dumbbell', icon: Dumbbell },
    { name: 'Leaf', icon: Leaf },
    { name: 'Brain', icon: Brain },
];

export function HabitFormModal({ isOpen, onClose, onSuccess, initialData }: HabitFormModalProps) {
    const [title, setTitle] = useState('');
    const [defaultTime, setDefaultTime] = useState('09:00');
    const [selectedIcon, setSelectedIcon] = useState('Zap');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setDefaultTime(initialData.default_time.slice(0, 5)); // HH:MM
                setSelectedIcon(initialData.icon || 'Zap');
            } else {
                // Reset for create mode
                setTitle('');
                setDefaultTime('09:00');
                setSelectedIcon('Zap');
            }
            setShowDeleteConfirm(false);
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            if (initialData) {
                await updateHabit(initialData.id, {
                    title,
                    default_time: defaultTime,
                    icon: selectedIcon
                });
            } else {
                await createHabit({
                    title,
                    default_time: defaultTime,
                    icon: selectedIcon
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to save habit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData) return;
        setIsSubmitting(true);
        try {
            await deleteHabit(initialData.id);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to delete habit');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Panel */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-slate-900 rounded-2xl p-6 border border-white/5 shadow-2xl overflow-hidden"
                    >
                        {!showDeleteConfirm ? (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">{initialData ? 'Edit Habit' : 'Create New Habit'}</h2>
                                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Title Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">
                                            What is the habit?
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g., Read 10 pages"
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white placeholder:text-slate-600"
                                            autoFocus={!initialData}
                                        />
                                    </div>

                                    {/* Time Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">
                                            When do you do this?
                                        </label>
                                        <input
                                            type="time"
                                            value={defaultTime}
                                            onChange={(e) => setDefaultTime(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white [color-scheme:dark]"
                                        />
                                    </div>

                                    {/* Icon Picker */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">
                                            Choose an icon
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {ICONS.map(({ name, icon: Icon }) => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => setSelectedIcon(name)}
                                                    className={`
                                                        flex items-center justify-center p-3 rounded-xl border transition-all duration-200
                                                        ${selectedIcon === name
                                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 ring-2 ring-emerald-500/20'
                                                            : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300'
                                                        }
                                                    `}
                                                >
                                                    <Icon size={24} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-2">
                                        {initialData ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        ) : <div />}

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!title.trim() || isSubmitting}
                                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    initialData ? 'Save Changes' : 'Create Habit'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="mx-auto w-12 h-12 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Delete Habit?</h3>
                                <p className="text-slate-400 text-sm mb-6">
                                    Are you sure you want to delete <span className="text-white font-medium">"{title}"</span>? This will hide it from your dashboard. History is preserved but won't be visible.
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isSubmitting}
                                        className="px-6 py-2 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
