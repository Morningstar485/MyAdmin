import { useTimer } from '../contexts/TimerContext';
import { Pause, Play, Square, RotateCcw } from 'lucide-react'; // Added RotateCcw
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalTimerStrip() {
    const { activeTaskId, activeTaskTitle, isRunning, elapsedTime, pauseTimer, startTimer, stopTimer, resetTimer } = useTimer();

    // Helper to split time
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    // Progress for seconds ring (0-60)
    // Stadium shape dimensions
    const width = 86;
    const height = 36;
    const strokeWidth = 3;
    const rx = height / 2; // Fully rounded ends

    // Calculate perimeter for dasharray
    // A rect with rx=ry has 4 90deg arcs (forming a circle) and 4 straight lines (2 horizontal, 2 vertical - but vertical are 0 length if rx=height/2)
    // Actually, simply: 2 * PI * rx + 2 * (width - 2 * rx)
    const straightLen = width - 2 * rx;
    const perimeter = (2 * Math.PI * rx) + (2 * straightLen);

    const progress = (seconds / 60) * 100;
    const dashOffset = perimeter - (progress / 100) * perimeter;

    return (
        <AnimatePresence>
            {activeTaskId && (
                <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-[#0F172A] border-t border-x border-blue-900/30 rounded-t-2xl px-6 py-2 shadow-2xl shadow-blue-900/20 flex items-center justify-between pointer-events-auto w-full max-w-3xl gap-6 relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

                        {/* Left Side: Text Info */}
                        <div className="flex flex-col min-w-0 flex-1 relative z-10">
                            <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">Working on:</span>
                            <span className="text-slate-100 text-sm font-bold truncate pr-4" title={activeTaskTitle || 'Untitled Task'}>
                                {activeTaskTitle || 'Untitled Task'}
                            </span>
                        </div>

                        {/* Center: Oval Timer */}
                        <div className="relative z-10 flex items-center justify-center shrink-0">
                            <div className="relative" style={{ width, height }}>
                                {/* SVG Ring */}
                                <svg className="absolute inset-0 w-full h-full">
                                    {/* Track */}
                                    <rect
                                        x={strokeWidth / 2}
                                        y={strokeWidth / 2}
                                        width={width - strokeWidth}
                                        height={height - strokeWidth}
                                        rx={rx - strokeWidth / 2}
                                        className="stroke-slate-800"
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                    />
                                    {/* Progress */}
                                    <rect
                                        x={strokeWidth / 2}
                                        y={strokeWidth / 2}
                                        width={width - strokeWidth}
                                        height={height - strokeWidth}
                                        rx={rx - strokeWidth / 2}
                                        className="stroke-emerald-500 transition-all duration-300 ease-linear"
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                        strokeDasharray={perimeter}
                                        strokeDashoffset={dashOffset}
                                        strokeLinecap="round"
                                    />
                                </svg>

                                {/* Time Text */}
                                <div className="absolute inset-0 flex items-center justify-center gap-1.5 pb-0.5">
                                    <span className="text-white text-base font-bold tabular-nums tracking-tight">{minutes}m</span>
                                    <span className="text-slate-400 text-xs font-medium tabular-nums">{seconds}s</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Controls */}
                        <div className="flex items-center gap-2 relative z-10 flex-1 justify-end">
                            {isRunning ? (
                                <button
                                    onClick={pauseTimer}
                                    className="w-9 h-9 rounded-full bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-amber-300 flex items-center justify-center transition-all border border-slate-700 shadow-lg"
                                    title="Pause"
                                >
                                    <Pause size={14} className="fill-current" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => startTimer(activeTaskId, activeTaskTitle || '')}
                                    className="w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300 flex items-center justify-center transition-all border border-emerald-500/20 shadow-lg shadow-emerald-900/20"
                                    title="Resume"
                                >
                                    <Play size={14} className="fill-current ml-0.5" />
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (window.confirm('Restart timer?')) resetTimer();
                                }}
                                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400 flex items-center justify-center transition-all border border-slate-700 hover:border-blue-500/30"
                                title="Restart"
                            >
                                <RotateCcw size={13} />
                            </button>

                            <button
                                onClick={() => {
                                    if (window.confirm('Stop active timer?')) stopTimer();
                                }}
                                className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all border border-slate-700 hover:border-red-500/30"
                                title="Stop"
                            >
                                <Square size={13} className="fill-current" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
