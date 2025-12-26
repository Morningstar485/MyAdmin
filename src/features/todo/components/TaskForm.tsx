import React, { useState } from 'react';
import type { Todo, TodoStatus, Tag } from '../types';
import { TAG_COLORS } from '../types';
import { Plus } from 'lucide-react';

interface TaskFormProps {
    initialValues?: Todo;
    availableTags: Tag[];
    onSubmit: (title: string, description: string, status: TodoStatus, duration: number, tags: Tag[], due_date: string | null, syncToGoogle: boolean) => void;
    onCreateTag: (name: string, color: string) => Promise<Tag | null>;
    onCancel: () => void;
    submitLabel?: string;
}

export function TaskForm({ initialValues, availableTags, onSubmit, onCreateTag, onCancel, submitLabel = 'Create Task' }: TaskFormProps) {
    const [title, setTitle] = useState(initialValues?.title || '');
    const [description, setDescription] = useState(initialValues?.description || '');
    const [status, setStatus] = useState<TodoStatus>(initialValues?.status || 'Today');
    const [duration, setDuration] = useState(initialValues?.duration?.toString() || '');
    const [dueDate, setDueDate] = useState(() => {
        if (!initialValues?.due_date) return '';
        const d = new Date(initialValues.due_date);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    });
    const [selectedTags, setSelectedTags] = useState<Tag[]>(initialValues?.tags || []);
    const [syncToGoogle, setSyncToGoogle] = useState(true);

    // New Tag State
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            alert("Title is required!");
            return;
        }

        if (!dueDate) {
            alert("Due Date is required!");
            return;
        }

        const durationVal = parseInt(duration);
        if (!duration || isNaN(durationVal) || durationVal <= 0 || !Number.isInteger(Number(duration))) {
            alert("Duration must be a positive integer greater than 0.");
            return;
        }

        // Convert local datetime to ISO string with timezone
        let isoDate = null;
        if (dueDate) {
            isoDate = new Date(dueDate).toISOString();
        }

        onSubmit(title, description, status, durationVal, selectedTags, isoDate, syncToGoogle);
    };

    // ... (rest of code)



    const toggleTag = (tag: Tag) => {
        if (selectedTags.find(t => t.id === tag.id)) {
            setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        const tag = await onCreateTag(newTagName, newTagColor);
        if (tag) {
            setSelectedTags(prev => [...prev, tag]); // Auto-select new tag
            setNewTagName('');
            setIsCreatingTag(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">Task Title <span className="text-red-400">*</span></label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white caret-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    placeholder="What needs to be done?"
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as TodoStatus)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="Later">Later</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-slate-300 mb-1">Duration (min) <span className="text-red-400">*</span></label>
                    <input
                        id="duration"
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white caret-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 appearance-none"
                        placeholder="e.g. 30"
                    />
                </div>
            </div>

            {/* Due Date Input */}
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-slate-300 mb-1">Due Date <span className="text-red-400">*</span></label>
                <input
                    id="dueDate"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white caret-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
            </div>

            {/* Tags Section */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>

                <div className="flex flex-wrap gap-2 mb-3">
                    {availableTags.map(tag => {
                        const isSelected = selectedTags.some(t => t.id === tag.id);
                        return (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`
                                    flex items-center text-xs font-medium px-2.5 py-1.5 rounded-full border transition-all
                                    ${isSelected
                                        ? `bg-slate-700 border-indigo-500 text-white ring-1 ring-indigo-500`
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }
                                `}
                            >
                                <div className={`w-2 h-2 rounded-full mr-2 ${tag.color}`}></div>
                                {tag.name}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setIsCreatingTag(!isCreatingTag)}
                        className="flex items-center text-xs font-medium px-2.5 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20 transition-all"
                    >
                        <Plus size={12} className="mr-1" /> New Tag
                    </button>
                </div>

                {isCreatingTag && (
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 animated-fade-in">
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded text-sm px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                                placeholder="Tag Name"
                            />
                            <button
                                type="button"
                                onClick={handleCreateTag}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 rounded text-xs font-medium"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex gap-2 pl-2 py-1">
                            {TAG_COLORS.map(c => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setNewTagColor(c.value)}
                                    className={`w-3 h-3 rounded-full ${c.value} transition-transform ${newTagColor === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-800' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white caret-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 min-h-[100px] resize-none"
                    placeholder="Add details..."
                />
            </div>

            <div>
                <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={syncToGoogle}
                        onChange={(e) => setSyncToGoogle(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-indigo-500 rounded border-slate-700 bg-slate-800 transition-all group-hover:border-indigo-500/50"
                    />
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Sync to Google Tasks</span>
                </label>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    )
}
