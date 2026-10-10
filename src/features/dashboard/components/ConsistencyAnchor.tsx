import { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Activity } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export function ConsistencyAnchor() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const today = new Date();
                const startDate = subDays(today, 30);

                // Fetch confirmed completed tasks in the last 30 days
                const { data: todos } = await supabase
                    .from('todos')
                    .select('id, completed_at, created_at')
                    .eq('completed', true)
                    .or(`completed_at.gte.${startDate.toISOString()},created_at.gte.${startDate.toISOString()}`);

                const todoMap = new Map<string, number>();
                todos?.forEach((t: any) => {
                    const dateObj = new Date(t.completed_at || t.created_at);
                    const dateStr = format(dateObj, 'yyyy-MM-dd');
                    todoMap.set(dateStr, (todoMap.get(dateStr) || 0) + 1);
                });

                const mergedData = [];
                for (let i = 29; i >= 0; i--) {
                    const d = subDays(today, i);
                    const dateStr = format(d, 'yyyy-MM-dd');
                    const displayDate = format(d, 'MMM d');
                    const taskCount = todoMap.get(dateStr) || 0;

                    mergedData.push({
                        date: displayDate,
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

    const totalCompleted = data.reduce((sum, item) => sum + (item.taskCount || 0), 0);

    return (
        <div className="col-span-1 md:col-span-2 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-5 flex flex-col shadow-sm h-[300px]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Productivity Output</h3>
                        <p className="text-xs text-slate-500">Tasks completed over the last 30 days ({totalCompleted} total)</p>
                    </div>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                    <div className="w-2.5 h-0.5 bg-indigo-500 rounded-full"></div>
                    <span>Tasks Completed</span>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
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
                        <Area
                            type="monotone"
                            dataKey="taskCount"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#taskGradient)"
                            dot={{ fill: '#6366f1', r: 2, strokeWidth: 0 }}
                            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                            name="Tasks Completed"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
