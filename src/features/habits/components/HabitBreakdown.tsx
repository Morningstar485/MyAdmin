import { useMemo } from 'react';
import type { Habit, HabitLog } from '../../../services/habitService';
import { TrendingUp, TrendingDown, Minus, Flame, Activity, Zap, BookOpen, Moon, Sun, Code, Dumbbell, Leaf, Brain, Book, Coffee, Home, Heart, Music, Star, Briefcase } from 'lucide-react';

interface HabitBreakdownProps {
    habits: Habit[];
    logs: HabitLog[];
}

// Reuse Icon Map for visual consistency
const ICON_MAP: Record<string, any> = {
    'Zap': Zap, 'BookOpen': BookOpen, 'Moon': Moon, 'Sun': Sun, 'Code': Code,
    'Dumbbell': Dumbbell, 'Leaf': Leaf, 'Brain': Brain, 'book': Book,
    'activity': Activity, 'briefcase': Briefcase, 'coffee': Coffee,
    'home': Home, 'heart': Heart, 'music': Music, 'star': Star
};

export function HabitBreakdown({ habits, logs }: HabitBreakdownProps) {
    const stats = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        return habits.map(habit => {
            const habitLogs = logs.filter(l => l.habit_id === habit.id);

            // 1. Success Rate (Last 30 Days)
            // Filter logs to last 30 days
            const recentLogs = habitLogs.filter(l => new Date(l.log_date) >= thirtyDaysAgo);
            // Assuming "1 log" = "done" or partial. Ideally sum intensity. 
            // Let's use intensity sum for accuracy.
            const totalIntensity30 = recentLogs.reduce((acc, l) => acc + (l.intensity || 0), 0);
            const successRate = Math.round((totalIntensity30 / 30) * 100);

            // 2. Streak
            // Count backwards from yesterday/today
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            const todayStr = today.toISOString().split('T')[0];
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            // Simple loop for streak
            // Let's simplify: Get all filled dates. Sort descending. Find consecutive sequence.
            const sortedDates = habitLogs
                .filter(l => (l.intensity || 0) > 0)
                .map(l => l.log_date)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

            // Re-calc streak reliably
            let safeStreak = 0;
            let expectedDate = new Date(); // Start with "Today"

            // Allow "Today" to be missing without breaking streak if checking *current* active streak
            const todayLogIdx = sortedDates.indexOf(todayStr);
            const yesterdayLogIdx = sortedDates.indexOf(yesterdayStr);

            if (todayLogIdx !== -1) {
                // Done today. Count consecutive from today.
                let ptr = 0; // today
                while (ptr < sortedDates.length) {
                    const logDate = new Date(sortedDates[ptr]);
                    // Check if consecutive
                    const diff = (expectedDate.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
                    // allow small float error
                    if (Math.abs(diff) < 0.1) {
                        safeStreak++;
                        expectedDate.setDate(expectedDate.getDate() - 1);
                        ptr++;
                    } else {
                        break;
                    }
                }
            } else if (yesterdayLogIdx !== -1) {
                // Done yesterday. Streak is alive.
                expectedDate.setDate(expectedDate.getDate() - 1); // Start expecting yesterday
                // find yesterday in list
                let ptr = yesterdayLogIdx;
                while (ptr < sortedDates.length) {
                    const logDate = new Date(sortedDates[ptr]);
                    const diff = (expectedDate.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
                    if (Math.abs(diff) < 0.1) {
                        safeStreak++;
                        expectedDate.setDate(expectedDate.getDate() - 1);
                        ptr++;
                    } else {
                        break;
                    }
                }
            } else {
                safeStreak = 0;
            }


            // 3. Trend (Last 7 days vs Prev 7 days)
            const last7Days = habitLogs.filter(l => {
                const logDate = new Date(l.log_date);
                const diff = (today.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
                return diff >= 0 && diff < 7;
            }).reduce((sum, l) => sum + (l.intensity || 0), 0);

            const prev7Days = habitLogs.filter(l => {
                const d = new Date(l.log_date);
                const diff = (today.getTime() - d.getTime()) / (1000 * 3600 * 24);
                return diff >= 7 && diff < 14;
            }).reduce((sum, l) => sum + (l.intensity || 0), 0);

            let trend: 'up' | 'down' | 'neutral' = 'neutral';
            if (last7Days > prev7Days) trend = 'up';
            if (last7Days < prev7Days) trend = 'down';

            return {
                ...habit,
                successRate,
                streak: safeStreak,
                trend
            };
        });
    }, [habits, logs]);

    return (
        <div className="bg-slate-900 rounded-2xl border border-white/5 flex flex-col overflow-hidden flex-grow shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
            <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white">Habit Performance</h3>
                <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-400">
                    Last 30 Days
                </div>
            </div>

            <div className="overflow-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/30 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                            <th className="p-2 pl-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Habit</th>
                            <th className="p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Success</th>
                            <th className="p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Streak</th>
                            <th className="p-2 pr-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {stats.map(habit => {
                            const Icon = (habit.icon && (ICON_MAP[habit.icon] || ICON_MAP[habit.icon.toLowerCase()] || ICON_MAP[habit.icon.charAt(0).toUpperCase() + habit.icon.slice(1)])) || Activity;

                            return (
                                <tr key={habit.id} className="group hover:bg-slate-800/30 transition-colors">
                                    <td className="p-2 pl-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                                                <Icon size={14} />
                                            </div>
                                            <span className="font-medium text-sm text-slate-200">{habit.title}</span>
                                        </div>
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className={`text-sm font-bold ${habit.successRate >= 80 ? 'text-emerald-400' : habit.successRate >= 50 ? 'text-amber-400' : 'text-slate-500'}`}>
                                                {habit.successRate}%
                                            </span>
                                            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${habit.successRate >= 80 ? 'bg-emerald-500' : habit.successRate >= 50 ? 'bg-amber-500' : 'bg-slate-600'}`}
                                                    style={{ width: `${habit.successRate}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <div className={`p-1 rounded-md ${habit.streak > 3 ? 'bg-orange-500/10 text-orange-500' : 'text-slate-500'}`}>
                                                <Flame size={14} className={habit.streak > 3 ? 'fill-orange-500' : ''} />
                                            </div>
                                            <span className={`font-bold text-sm ${habit.streak > 3 ? 'text-white' : 'text-slate-500'}`}>
                                                {habit.streak}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-2 pr-4 text-right">
                                        <div className="flex justify-end">
                                            {habit.trend === 'up' && (
                                                <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                                    <TrendingUp size={14} />
                                                    <span>+7d</span>
                                                </div>
                                            )}
                                            {habit.trend === 'down' && (
                                                <div className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md text-xs font-bold">
                                                    <TrendingDown size={14} />
                                                    <span>-7d</span>
                                                </div>
                                            )}
                                            {habit.trend === 'neutral' && (
                                                <div className="flex items-center gap-1 text-slate-500 px-2 py-1">
                                                    <Minus size={14} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
