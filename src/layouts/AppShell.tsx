import { useState } from 'react';
import { LayoutDashboard, CheckSquare, FileText, Settings, Calendar, Menu, LogOut, Briefcase, GraduationCap, ChevronDown, BookOpen } from 'lucide-react';
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
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

    const { workspace, setWorkspace, theme } = useWorkspace();

    const isWork = workspace === 'work';

    // Tailwind classes need to be static for JIT, but we can dynamic them via explicit classes or style vars if complicated.
    // However, requested simple color swap: Indigo -> Teal. 
    // We will use template strings since Tailwind scanner usually picks them up if full class name is present, 
    // OR we can make a helper. For safety, let's map them explicitly or assume standard palette. 

    const primaryBg = isWork ? 'bg-indigo-600' : 'bg-teal-600';
    const primaryText = isWork ? 'text-indigo-100' : 'text-teal-100';
    const primaryShadow = isWork ? 'shadow-indigo-500/20' : 'shadow-teal-500/20'; // Keeping text-white for active

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
                        <div className={`w-10 h-10 ${primaryBg} rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shrink-0 transition-colors duration-300`}>M</div>
                        <span className={`ml-3 font-bold text-xl tracking-tight ${primaryText} overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'w-auto opacity-100'}`}>
                            MyAdmin
                        </span>
                    </div>

                    {/* Workspace Switcher */}
                    <div className="relative w-full">
                        <button
                            onClick={() => !isCollapsed && setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                            className={`
                                w-full flex items-center gap-3 p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors
                                ${isCollapsed ? 'justify-center border-none bg-transparent hover:bg-transparent cursor-default' : ''}
                            `}
                        >
                            <div className={`p-1.5 rounded-md ${isWork ? 'bg-indigo-500/10 text-indigo-400' : 'bg-teal-500/10 text-teal-400'} shrink-0`}>
                                {isWork ? <Briefcase size={18} /> : <GraduationCap size={18} />}
                            </div>

                            {!isCollapsed && (
                                <>
                                    <div className="flex flex-col items-start flex-1 overflow-hidden">
                                        <span className="text-xs font-semibold text-slate-200 truncate">{theme.label}</span>
                                        <span className="text-[10px] text-slate-500 truncate">Workspace</span>
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-500 transition-transform ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
                                </>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {isWorkspaceMenuOpen && !isCollapsed && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                                <button
                                    onClick={() => { setWorkspace('work'); setIsWorkspaceMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-800 transition-colors text-left"
                                >
                                    <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
                                        <Briefcase size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-200">Work</span>
                                        <span className="text-[10px] text-slate-500">Productivity</span>
                                    </div>
                                    {isWork && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                </button>
                                <div className="h-px bg-slate-800" />
                                <button
                                    onClick={() => { setWorkspace('learning'); setIsWorkspaceMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-800 transition-colors text-left"
                                >
                                    <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-400">
                                        <GraduationCap size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-200">Learning</span>
                                        <span className="text-[10px] text-slate-500">Study & Growth</span>
                                    </div>
                                    {!isWork && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />}
                                </button>
                            </div>
                        )}

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
                    {!isWork && (
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
