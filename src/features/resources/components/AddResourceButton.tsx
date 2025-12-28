import { useState } from 'react';
import { useGoogleDrivePicker } from '../../../hooks/useGoogleDrivePicker';
import { supabase } from '../../../lib/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { FileUp, Loader2 } from 'lucide-react';

export function AddResourceButton({ onResourceAdded }: { onResourceAdded?: (res: any) => void }) {
    const { workspace } = useWorkspace();
    const [isSaving, setIsSaving] = useState(false);

    const { openPicker, isReady } = useGoogleDrivePicker({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        developerKey: import.meta.env.VITE_GOOGLE_API_KEY
    });

    const handleSelect = async (files: any[]) => {
        if (!files || files.length === 0) return;
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const resources = files.map(file => ({
                user_id: user.id,
                workspace, // 'learning' typically
                title: file.name,
                type: 'pdf', // Defaulting to PDF for now, logic below could be smarter
                external_id: file.id,
                embed_link: file.embedUrl,
                tags: []
            }));

            // Smart Type Detection
            resources.forEach(res => {
                const mime = files.find(f => f.id === res.external_id)?.mimeType;
                if (mime?.includes('video')) res.type = 'video';
                else if (mime?.includes('pdf')) res.type = 'pdf';
                else res.type = 'article'; // Fallback
            });

            const { data, error } = await supabase.from('resources').insert(resources).select();
            if (error) throw error;

            if (data && onResourceAdded) {
                data.forEach(d => onResourceAdded(d));
            }
            // alert(`Saved ${resources.length} resources to Library!`);

        } catch (error) {
            console.error('Error saving resources:', error);
            alert('Failed to save resources.');
        } finally {
            setIsSaving(false);
        }
    };

    if (workspace !== 'learning') return null;

    return (
        <button
            onClick={() => openPicker(handleSelect)}
            disabled={!isReady || isSaving}
            className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${isReady
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }
            `}
        >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
            {isSaving ? 'Saving...' : 'Add from Drive'}
        </button>
    );
}
