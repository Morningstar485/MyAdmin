import React from 'react';

interface Stat {
    label: string;
    value: string | number;
}

interface PageHeaderProps {
    title: string;
    description: string;
    children?: React.ReactNode;
    stats?: Stat[];
    progress?: number;
}

export function PageHeader({ title, description, children, stats, progress }: PageHeaderProps) {
    return (
        <div className="mb-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm shadow-lg shadow-black/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-white tracking-tight leading-none">{title}</h1>

                        {/* Inline Stats & Progress */}
                        <div className="flex items-center gap-2">
                            {typeof progress === 'number' && (
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-700/50 rounded-full border border-slate-600/50">
                                    <div className="w-16 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-300">{Math.round(progress)}%</span>
                                </div>
                            )}

                            {stats && stats.map((stat, index) => (
                                <div key={index} className="px-2.5 py-1 bg-slate-700/50 rounded-full border border-slate-600/50 flex items-center gap-1.5">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">{stat.label}</span>
                                    <span className="text-xs font-bold text-slate-200">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {description && <p className="text-sm text-slate-400 font-medium">{description}</p>}
                </div>

                {children && (
                    <div className="flex items-center gap-3">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
