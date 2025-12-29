import { useState } from 'react';
import { LayoutDashboard, CheckSquare, FileText, Settings, Calendar, Menu, LogOut, GraduationCap, Briefcase, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';

export type View = 'tasks' | 'notes' | 'dashboard' | 'settings' | 'planner' | 'library';

interface AppShellProps {
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
}

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Mini
    const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile Drawer
    const { workspace, setWorkspace, theme } = useWorkspace();

    const primaryBg = `bg-${theme.primary}-600`;
    const primaryText = `text-${theme.primary}-100`;
    const primaryShadow = `shadow-${theme.primary}-500/20`;

    // Explicit Active Class builder
    const getActiveClass = (active: boolean) => active
        ? `${primaryBg} text-white shadow-lg ${primaryShadow}`
        : `text-slate-400 hover:bg-slate-800 hover:text-white`;

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
                <span className={`ml-3 font-bold text-lg ${primaryText}`}>MyAdmin</span>
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
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} // Increased width slightly for workspace switcher
                    w-64 shadow-2xl lg:shadow-none
                `}
            >
                {/* Desktop Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`hidden lg:flex absolute -right-3 top-8 ${primaryBg} hover:opacity-90 text-white rounded-full p-1.5 shadow-lg z-50 transition-colors border-2 border-slate-950 items-center justify-center`}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <Menu size={16} />
                </button>

                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <Menu size={20} className="rotate-90" />
                </button>

                {/* LOGO & WORKSPACE SWITCHER */}
                <div className={`px-4 mb-6 flex flex-col gap-4 transition-all duration-300 ${isCollapsed ? 'items-center' : ''}`}>
                    {/* Brand */}
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className={`w-10 h-10 ${primaryBg} rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shrink-0 transition-colors duration-300`}>
                            {workspace === 'work' ? 'W' : 'L'}
                        </div>
                        <span className={`ml-3 font-bold text-xl tracking-tight ${primaryText} overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'w-auto opacity-100'}`}>
                            MyAdmin
                        </span>
                    </div>

                    {/* Workspace Selector */}
                    <div className={`flex flex-col gap-1 ${isCollapsed ? 'hidden' : 'block'}`}>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2 mb-1">Workspace</label>
                        <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setWorkspace('work')}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold过渡 transition-all ${workspace === 'work' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Switch to Work Workspace"
                            >
                                <Briefcase size={14} />
                                <span>Work</span>
                            </button>
                            <button
                                onClick={() => setWorkspace('learning')}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${workspace === 'learning' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                title="Switch to Learning Workspace"
                            >
                                <GraduationCap size={14} />
                                <span>Learning</span>
                            </button>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 px-3">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={currentView === 'dashboard'}
                        onClick={() => { onNavigate('dashboard'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                        activeClass={getActiveClass(currentView === 'dashboard')}
                    />
                    <NavItem
                        icon={<Calendar size={20} />}
                        label="Planner"
                        active={currentView === 'planner'}
                        onClick={() => { onNavigate('planner'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                        activeClass={getActiveClass(currentView === 'planner')}
                    />
                    <NavItem
                        icon={<CheckSquare size={20} />}
                        label="Tasks"
                        active={currentView === 'tasks'}
                        onClick={() => { onNavigate('tasks'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                        activeClass={getActiveClass(currentView === 'tasks')}
                    />
                    <NavItem
                        icon={<FileText size={20} />}
                        label="Notes"
                        active={currentView === 'notes'}
                        onClick={() => { onNavigate('notes'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                        activeClass={getActiveClass(currentView === 'notes')}
                    />
                    {workspace === 'learning' && (
                        <NavItem
                            icon={<BookOpen size={20} />}
                            label="Library"
                            active={currentView === 'library'}
                            onClick={() => { onNavigate('library'); setIsMobileOpen(false); }}
                            collapsed={isCollapsed}
                            activeClass={getActiveClass(currentView === 'library')}
                        />
                    )}
                </nav>

                <div className="px-3 mt-auto space-y-1">
                    <NavItem
                        icon={<Settings size={20} />}
                        label="Settings"
                        active={currentView === 'settings'}
                        onClick={() => { onNavigate('settings'); setIsMobileOpen(false); }}
                        collapsed={isCollapsed}
                        activeClass={getActiveClass(currentView === 'settings')}
                    />
                    <div className="h-px bg-slate-800 mx-1 my-2" />
                    <NavItem
                        icon={<LogOut size={20} />}
                        label="Sign Out"
                        onClick={async () => {
                            try {
                                await supabase.auth.signOut();
                            } catch (e) {
                                console.error('Sign out failed', e);
                            } finally {
                                localStorage.clear(); // Always clear local state
                                window.location.href = import.meta.env.BASE_URL;
                            }
                        }}
                        collapsed={isCollapsed}
                        activeClass="text-slate-400 hover:bg-slate-800 hover:text-white"
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

function NavItem({ icon, label, onClick, collapsed, activeClass }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, collapsed?: boolean, activeClass: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${activeClass}
                ${collapsed ? 'justify-center' : 'justify-start'}
            `}
            title={collapsed ? label : undefined}
        >
            <span className={`shrink-0`}>
                {icon}
            </span>
            <span className={`ml-3 text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'w-auto opacity-100'} `}>
                {label}
            </span>
        </button>
    )
}
