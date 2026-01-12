import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';

export function LearningVelocity() {
    const [currentCount, setCurrentCount] = useState(0);
    const [lastMonthCount, setLastMonthCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVelocity() {
            try {
                const now = new Date();
                const startOfCurrent = startOfMonth(now).toISOString();

                const startOfLast = startOfMonth(subMonths(now, 1)).toISOString();
                const endOfLast = endOfMonth(subMonths(now, 1)).toISOString();

                // 1. Fetch Current Month Completed Milestones
                // Note: Schema check - 'roadmap_milestones' has 'status'. 
                // Does it have 'completed_at'? If not, we rely on updated_at
                const { count: current, error: err1 } = await supabase
                    .from('roadmap_milestones')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'completed')
                    .gte('updated_at', startOfCurrent); // Approximate completion time

                // 2. Fetch Last Month
                const { count: last, error: err2 } = await supabase
                    .from('roadmap_milestones')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'completed')
                    .gte('updated_at', startOfLast)
                    .lte('updated_at', endOfLast);

                if (err1) throw err1;
                if (err2) throw err2;

                setCurrentCount(current || 0);
                setLastMonthCount(last || 0);
            } catch (err) {
                console.error('Error fetching learning velocity:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchVelocity();
    }, []);

    const diff = currentCount - lastMonthCount;
    const isUp = diff >= 0;

    if (loading) {
        return (
            <div className="col-span-1 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col items-center justify-center">
                <div className="h-10 w-10 bg-slate-800 rounded-full animate-pulse mb-2"></div>
                <div className="h-4 w-20 bg-slate-800/50 rounded animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="col-span-1 row-span-1 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 p-10 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10"></div>

            <div className="relative z-10 text-center">
                <div className="text-4xl font-black text-emerald-500 tracking-tight mb-1 tabular-nums">
                    {currentCount}
                </div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Milestones Crushed
                </div>

                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{Math.abs(diff)} vs last month</span>
                </div>
            </div>
        </div>
    );
}
