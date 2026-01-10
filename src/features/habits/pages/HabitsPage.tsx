import { useState, useEffect } from 'react';
import { getActiveHabits, getHabitLogs, upsertHabitLog, type Habit, type HabitLog } from '../../../services/habitService';
import { HabitRow } from '../components/HabitRow';
import { ConsistencyHeatmap } from '../components/ConsistencyHeatmap';
import { HabitFormModal } from '../components/CreateHabitModal';
import { Loader2, Flame, Trophy, PieChart, Plus, Edit2, X } from 'lucide-react';

export default function HabitsPage() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [recentLogs, setRecentLogs] = useState<HabitLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [stats, setStats] = useState({
        completionRate: 0,
        streak: 0,
        perfectDays: 0
    });

    // Dates
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [fetchedHabits, fetchedLogs] = await Promise.all([
                getActiveHabits(),
                getHabitLogs(thirtyDaysAgoString, todayString)
            ]);
            setHabits(fetchedHabits);
            setRecentLogs(fetchedLogs);
            calculateStats(fetchedLogs, fetchedHabits);
        } catch (error) {
            console.error('Failed to load habits data', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (logs: HabitLog[], currentHabits: Habit[]) => {
        if (currentHabits.length === 0) return;

        // 1. Completion Rate (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const last7DaysLogs = logs.filter(l => new Date(l.log_date) >= sevenDaysAgo);

        // Potential max score = 7 days * number of habits * 1.0 intensity
        const maxScore = 7 * currentHabits.length;
        const actualScore = last7DaysLogs.reduce((sum, l) => sum + (l.intensity || 0), 0);
        const completionRate = maxScore > 0 ? Math.round((actualScore / maxScore) * 100) : 0;

        // 2. Perfect Days (100% completion in the last 30 days)
        // Group logs by date
        const logsByDate: Record<string, HabitLog[]> = {};
        logs.forEach(l => {
            if (!logsByDate[l.log_date]) logsByDate[l.log_date] = [];
            logsByDate[l.log_date].push(l);
        });

        let perfectDays = 0;
        Object.keys(logsByDate).forEach(date => {
            const dayLogs = logsByDate[date];
            // Simplistic check: Did we log "completed" for every active habit? 
            // Note: This matches active habits count. If habits were added recently, this might be skewed for past days, but acceptable for MVP.
            const completedCount = dayLogs.filter(l => l.status === 'completed').length;
            if (completedCount === currentHabits.length && currentHabits.length > 0) {
                perfectDays++;
            }
        });

        // 3. Current Streak
        // Count backwards from today (or yesterday if today isn't done yet)
        let streak = 0;
        let checkDate = new Date();
        // If no logs today yet, start checking from yesterday? 
        // Logic: Streak persists if I did something today OR if I haven't missed today yet (but that depends on "missed").
        // Simplest: Consecutive days with AT LEAST ONE log.
        for (let i = 0; i < 30; i++) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const hasLog = logs.some(l => l.log_date === dateStr && (l.intensity || 0) > 0);

            if (hasLog) {
                streak++;
            } else if (i === 0) {
                // If today has no logs, don't break streak immediately, just don't count it yet?
                // Or standard streak logic: if yesterday was missed, streak is 0.
                // Let's check yesterday next.
            } else {
                break; // Break on first missing day (excluding today if fetching early)
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }

        setStats({ completionRate, streak, perfectDays });
    };

    const handleToggle = async (habitId: string, newStatus: 'completed' | 'partial' | null) => {
        // Optimistic Update for UI responsiveness
        const prevLogs = [...recentLogs];

        // Create the new log object (or remove it)
        let updatedLogs = prevLogs.filter(l => !(l.habit_id === habitId && l.log_date === todayString));

        if (newStatus) {
            const intensity = newStatus === 'completed' ? 1.0 : 0.5;
            const newLog: HabitLog = {
                id: 'temp-' + Date.now(),
                habit_id: habitId,
                log_date: todayString,
                status: newStatus,
                intensity: intensity,
                created_at: new Date().toISOString(),
                notes: null
            };
            updatedLogs.push(newLog);
        }

        setRecentLogs(updatedLogs);

        // Recalculate stats immediately with optimistic data
        calculateStats(updatedLogs, habits);

        // API Call
        const success = await upsertHabitLog(habitId, todayString, newStatus);
        if (!success) {
            // Revert
            setRecentLogs(prevLogs);
            calculateStats(prevLogs, habits); // Revert stats
            alert('Failed to save habit status.');
        }
    };

    const handleEdit = (habit: Habit) => {
        setEditingHabit(habit);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingHabit(null);
        setIsModalOpen(true);
    };

    // Grouping Logic
    const groupedHabits = {
        morning: habits.filter(h => {
            const hour = parseInt(h.default_time.split(':')[0], 10);
            return hour >= 4 && hour < 12;
        }),
        afternoon: habits.filter(h => {
            const hour = parseInt(h.default_time.split(':')[0], 10);
            return hour >= 12 && hour < 17;
        }),
        evening: habits.filter(h => {
            const hour = parseInt(h.default_time.split(':')[0], 10);
            return hour >= 17 || hour < 4; // Covers late night until 4 AM
        })
    };

    if (loading) {
        return <div className="flex-1 flex items-center justify-center h-full bg-slate-950"><Loader2 className="animate-spin text-indigo-500" /></div>;
    }

    return (
        <div className="flex h-full overflow-hidden bg-slate-950">
            {/* LEFT PANEL: INPUT ZONE */}
            <div className="w-[35%] bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Daily Protocol</h1>
                        <p className="text-emerald-400 font-medium mt-1">
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`
                                px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-lg flex items-center gap-2
                                ${isEditMode
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-orange-500/20'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }
                            `}
                        >
                            {isEditMode ? <X size={16} /> : <Edit2 size={16} />}
                            {isEditMode ? 'Done' : 'Edit'}
                        </button>
                        <button
                            onClick={handleCreate}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Groups */}
                <div className="pb-10">
                    {groupedHabits.morning.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-bold tracking-wider text-slate-400 mb-4 mt-8 px-6 uppercase">Morning Routine</div>
                            <div className="px-6 space-y-3">
                                {groupedHabits.morning.map(habit => (
                                    <HabitRow
                                        key={habit.id}
                                        habit={habit}
                                        log={recentLogs.find(l => l.habit_id === habit.id && l.log_date === todayString) || null}
                                        onToggle={handleToggle}
                                        onEdit={() => handleEdit(habit)}
                                        isEditMode={isEditMode}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {groupedHabits.afternoon.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-bold tracking-wider text-slate-400 mb-4 mt-8 px-6 uppercase">Afternoon Protocol</div>
                            <div className="px-6 space-y-3">
                                {groupedHabits.afternoon.map(habit => (
                                    <HabitRow
                                        key={habit.id}
                                        habit={habit}
                                        log={recentLogs.find(l => l.habit_id === habit.id && l.log_date === todayString) || null}
                                        onToggle={handleToggle}
                                        onEdit={() => handleEdit(habit)}
                                        isEditMode={isEditMode}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {groupedHabits.evening.length > 0 && (
                        <div className="mb-2">
                            <div className="text-xs font-bold tracking-wider text-slate-400 mb-4 mt-8 px-6 uppercase">Evening Routine</div>
                            <div className="px-6 space-y-3">
                                {groupedHabits.evening.map(habit => (
                                    <HabitRow
                                        key={habit.id}
                                        habit={habit}
                                        log={recentLogs.find(l => l.habit_id === habit.id && l.log_date === todayString) || null}
                                        onToggle={handleToggle}
                                        onEdit={() => handleEdit(habit)}
                                        isEditMode={isEditMode}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {habits.length === 0 && (
                        <div className="p-8 text-center text-slate-500 mt-10">
                            <p>No habits defined.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: ANALYTICS */}
            <div className="w-[65%] p-8 overflow-y-auto bg-slate-950">
                <div className="max-w-4xl mx-auto flex flex-col gap-8">

                    {/* Heatmap */}
                    <ConsistencyHeatmap logs={recentLogs} />

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                                <PieChart size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completion</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.completionRate}%</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                                <Flame size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Streak</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.streak} Days</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perfect Days</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.perfectDays}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <HabitFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingHabit}
                onSuccess={() => {
                    loadData();
                }}
            />
        </div>
    );
}
