import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, CheckCircle, Clock, Target } from 'lucide-react';
import { StatCard } from './components/StatCard';
import { ActivityChart } from './components/ActivityChart';
import { FocusChart } from './components/FocusChart';
import type { Todo } from '../todo/types';

export function Dashboard() {
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        totalTime: 0,
        pendingTasks: 0
    });
    const [activityData, setActivityData] = useState<any[]>([]);
    const [focusData, setFocusData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        try {
            // Fetch all todos
            const { data: todosData, error } = await supabase
                .from('todos')
                .select(`
                    *,
                    todo_tags (
                        tag:tags (*)
                    )
                `);

            if (error) throw error;

            if (todosData) {
                const todos = todosData.map((t: any) => ({
                    ...t,
                    tags: t.todo_tags.map((tt: any) => tt.tag).filter(Boolean)
                })) as Todo[];

                calculateStats(todos);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    function calculateStats(todos: Todo[]) {
        // 1. Basic Stats
        const totalTasks = todos.length;
        const completedTasks = todos.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Total Time (Estimated duration of all tasks)
        // In minutes
        const totalMinutes = todos.reduce((acc, t) => acc + (t.duration || 0), 0);
        const totalHours = Math.round(totalMinutes / 60);

        setStats({
            totalTasks,
            completedTasks,
            completionRate,
            totalTime: totalHours,
            pendingTasks
        });

        // 2. Activity Data (Last 7 Days)
        // Since we don't have a specific "completed_at" yet in the schema (oops, only created_at), 
        // we'll approximate activity based on created_at for now to show the trend.
        // For a real app, we should add 'completed_at'.
        // Let's grouping created_at by day for the last 7 days.

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const activity = last7Days.map(date => {
            const createdCount = todos.filter(t => t.created_at.startsWith(date)).length;
            // Hack: Using created_at for completed too since we lack the field, 
            // but strictly filtering by completed status. 
            // Ideally we need a 'completed_at' column.
            const completedCount = todos.filter(t => t.completed && t.created_at.startsWith(date)).length;

            return {
                name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                created: createdCount,
                completed: completedCount
            };
        });
        setActivityData(activity);

        // 3. Focus Distribution (By Tag)
        // Group by tag name and sum up count
        const tagMap = new Map<string, { count: number, color: string }>();

        todos.forEach(todo => {
            if (todo.tags && todo.tags.length > 0) {
                todo.tags.forEach(tag => {
                    const current = tagMap.get(tag.name) || { count: 0, color: '' };
                    // Map tailwind class to hex color for charts
                    let hexColor = '#94a3b8'; // default slate-400
                    if (tag.color.includes('red')) hexColor = '#ef4444';
                    if (tag.color.includes('orange')) hexColor = '#f97316';
                    if (tag.color.includes('yellow')) hexColor = '#eab308';
                    if (tag.color.includes('green')) hexColor = '#22c55e';
                    if (tag.color.includes('blue')) hexColor = '#3b82f6';
                    if (tag.color.includes('purple')) hexColor = '#a855f7';

                    tagMap.set(tag.name, { count: current.count + 1, color: hexColor });
                });
            } else {
                const current = tagMap.get('Untagged') || { count: 0, color: '#475569' };
                tagMap.set('Untagged', { count: current.count + 1, color: '#475569' });
            }
        });

        const focus = Array.from(tagMap.entries()).map(([name, data]) => ({
            name,
            value: data.count,
            color: data.color
        }));
        setFocusData(focus);
    }

    if (loading) return <div className="p-6 text-slate-400">Loading Dashboard...</div>;

    return (
        <div className="h-full flex flex-col px-6 pt-6 overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-slate-800">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                <p className="text-slate-400">Your productivity at a glance.</p>
            </header>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Tasks"
                    value={stats.totalTasks}
                    subtitle={`${stats.pendingTasks} Pending`}
                    icon={Target}
                    color="text-indigo-400"
                />
                <StatCard
                    title="Completion Rate"
                    value={`${stats.completionRate}%`}
                    subtitle="Keep it up!"
                    icon={CheckCircle}
                    color="text-emerald-400"
                />
                <StatCard
                    title="Focus Time"
                    value={`${stats.totalTime}h`}
                    subtitle="Total Estimated"
                    icon={Clock}
                    color="text-blue-400"
                />
                <StatCard
                    title="Productivity Score"
                    value={stats.completionRate > 80 ? 'A+' : stats.completionRate > 50 ? 'B' : 'C'}
                    subtitle="Based on completion"
                    icon={Activity}
                    color="text-purple-400"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Activity (Last 7 Days)</h3>
                    <ActivityChart data={activityData} />
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Focus Distribution</h3>
                    <FocusChart data={focusData} />
                </div>
            </div>
        </div>
    )
}
