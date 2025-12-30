import { useTimer } from '../contexts/TimerContext';
import { Pause, Play, Square, Timer } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';

export function GlobalTimerStrip() {
    const { activeTaskId, activeTaskTitle, isRunning, elapsedTime, pauseTimer, startTimer, stopTimer, formatTime } = useTimer();
    const { theme } = useWorkspace();

    if (!activeTaskId) return null;

    const primaryText = `text-${theme.primary}-400`;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-xl border-t border-x border-slate-700/50 rounded-t-2xl px-6 py-2 shadow-2xl shadow-black flex items-center gap-6 pointer-events-auto transform translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg bg-slate-800 ${primaryText} animate-pulse`}>
                        <Timer size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Timer</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-mono font-medium">{formatTime(elapsedTime)}</span>
                            {activeTaskTitle && (
                                <>
                                    <span className="text-slate-600 text-[10px]">•</span>
                                    <span className="text-slate-400 text-xs font-medium max-w-[200px] truncate">{activeTaskTitle}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-800" />

                <div className="flex items-center gap-2">
                    {isRunning ? (
                        <button
                            onClick={pauseTimer}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                            title="Pause"
                        >
                            <Pause size={18} className="fill-current" />
                        </button>
                    ) : (
                        <button
                            onClick={() => startTimer(activeTaskId, activeTaskTitle || '')}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                            title="Resume"
                        >
                            <Play size={18} className="fill-current" />
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (window.confirm('Stop timer?')) stopTimer();
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-slate-300 hover:text-red-400 transition-colors"
                        title="Stop"
                    >
                        <Square size={18} className="fill-current" />
                    </button>
                </div>

                {/* Visual Progress Line */}
                <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent w-full opacity-50" />
            </div>
        </div>
    );
}
