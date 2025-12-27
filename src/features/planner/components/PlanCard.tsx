import { StickyNote, Network } from 'lucide-react';
import { type Plan } from '../../todo/types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PlanCardProps {
    plan: Plan;
    onClick: () => void;
    taskCount: number;
    completedCount: number;
    noteCount: number;
    hasMindMap: boolean;
    isEditing?: boolean;
    onDelete?: () => void;
}

export function PlanCard({
    plan,
    onClick,
    taskCount,
    completedCount,
    noteCount,
    hasMindMap,
    isEditing,
    onDelete
}: PlanCardProps) {
    // Data for the donut chart
    const remainingCount = Math.max(0, taskCount - completedCount);
    // Ensure we have at least a tiny sliver if 0 tasks so chart renders empty state or just show gray
    const data = [
        { name: 'Completed', value: completedCount > 0 ? completedCount : 0 },
        { name: 'Remaining', value: remainingCount }
    ];

    // Avoid 0/0 division or empty charts behaving weirdly
    // If no tasks, show full gray ring
    const isEmpty = taskCount === 0;
    const chartData = isEmpty ? [{ name: 'Empty', value: 1 }] : data;

    return (
        <div
            onClick={onClick}
            className={`
                group relative w-full h-60
                bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-3xl
                transition-all duration-300 ease-out
                hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] hover:border-indigo-500/30
                cursor-pointer overflow-hidden
                flex
                ${isEditing ? 'animate-pulse ring-1 ring-red-500/30' : ''}
            `}
        >
            {/* Inner Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

            {/* LEFT COLUMN: Context (Approx 65%) */}
            <div className="w-[65%] h-full p-5 flex flex-col justify-between gap-4 relative z-10 border-r border-slate-700/30">

                {/* Top Content */}
                <div>
                    <h3 className="font-bold text-lg text-white mt-1 leading-snug line-clamp-1" title={plan.title}>
                        {plan.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed font-medium">
                        {plan.description ? plan.description.replace(/<[^>]*>?/gm, '') : "No description provided for this plan."}
                    </p>
                </div>

                {/* Footer Chips */}
                <div className="flex flex-col gap-2 mt-auto w-full pr-2">
                    {/* Notes Chip */}
                    <button
                        className="flex items-center gap-3 p-2 w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group/chip text-left shadow-sm"
                        onClick={(e) => { e.stopPropagation(); /* Logic to go to notes? */ }}
                    >
                        <div className="w-8 h-8 flex shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300 group-hover/chip:scale-110 group-hover/chip:bg-white/20 transition-all">
                            <StickyNote size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-200">
                            {noteCount} Notes
                        </span>
                    </button>

                    {/* Mind Map Chip */}
                    {hasMindMap && (
                        <div className="flex items-center gap-3 p-2 w-full bg-white/5 border border-white/5 rounded-xl shadow-sm">
                            <div className="w-8 h-8 flex shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
                                <Network size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-200 leading-tight">
                                    Mind Map
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium leading-tight">
                                    Active
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Metrics (Approx 35%) */}
            <div className="w-[35%] h-full p-2 flex flex-col items-center justify-center relative z-10 bg-slate-800/10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest absolute top-5 right-5">
                    {Math.round((completedCount / (taskCount || 1)) * 100)}%
                </span>

                <div className="relative w-24 h-24 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                <linearGradient id="gradientProgress" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                            </defs>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={34}
                                outerRadius={42}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                                cornerRadius={4} // Rounded ends for the segments
                            >
                                {isEmpty ? (
                                    <Cell key="empty" fill="#334155" opacity={0.3} />
                                ) : (
                                    <>
                                        {/* Completed Slice */}
                                        <Cell key="completed" fill="url(#gradientProgress)" style={{ filter: 'drop-shadow(0px 0px 4px rgba(99, 102, 241, 0.5))' }} />
                                        {/* Remaining Slice */}
                                        <Cell key="remaining" fill="#334155" opacity={0.3} />
                                    </>
                                )}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Data */}
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-lg font-bold text-white shadow-black drop-shadow-md">
                            {completedCount}<span className="text-slate-500 text-xs font-normal">/{taskCount}</span>
                        </span>
                    </div>
                </div>

                <span className="text-[10px] font-medium text-slate-400 mt-[-4px] uppercase tracking-wide">
                    Tasks Done
                </span>
            </div>
        </div>
    );
}
