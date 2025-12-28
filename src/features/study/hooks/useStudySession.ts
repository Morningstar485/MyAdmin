import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { type Note } from '../../notes/types';

interface Resource {
    id: string;
    title: string;
    type: 'pdf' | 'video' | 'link' | 'article';
    external_id?: string;
    embed_link?: string;
    url?: string;
}

export function useStudySession(resourceId: string | undefined) {
    const { workspace } = useWorkspace();
    const [resource, setResource] = useState<Resource | null>(null);
    const [note, setNote] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!resourceId) return;

        async function initSession() {
            setIsLoading(true);
            try {
                // 1. Fetch Resource
                const { data: resData, error: resError } = await supabase
                    .from('resources')
                    .select('*')
                    .eq('id', resourceId)
                    .single();

                if (resError) throw resError;
                setResource(resData);

                // 2. Fetch Existing Note
                const { data: noteData, error: noteError } = await supabase
                    .from('notes')
                    .select('*')
                    .eq('resource_id', resourceId)
                    .single();

                if (noteData) {
                    setNote(noteData);
                } else if (!noteError || noteError.code === 'PGRST116') {
                    // No note found (PGRST116 is "Row not found"), create one
                    const user = (await supabase.auth.getUser()).data.user;
                    if (!user) throw new Error("No user found");

                    const newNote = {
                        user_id: user.id,
                        workspace: workspace, // Should allow cross-workspace? Usually yes, but stick to current context.
                        title: `Notes on: ${resData.title}`,
                        resource_id: resourceId,
                        content: null, // Empty TipTap content
                        folder_id: null // Root folder
                    };

                    const { data: createdNote, error: createError } = await supabase
                        .from('notes')
                        .insert([newNote])
                        .select()
                        .single();

                    if (createError) throw createError;
                    setNote(createdNote);
                } else {
                    throw noteError;
                }

            } catch (err: any) {
                console.error("Error initializing study session:", err);
                setError(err.message || 'Failed to load session');
            } finally {
                setIsLoading(false);
            }
        }

        initSession();
    }, [resourceId]);

    return { resource, note, isLoading, error };
}
