import { useState, useEffect } from 'react';
import { Tag as TagIcon, X, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { type Tag, TAG_COLORS } from '../../todo/types';
import { Modal } from '../../../components/Modal';

export function TagsManager() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);

    // Creation State
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);
    const [isCreating, setIsCreating] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .order('name');

            if (error) throw error;
            if (data) setTags(data);
        } catch (error) {
            console.error('Error fetching tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        setIsCreating(true);

        const { data, error } = await supabase
            .from('tags')
            .insert([{ name: newTagName.trim(), color: newTagColor }])
            .select()
            .single();

        if (error) {
            console.error('Error creating tag:', error);
            alert('Failed to create tag');
        } else if (data) {
            setTags(prev => [...prev, data]);
            setNewTagName('');
            setNewTagColor(TAG_COLORS[0].value);
            setIsCreateModalOpen(false);
        }
        setIsCreating(false);
    };

    const handleDeleteTag = async (id: string, name: string) => {
        if (!window.confirm(`Delete tag "${name}"? This will remove it from all tasks that use it.`)) return;

        setTags(prev => prev.filter(t => t.id !== id));

        const { error } = await supabase
            .from('tags')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting tag:', error);
            alert('Failed to delete tag');
            fetchTags(); // Revert on error
        }
    };

    if (loading) return <div className="text-slate-500 text-sm">Loading tags...</div>;

    return (
        <section className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                        <TagIcon size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Tags Manager</h3>
                        <p className="text-slate-400 text-sm">View and manage your custom tags.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-slate-700"
                >
                    <Plus size={16} />
                    Add Tag
                </button>
            </div>

            {tags.length === 0 ? (
                <div className="text-slate-500 text-center py-8 border-2 border-dashed border-slate-800 rounded-lg">
                    No tags created yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tags.map(tag => (
                        <div key={tag.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-lg group hover:border-slate-700 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${tag.color.replace('text-', 'bg-')}`} />
                                <span className="font-medium text-slate-300">{tag.name}</span>
                            </div>
                            <button
                                onClick={() => handleDeleteTag(tag.id, tag.name)}
                                className="text-slate-600 hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete Tag"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Tag"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                            Tag Name
                        </label>
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="e.g. Design, Urgent"
                            className="w-full bg-slate-800 border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                            Color
                        </label>
                        <div className="flex gap-2 items-center flex-wrap">
                            {TAG_COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setNewTagColor(color.value)}
                                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${color.value.replace('text-', 'bg-')} ${newTagColor === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                                        }`}
                                    title={color.name}
                                >
                                    {newTagColor === color.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim() || isCreating}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isCreating ? 'Creating...' : 'Create Tag'}
                        </button>
                    </div>
                </div>
            </Modal>
        </section>
    );
}
