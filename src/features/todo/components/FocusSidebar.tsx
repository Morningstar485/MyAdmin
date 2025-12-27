import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Calendar, Clock, Settings, X, Check } from 'lucide-react';
import { useGoogleCalendar } from '../../../hooks/useGoogleCalendar';

export function FocusSidebar() {
    return (
        <div className="flex flex-col gap-4 h-full min-w-[220px]">
            <PomodoroTimer />
            <QuickCalendarAdd />
        </div>
    );
}

function PomodoroTimer() {
    // Config State
    const [focusTime, setFocusTime] = useState(25);
    const [breakTime, setBreakTime] = useState(5);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? focusTime * 60 : breakTime * 60);
    };

    const switchMode = (newMode: 'focus' | 'break') => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === 'focus' ? focusTime * 60 : breakTime * 60);
    };

    // Update timeLeft if config changes and timer is not active
    useEffect(() => {
        if (!isActive) {
            setTimeLeft(mode === 'focus' ? focusTime * 60 : breakTime * 60);
        }
    }, [focusTime, breakTime]);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Simple notification sound
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play().catch(() => { }); // catch if autoplay blocked
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const totalTime = mode === 'focus' ? focusTime * 60 : breakTime * 60;
    const progress = ((totalTime - timeLeft) / totalTime) * 100;

    return (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center shadow-xl relative overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

            {/* Header / Settings Toggle */}
            <div className="w-full flex justify-between items-center mb-4 relative z-10">
                <div className="flex bg-slate-800/80 rounded-lg p-1">
                    <button
                        onClick={() => switchMode('focus')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${mode === 'focus' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Focus
                    </button>
                    <button
                        onClick={() => switchMode('break')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${mode === 'break' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Break
                    </button>
                </div>
                <button
                    onClick={() => setIsConfigOpen(!isConfigOpen)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Settings size={14} />
                </button>
            </div>

            {/* Configuration Overlay */}
            {isConfigOpen && (
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-20 flex flex-col p-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Timer Settings</span>
                        <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Focus (min)</label>
                            <input
                                type="number"
                                value={focusTime}
                                onChange={(e) => setFocusTime(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Break (min)</label>
                            <input
                                type="number"
                                value={breakTime}
                                onChange={(e) => setBreakTime(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white outline-none focus:border-emerald-500"
                            />
                        </div>
                        <button
                            onClick={() => setIsConfigOpen(false)}
                            className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-600/50 rounded py-1.5 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 mt-2 transition-colors"
                        >
                            <Check size={12} /> Done
                        </button>
                    </div>
                </div>
            )}

            {/* Timer Display */}
            <div className="relative mb-4">
                {/* Circular Progress (Smaller SVG) */}
                <svg className="w-28 h-28 transform -rotate-90">
                    <circle
                        cx="56"
                        cy="56"
                        r="50"
                        className="stroke-slate-800"
                        strokeWidth="6"
                        fill="transparent"
                    />
                    <circle
                        cx="56"
                        cy="56"
                        r="50"
                        className={`transition-all duration-1000 ease-linear ${mode === 'focus' ? 'stroke-indigo-500' : 'stroke-emerald-500'}`}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray="314"
                        strokeDashoffset={314 - (314 * progress) / 100}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-mono font-bold text-slate-100 tracking-wider">
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 z-10">
                <button
                    onClick={toggleTimer}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive
                        ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        : 'bg-white text-slate-900 hover:scale-105 shadow-lg shadow-white/10'
                        }`}
                >
                    {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <button
                    onClick={resetTimer}
                    className="w-8 h-8 rounded-full bg-slate-800/50 text-slate-400 border border-slate-700/50 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all"
                >
                    <RotateCcw size={14} />
                </button>
            </div>
        </div>
    );
}

function QuickCalendarAdd() {
    const { createEvent } = useGoogleCalendar();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Default start time to next hour
    useEffect(() => {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        // Format for datetime-local: YYYY-MM-DDTHH:MM
        const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setStartTime(localIso);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !startTime) return;

        setIsSubmitting(true);
        const success = await createEvent(title, new Date(startTime), duration, description);
        setIsSubmitting(false);

        if (success) {
            setTitle('');
            setDescription('');
            alert('Event added to Google Calendar!');
        }
    };

    return (
        <div className="flex flex-col bg-slate-900/50 border border-slate-700/50 rounded-2xl shadow-lg flex-1 min-h-0 overflow-hidden">
            <div className="p-5 pb-2 shrink-0 flex items-center gap-2 text-slate-300 font-semibold">
                <Calendar size={18} className="text-indigo-400" />
                <h3>Quick Add Event</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-5 pt-2 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Event Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Team Sync"
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600 transition-all outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Description <span className="text-slate-600 normal-case tracking-normal">(optional)</span></label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add details..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 placeholder-slate-600 transition-all outline-none resize-none h-14"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Start Time</label>
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Duration (min)</label>
                    <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                        <Clock size={14} className="text-slate-500" />
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="bg-transparent text-sm text-white w-full outline-none"
                            min="5"
                            step="5"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium py-2 text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Plus size={16} strokeWidth={2.5} />
                            Add to Calendar
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
