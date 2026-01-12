import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Briefcase, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProjectStats {
    id: string;
    title: string;
    progress: number;
    color: string;
}

export function ProjectWatch() {
    const [projects, setProjects] = useState<ProjectStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProjects() {
            try {
                // 1. Fetch Active Plans
                const { data: plans, error } = await supabase
                    .from('plans')
                    .select('id, title, status')
                    .neq('status', 'Completed')
                    .neq('status', 'Archived')
                    .limit(15);

                if (error) throw error;

                if (plans && plans.length > 0) {
                    const planIds = plans.map(p => p.id);

                    // 2. Fetch Tasks for these plans (including archived/completed ones)
                    const { data: tasks } = await supabase
                        .from('todos')
                        .select('id, plan_id, completed')
                        .in('plan_id', planIds);

                    // 3. Calculate Progress with Explicit String Comparison
                    const stats = plans.map((plan: any) => {
                        // FIX: Ensure ID comparison handles string/number mismatch
                        const planTasks = tasks?.filter((t: any) => String(t.plan_id) === String(plan.id)) || [];
                        const total = planTasks.length;
                        const completed = planTasks.filter((t: any) => t.completed).length;
                        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                        return {
                            id: plan.id,
                            title: plan.title,
                            progress,
                            color: 'bg-indigo-500'
                        };
                    });

                    // Sort by progress descending
                    stats.sort((a: any, b: any) => b.progress - a.progress);

                    setProjects(stats.slice(0, 2));
                } else {
                    setProjects([]);
                }
            } catch (err) {
                console.error('Error loading Project Watch:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
    }, []);

    if (loading) {
        return (
            <div className="col-span-1 md:col-span-2 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col justify-center gap-4">
                <div className="h-4 w-32 bg-slate-800 rounded animate-pulse"></div>
                <div className="h-2 w-full bg-slate-800/50 rounded-full animate-pulse"></div>
                <div className="h-2 w-2/3 bg-slate-800/50 rounded-full animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="col-span-1 md:col-span-2 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-500">
                    <Briefcase size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Active Projects</h3>
                </div>
                {projects.length > 0 && <span className="text-xs text-slate-400 font-medium">{projects.length} Active</span>}
            </div>

            <div className="flex-1 flex flex-col justify-center gap-6">
                {projects.length > 0 ? (
                    projects.map(project => (
                        <div key={project.id}>
                            <div className="flex justify-between items-end mb-2">
                                <h4 className="font-semibold text-slate-200 truncate pr-4">{project.title}</h4>
                                <span className="text-sm font-bold text-indigo-500">{project.progress}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <Link to="/planner" className="group flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/10 transition-all text-slate-400">
                        <Plus className="mb-2 group-hover:text-indigo-500 transition-colors" />
                        <span className="text-sm font-medium group-hover:text-indigo-500 transition-colors">Start a Project</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
