import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { Tag } from '../../todo/types';

export function TaskTagsDistribution() {
    const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalTasks, setTotalTasks] = useState(0);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch active non-archived todos with tags
                const { data: todosData, error } = await supabase
                    .from('todos')
                    .select(`
                        id,
                        todo_tags (
                            tag:tags (*)
                        )
                    `)
                    .eq('is_archived', false);

                if (error) throw error;

                if (todosData) {
                    const tagCounts: Record<string, { count: number; color: string }> = {};
                    let untaggedCount = 0;

                    todosData.forEach((t: any) => {
                        const tags = t.todo_tags.map((tt: any) => tt.tag).filter(Boolean);

                        if (tags.length === 0) {
                            untaggedCount++;
                        } else {
                            tags.forEach((tag: Tag) => {
                                if (!tagCounts[tag.name]) {
                                    tagCounts[tag.name] = { count: 0, color: tag.color };
                                }
                                tagCounts[tag.name].count++;
                            });
                        }
                    });

                    // Map tailwind classes to hex for Recharts
                    const getColorHex = (className: string) => {
                        const colors: Record<string, string> = {
                            'bg-red-500': '#ef4444',
                            'bg-orange-500': '#f97316',
                            'bg-amber-500': '#f59e0b',
                            'bg-yellow-500': '#eab308',
                            'bg-emerald-500': '#10b981',
                            'bg-green-500': '#22c55e',
                            'bg-blue-500': '#3b82f6',
                            'bg-indigo-500': '#6366f1',
                            'bg-violet-500': '#8b5cf6',
                            'bg-purple-500': '#a855f7',
                            'bg-fuchsia-500': '#d946ef',
                            'bg-pink-500': '#ec4899',
                            'bg-rose-500': '#f43f5e',
                            'bg-slate-500': '#64748b',
                        };
                        return colors[className] || '#cbd5e1'; // default slate-300
                    };

                    const chartData = Object.entries(tagCounts).map(([name, info]) => ({
                        name,
                        value: info.count,
                        color: getColorHex(info.color)
                    }));

                    // Add Untagged if significant? Maybe keep specific to Tags. 
                    // User said "distribution of total tasks based on tags". 
                    // Showing "Untagged" is usually helpful context.
                    if (untaggedCount > 0) {
                        chartData.push({
                            name: 'Untagged',
                            value: untaggedCount,
                            color: '#334155' // slate-700
                        });
                    }

                    // Sort by value desc
                    chartData.sort((a, b) => b.value - a.value);

                    setData(chartData);
                    setTotalTasks(todosData.length);
                }
            } catch (err) {
                console.error('Error fetching tag distribution:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="col-span-1 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="col-span-1 md:col-span-2 row-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col relative overflow-hidden h-full">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
                <PieChartIcon size={18} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">Task Distribution</h3>
            </div>

            <div className="flex-1 min-h-0 flex items-center gap-2">
                {/* Left: Chart + Center Text */}
                <div className="relative w-[55%] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius={65}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                                cx="50%"
                                cy="50%"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                                itemStyle={{ color: '#e2e8f0' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Absolute Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="block text-4xl font-black text-white leading-none tracking-tight">{totalTasks}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold mt-1">Tasks</span>
                        </div>
                    </div>
                </div>

                {/* Right: Custom HTML Legend - Scaled */}
                <div className="w-[45%] flex flex-col justify-center gap-2.5 pr-2">
                    {data.slice(0, 7).map((item) => (
                        <div key={item.name} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-medium text-slate-300 truncate" title={item.name}>{item.name}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">{item.value}</span>
                        </div>
                    ))}
                    {data.length > 7 && (
                        <div className="text-[10px] text-slate-500 pl-5 mt-1 font-medium">
                            + {data.length - 7} more
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
