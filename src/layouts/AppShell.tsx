import { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, CheckSquare, FileText, Settings, Calendar, Menu, LogOut, GraduationCap, Briefcase, BookOpen, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWorkspace, type WorkspaceType } from '../contexts/WorkspaceContext';
import { motion, AnimatePresence } from 'framer-motion';

export type View = 'tasks' | 'notes' | 'dashboard' | 'settings' | 'planner' | 'library';

interface AppShellProps {
    children: React.ReactNode;
    currentView: View;
    onNavigate: (view: View) => void;
}

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Mini
    const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile Drawer
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { workspace, setWorkspace, theme } = useWorkspace();

    // Click outside handler for dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const primaryBg = `bg-${theme.primary}-600`;
    const primaryShadow = `shadow-${theme.primary}-500/20`;

    // Explicit Active Class builder
    const getActiveClass = (active: boolean) => active
        ? `${primaryBg} text-white shadow-lg ${primaryShadow}`
        : `text-slate-400 hover:bg-slate-800 hover:text-white`;

    const workspaces: { id: WorkspaceType; label: string; icon: React.ReactNode; color: string }[] = [
        { id: 'work', label: 'Work', icon: <Briefcase size={16} />, color: 'bg-indigo-600' },
        { id: 'learning', label: 'Learning', icon: <GraduationCap size={16} />, color: 'bg-emerald-600' }
    ];

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
                <div className="flex-1 flex justify-center px-4">
                    <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-white/5">
                        <div className={`w-6 h-6 ${primaryBg} rounded-md flex items-center justify-center`}>
                            {theme.icon}
                        </div>
                        <span className="text-sm font-bold text-white">{theme.label}</span>
                    </div>
                </div>
                <div className="w-10" /> {/* Spacer for balance */}
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
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
                    w-64 shadow-2xl lg:shadow-none
                `}
            >
                {/* Desktop Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`hidden lg:flex absolute -right-3 top-20 ${primaryBg} hover:opacity-90 text-white rounded-full p-1.5 shadow-lg z-50 transition-colors border-2 border-slate-950 items-center justify-center`}
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

                {/* LOGO & BRAND */}
                <div className={`px-6 mb-8 flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className={`w-10 h-10 ${primaryBg} rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shrink-0 transition-colors duration-300`}>
                        M
                    </div>
                    {!isCollapsed && (
                        <span className="font-bold text-xl tracking-tight text-white overflow-hidden whitespace-nowrap">
                            MyAdmin
                        </span>
                    )}
                </div>

                {/* WORKSPACE DROPDOWN */}
                <div className="px-4 mb-8 relative" ref={dropdownRef}>
                    <button
                        onClick={() => !isCollapsed && setIsDropdownOpen(!isDropdownOpen)}
                        className={`
                            w-full flex items-center gap-3 p-2 rounded-2xl transition-all duration-300
                            ${!isCollapsed ? 'bg-slate-950/50 border border-white/5 hover:bg-slate-900 hover:border-white/10' : 'justify-center hover:bg-slate-800'}
                        `}
                    >
                        <div className={`w-10 h-10 ${primaryBg} rounded-xl flex items-center justify-center font-bold text-white shadow-lg shrink-0 transition-colors duration-300`}>
                            {theme.icon}
                        </div>
                        <div className={`flex-1 flex flex-col items-start overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Workspace</span>
                            <div className="flex items-center gap-2 w-full justify-between">
                                <span className="text-sm font-bold text-white truncate">{theme.label}</span>
                                <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isDropdownOpen && !isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-full left-4 right-4 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[60] py-2 backdrop-blur-xl"
                            >
                                {workspaces.map((ws) => (
                                    <button
                                        key={ws.id}
                                        onClick={() => {
                                            setWorkspace(ws.id);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group
                                            ${workspace === ws.id ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}
                                        `}
                                    >
                                        <div className={`w-8 h-8 ${ws.color} rounded-lg flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform`}>
                                            {ws.icon}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-bold leading-none mb-0.5">{ws.label}</span>
                                            <span className="text-[10px] text-slate-500">Switch to {ws.label}</span>
                                        </div>
                                        {workspace === ws.id && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
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
