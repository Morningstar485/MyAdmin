import type { HabitLog } from '../../../services/habitService';

interface ConsistencyHeatmapProps {
    logs: HabitLog[];
    totalHabitsCount: number;
}

export function ConsistencyHeatmap({ logs, totalHabitsCount }: ConsistencyHeatmapProps) {
    // Generate last 60 days to fill the width
    const days = Array.from({ length: 90 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (89 - i));
        return {
            date: d.toISOString().split('T')[0],
            dayOfMonth: d.getDate(),
        };
    });

    const getIntensityStyle = (date: string) => {
        const dayLogs = logs.filter(l => l.log_date === date);
        if (dayLogs.length === 0 || totalHabitsCount === 0) return { backgroundColor: 'rgb(30, 41, 59)' }; // slate-800

        // Calculate total intensity for the day
        const totalIntensity = dayLogs.reduce((sum, log) => sum + (log.intensity || 0), 0);

        // Calculate ratio against total EXPECTED habits
        const ratio = Math.min(totalIntensity / totalHabitsCount, 1);

        if (ratio === 0) return { backgroundColor: 'rgb(30, 41, 59)' }; // slate-800

        return { backgroundColor: `rgba(16, 185, 129, ${Math.max(0.15, ratio)})` };
    };

    return (
        <div className="bg-slate-900 rounded-2xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold mb-3 text-white">Consistency Grid</h3>
            <div className="flex flex-nowrap gap-1 overflow-hidden justify-end">
                {days.map((day) => (
                    <div
                        key={day.date}
                        className="w-3.5 h-3.5 rounded-sm transition-colors duration-300 border border-white/5"
                        style={getIntensityStyle(day.date)}
                        title={`Date: ${day.date}`}
                    />
                ))}
            </div>

        </div>
    );
}
