import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { Activity, CheckCircle, Clock, Target, Calendar, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ActivityChart } from './components/ActivityChart';
import { FocusChart } from './components/FocusChart';
import type { Todo } from '../todo/types';

// Animation Variants
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

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
    const { events: calendarEvents, loading: calendarLoading } = useGoogleCalendar();

    // Live Clock
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
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

        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function calculateStats(todos: Todo[]) {
        const totalTasks = todos.length;
        const completedTasks = todos.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const totalMinutes = todos.reduce((acc, t) => acc + (t.duration || 0), 0);
        const totalHours = Math.round(totalMinutes / 60);

        setStats({
            totalTasks,
            completedTasks,
            completionRate,
            totalTime: totalHours,
            pendingTasks
        });

        // Activity Data (Simulated for now based on created_at as per previous logic)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const activity = last7Days.map(date => {
            const created = todos.filter(t => t.created_at.startsWith(date)).length;
            const completed = todos.filter(t => t.completed && t.created_at.startsWith(date)).length;
            return {
                name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                created,
                completed
            };
        });
        setActivityData(activity);

        // Focus Data
        const tagMap = new Map<string, { count: number, color: string }>();
        todos.forEach(todo => {
            if (todo.tags && todo.tags.length > 0) {
                todo.tags.forEach(tag => {
                    const current = tagMap.get(tag.name) || { count: 0, color: '' };
                    let hexColor = '#94a3b8';
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

        setFocusData(Array.from(tagMap.entries()).map(([name, data]) => ({
            name,
            value: data.count,
            color: data.color
        })));
    }

    if (loading) return (
        <div className="flex items-center justify-center h-full text-slate-400">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Loading Dashboard...
            </motion.div>
        </div>
    );

    return (
        <div className="h-full flex flex-col p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <motion.div
                variants={container}
                // initial="hidden" 
                animate="show"
                className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-6 max-w-7xl mx-auto w-full"
            >
                {/* 1. Greeting Card (Span 4) */}
                <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-4 rounded-3xl p-8 backdrop-blur-xl bg-slate-900/60 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/30 transition-all duration-700"></div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight mb-2">
                                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}
                            </h1>
                            <p className="text-slate-400 text-lg">Ready to make an impact today?</p>
                        </div>
                        <div className="mt-8">
                            <div className="text-6xl md:text-7xl font-bold text-white tracking-tighter tabular-nums">
                                {format(currentTime, 'h:mm')}
                                <span className="text-2xl md:text-3xl font-light text-slate-500 ml-2">{format(currentTime, 'a')}</span>
                            </div>
                            <div className="text-indigo-400 font-medium tracking-widest uppercase text-sm mt-2">
                                {format(currentTime, 'EEEE, MMMM do')}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Quick Stats Cards (Span 2 each) */}
                <StatCard
                    label="Pending Tasks"
                    value={stats.pendingTasks}
                    icon={Target}
                    color="text-indigo-400"
                    bg="bg-indigo-500/10"
                    trend={`${stats.totalTasks} total`}
                />
                <StatCard
                    label="Productivity"
                    value={`${stats.completionRate}%`}
                    icon={Activity}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    trend="Completion rate"
                />

                {/* 3. Focus/Activity Chart (Span 4, Row 2) */}
                <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-4 rounded-3xl p-1 backdrop-blur-xl bg-slate-900/60 border border-white/10 flex flex-col h-[320px]">
                    <div className="p-6 pb-2 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Weekly Activity</h3>
                        <div className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                            <ArrowUpRight size={16} className="text-slate-400" />
                        </div>
                    </div>
                    <div className="flex-1 w-full h-full min-h-0">
                        <ActivityChart data={activityData} />
                    </div>
                </motion.div>

                {/* 4. Google Calendar (Span 2, Row 2) */}
                <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-2 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-white/10 flex flex-col overflow-hidden h-[320px]">
                    <div className="p-6 border-b border-white/5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Upcoming Events</h3>
                            <p className="text-xs text-slate-500">{calendarEvents.length} upcoming events</p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {calendarLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">Loading calendar...</div>
                        ) : calendarEvents.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                                <CheckCircle size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">No upcoming events!</p>
                            </div>
                        ) : (
                            calendarEvents.map(event => {
                                const start = event.start.dateTime ? new Date(event.start.dateTime) : (event.start.date ? new Date(event.start.date) : null);
                                const timeStr = start ? format(start, 'MMM d, h:mm a') : 'All Day';

                                return (
                                    <div key={event.id} className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{timeStr}</span>
                                        </div>
                                        <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                                            {event.summary}
                                        </span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </motion.div>

                {/* 5. Focus Distribution (Span 2, Row 2) */}
                <motion.div variants={item} className="col-span-1 md:col-span-4 lg:col-span-2 rounded-3xl p-6 backdrop-blur-xl bg-slate-900/60 border border-white/10 flex flex-col h-[320px]">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Focus Areas</h3>
                    <div className="flex-1">
                        <FocusChart data={focusData} />
                    </div>
                </motion.div>

                {/* 6. Extra Stats (Span 2) */}
                <StatCard
                    label="Focus Time"
                    value={`${stats.totalTime}h`}
                    icon={Clock}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    trend="Estimated hours"
                />
                <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-2 rounded-3xl p-6 backdrop-blur-xl bg-slate-900/60 border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-slate-800/60 transition-colors">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">Status</p>
                        <p className="text-2xl font-medium text-white group-hover:text-indigo-300 transition-colors">On Track</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle size={24} />
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg, trend }: { label: string, value: string | number, icon: any, color: string, bg: string, trend?: string }) {
    return (
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-2 rounded-3xl p-6 backdrop-blur-xl bg-slate-900/60 border border-white/10 flex flex-col justify-between group hover:border-white/20 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${bg} ${color}`}>
                    <Icon size={24} />
                </div>
                {trend && <span className="text-xs text-slate-500 font-medium bg-slate-800/50 px-2 py-1 rounded-full">{trend}</span>}
            </div>
            <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1 group-hover:text-slate-300 transition-colors">{label}</p>
                <p className="text-3xl font-light text-white tracking-tight">{value}</p>
            </div>
        </motion.div>
    );
}

