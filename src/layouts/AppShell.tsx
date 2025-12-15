import React from 'react';
import { CheckSquare, Settings, StickyNote, LayoutDashboard } from 'lucide-react';

type View = 'tasks' | 'notes' | 'dashboard' | 'settings';

interface AppShellProps {
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
}

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Sidebar - Simplified for "Website for eternity" */}
            <aside className="w-20 lg:w-64 border-r border-slate-800 flex flex-col py-6 bg-slate-900/50 backdrop-blur-xl">
                <div className="px-4 mb-8 flex items-center justify-center lg:justify-start">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">M</div>
                    <span className="ml-3 font-bold text-xl hidden lg:block tracking-tight text-indigo-100">MyAdmin</span>
                </div>

                <nav className="flex-1 space-y-2 px-3">
                    <NavItem
                        icon={<LayoutDashboard size={22} />}
                        label="Dashboard"
                        active={currentView === 'dashboard'}
                        onClick={() => onNavigate('dashboard')}
                    />
                    <NavItem
                        icon={<CheckSquare size={22} />}
                        label="Tasks"
                        active={currentView === 'tasks'}
                        onClick={() => onNavigate('tasks')}
                    />
                    <NavItem
                        icon={<StickyNote size={22} />}
                        label="Notes"
                        active={currentView === 'notes'}
                        onClick={() => onNavigate('notes')}
                    />
                </nav>

                <div className="px-3 mt-auto">
                    <NavItem
                        icon={<Settings size={22} />}
                        label="Settings"
                        active={currentView === 'settings'}
                        onClick={() => onNavigate('settings')}
                    />
                </div>
            </aside>

            <main className="flex-1 overflow-hidden relative bg-slate-950">
                {children}
            </main>
        </div>
    );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center w-full p-3 rounded-xl transition-all duration-200 group 
                ${active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }
            `}
        >
            <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {icon}
            </span>
            <span className="ml-3 hidden lg:block text-sm font-medium">{label}</span>
        </button>
    )
}
