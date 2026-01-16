import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { HabitLog } from '../../../services/habitService';

interface VelocityChartProps {
    logs: HabitLog[];
    totalHabitsCount: number;
}

export function VelocityChart({ logs, totalHabitsCount }: VelocityChartProps) {
    const data = useMemo(() => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const dayLogs = logs.filter(l => l.log_date === dateStr);
            let percentage = 0;

            if (totalHabitsCount > 0) {
                const totalIntensity = dayLogs.reduce((sum, log) => sum + (log.intensity || 0), 0);
                percentage = Math.round((totalIntensity / totalHabitsCount) * 100);
            }

            days.push({
                date: displayDate,
                fullDate: dateStr,
                percentage: Math.min(percentage, 100)
            });
        }
        return days;
    }, [logs, totalHabitsCount]);

    if (totalHabitsCount === 0) return null;

    return (
        <div className="bg-slate-900 rounded-2xl p-4 border border-white/5 h-48 flex flex-col relative overflow-hidden group">
            {/* Gradient Overlay for fanciness */}
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <h3 className="text-sm font-semibold mb-2 text-white z-10">30-Day Velocity</h3>

            <div className="flex-1 w-full min-h-0 z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: '#10b981', fontWeight: 600 }}
                            cursor={{ stroke: '#334155', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="percentage"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#velocityGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
