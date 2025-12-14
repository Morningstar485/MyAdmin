import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 flex flex-col items-start justify-between min-h-[140px] hover:bg-slate-800/80 transition-all hover:shadow-lg shadow-black/20 group">
            <div className="flex items-center justify-between w-full mb-4">
                <span className="text-slate-400 font-medium text-sm tracking-wide">{title}</span>
                <div className={`p-2 rounded-lg bg-opacity-20 ${color.replace('text-', 'bg-')} ${color}`}>
                    <Icon size={20} />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
                {subtitle && (
                    <span className="text-xs text-slate-500">{subtitle}</span>
                )}
            </div>
        </div>
    )
}
