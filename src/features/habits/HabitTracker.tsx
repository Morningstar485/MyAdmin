import { useState, useEffect } from 'react';
import { getActiveHabits, getDailyHabitLogs, upsertHabitLog, type Habit, type HabitLog } from '../../services/habitService';
import { HabitRow } from './components/HabitRow';
import { Loader2, Calendar } from 'lucide-react';

export default function HabitTracker() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<HabitLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Get today's date in local YYYY-MM-DD format
    const getTodayString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayString = getTodayString();

    // Display Date (e.g., "Sat, Jan 10")
    const displayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    useEffect(() => {
        let mounted = true;

        async function loadData() {
            try {
                const [habitsData, logsData] = await Promise.all([
                    getActiveHabits(),
                    getDailyHabitLogs(todayString)
                ]);

                if (mounted) {
                    setHabits(habitsData);
                    setLogs(logsData);
                }
            } catch (error) {
                console.error('Failed to load habits:', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => { mounted = false; };
    }, [todayString]);

    const handleToggle = async (habitId: string, newStatus: 'completed' | 'partial' | null) => {
        // 1. Optimistic Update
        const previousLogs = [...logs];

        // Check if a log already exists for this habit
        const existingLogIndex = logs.findIndex(l => l.habit_id === habitId);

        let newLogs = [...logs];

        if (newStatus === null) {
            // Remove log if status is null
            newLogs = newLogs.filter(l => l.habit_id !== habitId);
        } else {
            // Calculate optimistic intensity
            const intensity = newStatus === 'completed' ? 1.0 : 0.5;

            if (existingLogIndex >= 0) {
                // Update existing log
                newLogs[existingLogIndex] = {
                    ...newLogs[existingLogIndex],
                    status: newStatus,
                    intensity: intensity,
                    // Preserve other fields
                };
            } else {
                // Create new temporary log
                const tempLog: HabitLog = {
                    id: 'temp-' + Date.now(),
                    habit_id: habitId,
                    log_date: todayString,
                    status: newStatus,
                    intensity: intensity,
                    notes: null,
                    created_at: new Date().toISOString()
                };
                newLogs.push(tempLog);
            }
        }

        setLogs(newLogs);

        // 2. API Call
        try {
            const success = await upsertHabitLog(habitId, todayString, newStatus);
            if (!success) throw new Error('Failed to update');

            // Optionally: Refetch logs here to get the real ID from DB, 
            // but for simple toggles, the next refresh or stable reference is usually enough.
            // For strict consistency, we could update the single log from server response if service returned it.

        } catch (error) {
            console.error('Error updating habit:', error);
            // 3. Revert on Error
            setLogs(previousLogs);
            alert('Failed to update habit. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Daily Habits
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                        <Calendar size={14} />
                        {displayDate}
                    </p>
                </div>

                {/* Optional: Add Habit Button could go here */}
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
                {habits.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dotted border-slate-300 dark:border-white/10">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No habits set.</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add one to get started!</p>
                    </div>
                ) : (
                    habits.map(habit => {
                        const log = logs.find(l => l.habit_id === habit.id) || null;
                        return (
                            <HabitRow
                                key={habit.id}
                                habit={habit}
                                log={log}
                                onToggle={handleToggle}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
