import { useState, useEffect } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Activity } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getHabitLogs, getActiveHabits } from '../../../services/habitService';

export function ConsistencyAnchor() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const today = new Date();
                const startDate = subDays(today, 30);
                const startDateStr = format(startDate, 'yyyy-MM-dd');
                const endDateStr = format(today, 'yyyy-MM-dd');

                // 1. Fetch Habits & Logs
                const [habits, logs] = await Promise.all([
                    getActiveHabits(),
                    getHabitLogs(startDateStr, endDateStr)
                ]);

                // 2. Fetch Todos (completed in last 30 days)
                // Note: filtering by workspace? Prompt implied "Health vs Output", usually global or work. 
                // Let's assume 'work' or all. Prompt didn't specify workspace for this tile, but did for FocusTriad ("workspace == 'work'").
                // I'll fetch ALL completed todos for "Output".
                // 2. Fetch Tasks AND Patch Legacy Data (completed_at)

                // B. Main Fetch: Get confirmed completed tasks
                const { data: todos } = await supabase
                    .from('todos')
                    .select('id, completed_at, created_at')
                    .eq('completed', true)
                    .or(`completed_at.gte.${startDate.toISOString()},created_at.gte.${startDate.toISOString()}`);

                const todoMap = new Map<string, number>();
                todos?.forEach((t: any) => {
                    // Fallback to created_at if completed_at is missing (safe proxy for recent tasks)
                    const dateObj = new Date(t.completed_at || t.created_at);
                    const dateStr = format(dateObj, 'yyyy-MM-dd');
                    todoMap.set(dateStr, (todoMap.get(dateStr) || 0) + 1);
                });

                // 3. Process Habits
                const habitMap = new Map<string, number>();
                const totalHabits = habits?.length || 1;
                logs?.forEach(l => {
                    const current = habitMap.get(l.log_date) || 0;
                    habitMap.set(l.log_date, current + (l.intensity || 0));
                });

                // 4. Merge
                const mergedData = [];
                for (let i = 29; i >= 0; i--) {
                    const d = subDays(today, i);
                    const dateStr = format(d, 'yyyy-MM-dd');
                    const displayDate = format(d, 'MMM d');

                    const habitTotal = habitMap.get(dateStr) || 0;
                    const habitScore = Math.round((habitTotal / totalHabits) * 100);

                    const taskCount = todoMap.get(dateStr) || 0;

                    mergedData.push({
                        date: displayDate,
                        habitScore,
                        taskCount
                    });
                }

                setData(mergedData);

            } catch (err) {
                console.error('Failed to load Consistency Anchor data', err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="col-span-1 md:col-span-2 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-8 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-32 bg-slate-800 rounded mb-4"></div>
                    <div className="h-32 w-full bg-slate-800/50 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="col-span-1 md:col-span-2 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-5 flex flex-col shadow-sm h-[300px]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Productivity Output</h3>
                    </div>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 text-[10px] font-medium text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/50"></div>
                        <span>Habit Score</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-0.5 bg-indigo-500 rounded-full"></div>
                        <span>Tasks</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="habitBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            interval={4}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            domain={[0, 100]}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        />
                        {/* Layer 1: Habits (Background Skyline) */}
                        <Bar
                            yAxisId="left"
                            dataKey="habitScore"
                            fill="url(#habitBar)"
                            radius={[4, 4, 0, 0]}
                            barSize={Number(20)}
                            name="Habit Score"
                        />
                        {/* Layer 2: Tasks (Pulse) */}
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="taskCount"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                            name="Tasks Completed"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
