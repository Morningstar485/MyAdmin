import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus, Activity, Sun, Moon, Coffee, Book, Dumbbell, Code, Music, Briefcase, Home, Star, Zap, Heart, Leaf, Brain, BookOpen, Edit2 } from 'lucide-react';
import type { Database } from '../../../types/supabase';

// Re-using types from Database definition for strictness
type Habit = Database['public']['Tables']['habits']['Row'];
type HabitLog = Database['public']['Tables']['habit_logs']['Row'];

interface HabitRowProps {
    habit: Habit;
    log: HabitLog | null;
    onToggle: (habitId: string, newStatus: 'completed' | 'partial' | null) => void;
    onEdit: () => void;
    isEditMode?: boolean;
}

// Icon Mapping
const ICON_MAP: Record<string, React.ElementType> = {
    // Saved keys (Capitalized)
    'Zap': Zap,
    'BookOpen': BookOpen,
    'Moon': Moon,
    'Sun': Sun,
    'Code': Code,
    'Dumbbell': Dumbbell,
    'Leaf': Leaf,
    'Brain': Brain,

    // Legacy/Fallback lowercases just in case
    'zap': Zap,
    'book': Book,
    'bookopen': BookOpen,
    'moon': Moon,
    'sun': Sun,
    'code': Code,
    'dumbbell': Dumbbell,
    'leaf': Leaf,
    'brain': Brain,
    'activity': Activity,
    'briefcase': Briefcase,
    'coffee': Coffee,
    'home': Home,
    'heart': Heart,
    'music': Music,
    'star': Star
};

export const HabitRow: React.FC<HabitRowProps> = ({ habit, log, onToggle, onEdit, isEditMode = false }) => {
    // Determine current status. If no log exists, it's effectively "null" (Empty)
    const currentStatus = log?.status || null;

    // Helper to calculate next state: Empty -> Completed -> Partial -> Empty
    const handleNextState = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click in edit mode (if we were to combine them)
        let nextStatus: 'completed' | 'partial' | null = null;

        if (currentStatus === null) {
            nextStatus = 'completed';
        } else if (currentStatus === 'completed') {
            nextStatus = 'partial';
        } else {
            nextStatus = null; // Reset to empty
        }

        onToggle(habit.id, nextStatus);
    };

    // Helper to format SQL time (09:00:00) to 12-hour format (9:00 AM)
    const formatTime = (timeBytes: string) => {
        try {
            const [hours, minutes] = timeBytes.split(':');
            let h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12; // the hour '0' should be '12'
            return `${h}:${minutes} ${ampm}`;
        } catch (e) {
            return timeBytes;
        }
    };

    // Get Icon Component - robust lookup
    const IconComponent = (habit.icon && (ICON_MAP[habit.icon] || ICON_MAP[habit.icon.toLowerCase()] || ICON_MAP[habit.icon.charAt(0).toUpperCase() + habit.icon.slice(1)])) || Activity;

    return (
        <div
            onClick={() => isEditMode && onEdit()}
            className={`
                group flex items-center justify-between px-4 py-2.5 rounded-xl border shadow-sm transition-all duration-300
                ${isEditMode
                    ? 'cursor-pointer bg-slate-800/40 border-amber-500/30 hover:bg-slate-800/80 hover:border-amber-500/60'
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }
            `}
        >
            {/* Left Side: Info */}
            <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isEditMode ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    <IconComponent size={14} />
                </div>
                <div>
                    <h3 className="font-medium text-white text-sm">{habit.title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                        {formatTime(habit.default_time)}
                    </p>
                </div>
            </div>

            {/* Right Side: Interactive Button or Edit Icon */}
            {isEditMode ? (
                <div className="mr-2 text-amber-500 opacity-80">
                    <Edit2 size={20} />
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNextState}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300 border ${currentStatus === 'completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : currentStatus === 'partial'
                                ? 'bg-amber-400 border-amber-400 text-white'
                                : 'bg-transparent border-white/10 hover:bg-white/5 text-slate-400'
                            }`}
                    >
                        <AnimatePresence mode='wait'>
                            {currentStatus === 'completed' && (
                                <motion.div
                                    key="check"
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 45 }}
                                >
                                    <Check size={14} className="stroke-[3]" />
                                </motion.div>
                            )}
                            {currentStatus === 'partial' && (
                                <motion.div
                                    key="minus"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                >
                                    <Minus size={14} className="stroke-[3]" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            )}
        </div>
    );
};
