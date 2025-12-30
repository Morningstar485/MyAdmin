import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface TimerState {
    activeTaskId: string | null;
    activeTaskTitle: string | null;
    isRunning: boolean;
    startTime: number | null; // Timestamp when the current session started (if running)
    accumulatedTime: number; // Seconds accumulated before the current session
}

interface TimerContextType {
    activeTaskId: string | null;
    activeTaskTitle: string | null;
    isRunning: boolean;
    elapsedTime: number; // Total seconds (accumulated + current session)
    startTimer: (taskId: string, taskTitle: string) => void;
    pauseTimer: () => void;
    stopTimer: () => void;
    formatTime: (seconds: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<TimerState>(() => {
        const saved = localStorage.getItem('myadmin_timer');
        return saved ? JSON.parse(saved) : {
            activeTaskId: null,
            activeTaskTitle: null,
            isRunning: false,
            startTime: null,
            accumulatedTime: 0
        };
    });

    const [elapsedTime, setElapsedTime] = useState(0);
    const intervalRef = useRef<number | null>(null);

    // Persist state changes
    useEffect(() => {
        localStorage.setItem('myadmin_timer', JSON.stringify(state));
    }, [state]);

    // Calculate elapsed time
    const calculateElapsed = () => {
        if (!state.activeTaskId) return 0;

        let currentSession = 0;
        if (state.isRunning && state.startTime) {
            currentSession = Math.floor((Date.now() - state.startTime) / 1000);
        }
        return state.accumulatedTime + currentSession;
    };

    // Update elapsed time periodically
    useEffect(() => {
        setElapsedTime(calculateElapsed());

        if (state.isRunning) {
            intervalRef.current = window.setInterval(() => {
                setElapsedTime(calculateElapsed());
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state.isRunning, state.startTime, state.accumulatedTime]);

    const startTimer = (taskId: string, taskTitle: string) => {
        setState(prev => {
            // If checking into a different task, save the previous one's state effectively by resetting? 
            // For now, let's assume switching tasks resets the previous one implies stopping it first?
            // Actually, we should probably support switching directly.

            if (prev.activeTaskId === taskId && prev.isRunning) return prev; // Already running

            const now = Date.now();

            // Switching tasks or starting from scratch
            if (prev.activeTaskId !== taskId) {
                return {
                    activeTaskId: taskId,
                    activeTaskTitle: taskTitle,
                    isRunning: true,
                    startTime: now,
                    accumulatedTime: 0 // New task starts at 0
                };
            }

            // Resuming same task
            return {
                ...prev,
                activeTaskTitle: taskTitle,
                isRunning: true,
                startTime: now
            };
        });
    };

    const pauseTimer = () => {
        setState(prev => {
            if (!prev.isRunning || !prev.startTime) return prev;

            const now = Date.now();
            const sessionSeconds = Math.floor((now - prev.startTime) / 1000);

            return {
                ...prev,
                isRunning: false,
                startTime: null,
                accumulatedTime: prev.accumulatedTime + sessionSeconds
            };
        });
    };

    const stopTimer = () => {
        setState({
            activeTaskId: null,
            activeTaskTitle: null,
            isRunning: false,
            startTime: null,
            accumulatedTime: 0
        });
        setElapsedTime(0);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}h ${m}m ${s}s`;
        }
        return `${m}m ${s}s`;
    };

    return (
        <TimerContext.Provider value={{
            activeTaskId: state.activeTaskId,
            activeTaskTitle: state.activeTaskTitle,
            isRunning: state.isRunning,
            elapsedTime,
            startTimer,
            pauseTimer,
            stopTimer,
            formatTime
        }}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}
