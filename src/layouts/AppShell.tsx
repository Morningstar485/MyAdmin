import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, FileText, Settings, Calendar, Menu } from 'lucide-react';

export type View = 'tasks' | 'notes' | 'dashboard' | 'settings' | 'planner';

interface AppShellProps {
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
}

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Sidebar */}
            <aside
                className={`
                    ${isCollapsed ? 'w-20' : 'w-20 lg:w-64'}
                    border-r border-slate-800 flex flex-col py-6 bg-slate-900/50 backdrop-blur-xl transition-all duration-300 ease-in-out relative z-20
                `}
            >
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-1.5 shadow-lg shadow-indigo-500/30 z-50 transition-colors border-2 border-slate-950"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <Menu size={16} />
                </button>

                <div className={`px-4 mb-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-center lg:justify-start'} `}>
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 shrink-0">M</div>
                    <span className={`ml-3 font-bold text-xl tracking-tight text-indigo-100 overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 hidden lg:block'} `}>
                        MyAdmin
                    </span>
                </div>

                <nav className="flex-1 space-y-2 px-3">
                    <NavItem
                        icon={<LayoutDashboard size={22} />}
                        label="Dashboard"
                        active={currentView === 'dashboard'}
                        onClick={() => onNavigate('dashboard')}
                        collapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<Calendar size={22} />}
                        label="Planner"
                        active={currentView === 'planner'}
                        onClick={() => onNavigate('planner')}
                        collapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<CheckSquare size={22} />}
                        label="Tasks"
                        active={currentView === 'tasks'}
                        onClick={() => onNavigate('tasks')}
                        collapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<FileText size={22} />}
                        label="Notes"
                        active={currentView === 'notes'}
                        onClick={() => onNavigate('notes')}
                        collapsed={isCollapsed}
                    />
                </nav>

                <div className="px-3 mt-auto">
                    <NavItem
                        icon={<Settings size={22} />}
                        label="Settings"
                        active={currentView === 'settings'}
                        onClick={() => onNavigate('settings')}
                        collapsed={isCollapsed}
                    />
                </div>
            </aside>

            <main className="flex-1 overflow-hidden relative bg-slate-950">
                {children}
            </main>
        </div>
    );
}

function NavItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, collapsed?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
                ${collapsed ? 'justify-center' : 'justify-start'}
            `}
            title={collapsed ? label : undefined}
        >
            <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} shrink-0`}>
                {icon}
            </span>
            <span className={`ml-3 text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 hidden lg:block'} `}>
                {label}
            </span>
        </button>
    )
}
