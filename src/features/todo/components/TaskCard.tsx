import type { Todo } from '../types';
import { Clock, Check, Edit2, Share2 } from 'lucide-react';

interface TaskCardProps {
    todo: Todo;
    onToggle: (id: string) => void;
    isEditing?: boolean;
    onEdit?: (todo: Todo) => void;
    onClick?: (todo: Todo) => void;
    isCompact?: boolean;
}

export function TaskCard({ todo, onToggle, isEditing, onEdit, onClick, isCompact = false }: TaskCardProps) {
    const isCompleted = todo.completed;

    // Deadline Visuals
    const now = new Date();
    const dueDate = todo.due_date ? new Date(todo.due_date) : null;

    // Formatting Date: "Today 3:00PM"
    let dateDisplay = '';
    if (dueDate) {
        const isToday = dueDate.toDateString() === now.toDateString();
        const timeStr = dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        dateDisplay = isToday ? `Today ${timeStr}` : `${dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
    }

    let deadlineClass = '';
    let hoverClass = 'hover:ring-blue-700 hover:border-blue-700'; // Default Blue Hover

    const timeLeft = dueDate ? dueDate.getTime() - now.getTime() : null;
    const hoursLeft = timeLeft ? timeLeft / (1000 * 60 * 60) : null;

    if (dueDate && !isCompleted) {
        if (timeLeft && timeLeft < 0) {
            deadlineClass = 'border-red-500/50 hover:border-red-500'; // Overdue
            hoverClass = 'hover:ring-red-500 hover:border-red-500'; // Keep Red on Hover
        } else if (hoursLeft && hoursLeft < 10) {
            deadlineClass = 'border-yellow-500/50 hover:border-yellow-500'; // Urgent (< 10h)
            hoverClass = 'hover:ring-yellow-500 hover:border-yellow-500'; // Keep Yellow on Hover
        }
    }

    const isArchived = todo.is_archived;

    return (
        <div
            className={`
                group relative border
                transition-all duration-300 ease-out
                ${isCompact ? 'p-2 rounded-lg' : 'p-4 rounded-xl'}
                ${isArchived
                    ? 'bg-emerald-900/20 border-emerald-500/30 hover:bg-emerald-900/40 hover:border-emerald-500/50'
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-black/20'
                }
                ${isCompleted && !isArchived ? 'opacity-50 hover:opacity-100 grayscale-[0.5]' : ''}
                ${isEditing ? `cursor-pointer border-solid hover:ring-2 ${hoverClass}` : ''}
                ${deadlineClass}
            `}
            onClick={() => {
                if (isEditing) {
                    onEdit?.(todo);
                } else {
                    onClick?.(todo);
                }
            }}
        >
            {/* Top Row: Checkbox | Title | Date & Icons */}
            <div className="flex justify-between items-start gap-3">

                {/* Checkbox (Left) */}
                <div className="pt-0.5 shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(todo.id);
                        }}
                        className={`
                            border flex items-center justify-center transition-all
                            ${isCompact ? 'w-3.5 h-3.5 rounded-sm' : 'w-4 h-4 rounded-sm'}
                            ${isCompleted
                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                : 'border-slate-500 hover:border-indigo-400 text-transparent'
                            }
                        `}
                    >
                        <Check size={isCompact ? 8 : 10} strokeWidth={3} />
                    </button>
                </div>

                {/* Left: Title */}
                <h3 className={`
                    font-medium text-slate-200 leading-snug truncate flex-1
                    ${isCompact ? 'text-sm' : 'text-[15px]'}
                    ${isCompleted ? 'line-through decoration-slate-600' : ''}
                `}>
                    {todo.title}
                </h3>

                {/* Right: Date & Icons */}
                <div className="flex items-center gap-2 shrink-0">
                    {dueDate && (
                        <span className={`text-xs font-medium ${hoursLeft && hoursLeft < 0 ? 'text-red-400' :
                            hoursLeft && hoursLeft < 10 ? 'text-yellow-400' : 'text-slate-400'
                            }`}>
                            {dateDisplay}
                        </span>
                    )}

                    {/* Icons: Edit | Google Sync | Clock */}
                    <div className="flex items-center gap-1">
                        {isEditing ? (
                            <div className="w-5 h-5 bg-yellow-500/20 rounded text-yellow-500 flex items-center justify-center border border-yellow-500/30" title="Edit Mode">
                                <Edit2 size={12} strokeWidth={2.5} />
                            </div>
                        ) : todo.google_task_id ? (
                            <div className="w-5 h-5 bg-blue-500/20 rounded text-blue-400 flex items-center justify-center border border-blue-500/30" title="Synced with Google Tasks">
                                <Share2 size={12} strokeWidth={2.5} />
                            </div>
                        ) : (
                            <div className="w-5 h-5 bg-[#2C2C2E] rounded text-blue-400 flex items-center justify-center border border-[#3A3A3C]" title="Due Time">
                                <Clock size={12} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Tags | Duration */}
            <div className="flex justify-between items-end mt-4">
                {/* Left: Tags / Plan */}
                <div className="flex flex-wrap items-center gap-2">
                    {todo.plan && (
                        <div className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
                            {todo.plan.title}
                        </div>
                    )}
                    {todo.tags && todo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 min-w-0">
                            {todo.tags.map(tag => (
                                <div key={tag.id} className="flex items-center px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tag.color}`}></div>
                                    <span className="text-[10px] text-slate-300 font-medium leading-tight">{tag.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Duration */}
                {todo.duration && todo.duration > 0 && (
                    <div className="text-xs text-slate-500 font-medium">
                        {todo.duration}min
                    </div>
                )}
            </div>

            {/* Edit/Delete Actions (Hidden by default, standard pattern) */}
            {/* We can keep the toggle check circle or remove it if moving to pure card style (User image didn't show check circle, but it's useful). Keeping check circle overlay or distinct click area might be needed. For now, removing the big check circle to match the 'clean text' look of the image, user can click card or we add a small check action. 
                *Decision*: The user image DOESN'T show a check circle. It looks like a pure info card. 
                I will remove the big left check circle and make the whole card clickable or keep standard actions hidden.
                Wait, how does one complete it? I'll re-add a small check button or assume 'Edit Mode' handles it. 
                Let's keep functionality safe: Add a hoverable 'Complete' action or just keep the card click = detail. 
                User said "design for the tasks like this", implying visuals.
                I will hide the big check circle to match the image match. 
            */}
        </div>
    )
}
