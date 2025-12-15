import { Clock, CheckCircle, Trash2 } from 'lucide-react';
import { type Plan } from '../../todo/types';

interface PlanCardProps {
    plan: Plan;
    onClick: () => void;
    taskCount: number;
    completedCount: number;
    isEditing?: boolean;
    onDelete?: () => void;
}

export function PlanCard({ plan, onClick, taskCount, completedCount, isEditing, onDelete }: PlanCardProps) {
    const progress = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;

    return (
        <div
            onClick={onClick}
            className={`group bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600 rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer flex flex-col gap-3 mb-4 relative ${isEditing ? 'animate-pulse ring-1 ring-red-500/30' : ''}`}
        >
            {isEditing && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.();
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                >
                    <Trash2 size={14} />
                </button>
            )}

            <div>
                <h3 className="font-semibold text-slate-100 text-lg leading-tight mb-1">{plan.title}</h3>
                {plan.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{plan.description}</p>
                )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <div className="flex items-center gap-1.5">
                    <CheckCircle size={14} className={progress === 100 ? "text-emerald-500" : "text-slate-500"} />
                    <span>{completedCount}/{taskCount} Tasks</span>
                </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden w-full mt-1">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
