import { useState, useRef, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Trash2, AlertTriangle, Calendar, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CleanupModal } from './components/CleanupModal';
import { TagsManager } from './components/TagsManager';
import { ColumnManager, type ColumnManagerHandle } from './components/ColumnManager';
import { PlanColumnManager, type PlanColumnManagerHandle } from './components/PlanColumnManager';
import { useNavigation } from '../../contexts/NavigationContext';

export function SettingsBoard() {
    // Calculate default date (e.g., 30 days ago) for suggestion
    const getDefaultDate = () => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    };

    const [retentionDate, setRetentionDate] = useState(getDefaultDate());
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);

    // Save / Dirty State Management
    const [dirtyComponents, setDirtyComponents] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const { setBlocker } = useNavigation();

    const columnManagerRef = useRef<ColumnManagerHandle>(null);
    const planColumnManagerRef = useRef<PlanColumnManagerHandle>(null);

    const hasUnsavedChanges = dirtyComponents.size > 0;

    // Register Navigation Blocker
    useEffect(() => {
        if (hasUnsavedChanges) {
            setBlocker(() => true);
        } else {
            setBlocker(null);
        }
        return () => setBlocker(null);
    }, [hasUnsavedChanges, setBlocker]);

    const handleDirtyChange = useCallback((id: string, isDirty: boolean) => {
        setDirtyComponents(prev => {
            const next = new Set(prev);
            if (isDirty) next.add(id);
            else {
                next.delete(id);
            }
            // Optimization: If set size and content hasn't changed, return previous reference to avoid re-render
            if (prev.size === next.size && prev.has(id) === next.has(id)) return prev;
            return next;
        });
    }, []);

    const handleSaveAll = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const promises = [];
            if (dirtyComponents.has('columns') && columnManagerRef.current) {
                promises.push(columnManagerRef.current.save());
            }
            if (dirtyComponents.has('plans') && planColumnManagerRef.current) {
                promises.push(planColumnManagerRef.current.save());
            }
            // Add tags manager if needed later

            await Promise.all(promises);

            setDirtyComponents(new Set());
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save some settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        if (!window.confirm("Discard all unsaved changes?")) return;

        if (columnManagerRef.current) columnManagerRef.current.reset();
        if (planColumnManagerRef.current) planColumnManagerRef.current.reset();

        setDirtyComponents(new Set());
    };

    const handleCleanupClick = () => {
        if (!retentionDate) {
            alert('Please select a date first.');
            return;
        }
        setIsCleanupModalOpen(true);
    };

    const handleConfirmCleanup = async () => {
        if (isDeleting) return;
        setIsDeleting(true);

        try {
            // Delete archived tasks older than the date
            const { error, count } = await supabase
                .from('todos')
                .delete({ count: 'exact' })
                .eq('is_archived', true)
                .lt('created_at', retentionDate + 'T00:00:00');

            if (error) throw error;

            alert(`Cleanup successful! Deleted ${count} archived tasks.`);
            setIsCleanupModalOpen(false);
        } catch (error) {
            console.error('Error cleaning up data:', error);
            alert('Failed to clean up data.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="h-full flex flex-col px-6 pt-6 touch-none overflow-y-auto pb-20 relative">
            <PageHeader
                title="Settings"
                description="Manage your application preferences."
            />

            <div className="max-w-2xl space-y-8 pb-24">
                {/* Data Management Section */}
                <section className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">Data Cleanup</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Permanently delete archived tasks to free up space.
                                <span className="text-red-400 block mt-1 flex items-center gap-1">
                                    <AlertTriangle size={14} />
                                    Warning: This action cannot be undone.
                                </span>
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="w-full sm:w-auto">
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                                        Delete tasks before
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="date"
                                            value={retentionDate}
                                            onChange={(e) => setRetentionDate(e.target.value)}
                                            className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCleanupClick}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                                >
                                    Clear Archived Data
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Task Sections Manager */}
                <ColumnManager
                    ref={columnManagerRef}
                    onDirtyChange={(d) => handleDirtyChange('columns', d)}
                />

                {/* Planner Sections Manager */}
                <PlanColumnManager
                    ref={planColumnManagerRef}
                    onDirtyChange={(d) => handleDirtyChange('plans', d)}
                />

                {/* Tags Manager */}
                <TagsManager />

                {/* Placeholder for other settings */}
                <section className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 opacity-50 pointer-events-none">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500">
                            <Save size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">General</h3>
                            <p className="text-slate-400 text-sm">More settings coming soon...</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Floating Save Actions */}
            <div className={`
                fixed bottom-6 right-6 flex items-center gap-3 transition-all duration-300 transform z-50
                ${hasUnsavedChanges ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
            `}>
                <button
                    onClick={handleDiscard}
                    className="px-4 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-full shadow-lg border border-slate-700 font-medium flex items-center gap-2"
                >
                    <X size={20} />
                    Discard
                </button>
                <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-600/30 font-bold flex items-center gap-2 transition-transform active:scale-95"
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save size={20} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            <CleanupModal
                isOpen={isCleanupModalOpen}
                onClose={() => setIsCleanupModalOpen(false)}
                onConfirm={handleConfirmCleanup}
                date={retentionDate}
                isDeleting={isDeleting}
            />
        </div>
    );
}
