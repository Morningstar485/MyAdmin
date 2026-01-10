import type { HabitLog } from '../../../services/habitService';

interface ConsistencyHeatmapProps {
    logs: HabitLog[];
}

export function ConsistencyHeatmap({ logs }: ConsistencyHeatmapProps) {
    // Generate last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return {
            date: d.toISOString().split('T')[0],
            dayOfMonth: d.getDate(),
        };
    });

    // Calculate daily intensity (average of all habits for that day)
    // Note: This logic might need refinement if we want per-habit heatmaps. 
    // But per instructions: "Visual: A grid of small squares representing the last 30 days." 
    // And "Green Scale: Use 4 shades of green based on daily intensity".
    // This implies an aggregate view of "How did I do today?".
    // To get "Daily Intensity", we sum up intensities of all logs for that day
    // and divide by the *total active habits*. 
    // However, we only have logs here. We'll approximate by averaging the intensity of *logged* items 
    // OR we just show the raw intensity if the user wants to see "did I do *anything*".
    // Let's assume for now valid logs for a day means "User was active".

    // Better Approach: 
    // The instructions say "Green Scale: Use 4 shades of green based on daily intensity".
    // Intensity is stored on the log. 
    // If this is a global heatmap, it should represent the overall day's grade.
    // Let's calculate the average intensity of all logs present for that day. 
    // (Acknowledging this misses "skipped" habits that weren't logged at all, but we don't have total habit count here easily without passing it in).
    // Actually, looking at the layout, this is likely a global "Consistency" metric.

    const getIntensityColor = (date: string) => {
        const dayLogs = logs.filter(l => l.log_date === date);
        if (dayLogs.length === 0) return 'bg-slate-800'; // No data

        // Calculate average intensity for the day
        const totalIntensity = dayLogs.reduce((sum, log) => sum + (log.intensity || 0), 0);
        // We can't know the "Percentage of Total Habits" here without passing total habits.
        // For now, let's just look at the average of the logs recorded.
        // If I did 5 habits, 3 completed (1.0), 2 partial (0.5) -> Avg 0.8
        const avgIntensity = totalIntensity / dayLogs.length;

        if (avgIntensity === 0) return 'bg-slate-800';
        if (avgIntensity < 0.5) return 'bg-emerald-900/40';
        if (avgIntensity < 1) return 'bg-emerald-500/60';
        return 'bg-emerald-500';
    };

    return (
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-semibold mb-4 text-white">Consistency Grid</h3>
            <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                    <div
                        key={day.date}
                        className={`w-8 h-8 rounded-md transition-colors duration-300 ${getIntensityColor(day.date)}`}
                        title={`Date: ${day.date}`}
                    />
                ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-slate-800" />
                    <span>None</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-900/40" />
                    <span>Partial</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Perfect</span>
                </div>
            </div>
        </div>
    );
}
