import { useState } from 'react';
import { LayoutDashboard, CheckSquare, FileText, Settings, Calendar, Menu, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export type View = 'tasks' | 'notes' | 'dashboard' | 'settings' | 'planner';

interface AppShellProps {
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
}

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Mini
    const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile Drawer

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">

            {/* Mobile Header (Visible only on mobile) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center px-4 z-30">
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 -ml-2 text-slate-400 hover:text-white"
                >
                    <Menu size={24} />
                </button>
                <span className="ml-3 font-bold text-lg text-indigo-100">MyAdmin</span>
            </div>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 flex flex-col py-6 transition-transform duration-300 ease-in-out
                    lg:static lg:bg-slate-900/50 lg:backdrop-blur-xl lg:z-20
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-56'} // Size of sidebar
                    w-64 shadow-2xl lg:shadow-none
                `}
            >
                {/* Desktop Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex absolute -right-3 top-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-1.5 shadow-lg shadow-indigo-500/30 z-50 transition-colors border-2 border-slate-950 items-center justify-center"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <Menu size={16} />
                </button>

                {/* Mobile Close Button (Optional, can just click overlay) */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <Menu size={20} className="rotate-90" /> {/* Or X icon */}
                </button>

                <div className={`px-4 mb-8 flex items-center ${isCollapsed ? 'lg:justify-center' : ''}`}>
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 shrink-0">M</div>
                    <span className={`ml-3 font-bold text-xl tracking-tight text-indigo-100 overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'w-auto opacity-100'}`}>
                        MyAdmin
                    </span>
                </div>

                <nav className="flex-1 space-y-2 px-3">
                    <NavItem
                        icon={<LayoutDashboard size={22} />}
                        label="Dashboard"
                        active={currentView === 'dashboard'}
                        onClick={() => { onNavigate('dashboard'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<Calendar size={22} />}
                        label="Planner"
                        active={currentView === 'planner'}
                        onClick={() => { onNavigate('planner'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<CheckSquare size={22} />}
                        label="Tasks"
                        active={currentView === 'tasks'}
                        onClick={() => { onNavigate('tasks'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<FileText size={22} />}
                        label="Notes"
                        active={currentView === 'notes'}
                        onClick={() => { onNavigate('notes'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                    />
                </nav>

                <div className="px-3 mt-auto space-y-2">
                    <NavItem
                        icon={<Settings size={22} />}
                        label="Settings"
                        active={currentView === 'settings'}
                        onClick={() => { onNavigate('settings'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                    />
                    <div className="h-px bg-slate-800 mx-1 my-2" />
                    <NavItem
                        icon={<LogOut size={22} />}
                        label="Sign Out"
                        onClick={async () => {
                            try {
                                await supabase.auth.signOut();
                            } catch (e) {
                                console.error('Sign out failed', e);
                            } finally {
                                localStorage.clear(); // Always clear local state
                                // Use Vite's BASE_URL to correctly redirect to the app root (e.g. /MyAdmin/)
                                window.location.href = import.meta.env.BASE_URL;
                            }
                        }}
                        collapsed={isCollapsed}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative bg-slate-950 pt-16 lg:pt-0">
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
            <span className={`ml-3 text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'w-auto opacity-100'} `}>
                {label}
            </span>
        </button>
    )
}
