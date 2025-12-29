import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import type { Note, Folder } from '../types';

export interface Breadcrumb {
    id: string;
    name: string;
}

export function useFileSystem(workspaceProp: string | null = null, initialFolderId: string | null = null) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { workspace: contextWorkspace } = useWorkspace();
    const workspace = workspaceProp || contextWorkspace;

    const fetchDirectory = useCallback(async (folderId: string | null) => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch Sub-folders
            let foldersQuery = supabase
                .from('folders')
                .select('*')
                .eq('workspace', workspace) // Filter by workspace
                .order('name');

            if (folderId) {
                foldersQuery = foldersQuery.eq('parent_id', folderId);
            } else {
                foldersQuery = foldersQuery.is('parent_id', null);
            }

            const { data: foldersData, error: foldersError } = await foldersQuery;
            if (foldersError) throw foldersError;
            setFolders(foldersData as Folder[]);

            // 2. Fetch Notes
            let notesQuery = supabase
                .from('notes')
                .select('*')
                .eq('workspace', workspace) // Filter by workspace
                .order('updated_at', { ascending: false });

            if (folderId) {
                notesQuery = notesQuery.eq('folder_id', folderId);
            } else {
                notesQuery = notesQuery.is('folder_id', null);
            }

            const { data: notesData, error: notesError } = await notesQuery;
            if (notesError) throw notesError;
            setNotes(notesData as Note[]);

            // 3. Fetch Breadcrumbs
            if (folderId) {
                const { data: pathData, error: pathError } = await supabase
                    .rpc('get_folder_path', { folder_uuid: folderId });

                if (pathError) throw pathError;
                setBreadcrumbs(pathData || []);
            } else {
                setBreadcrumbs([]);
            }

        } catch (err: any) {
            console.error('Error fetching directory:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [workspace]); // Re-fetch when workspace changes

    // Initial load and on navigation change
    useEffect(() => {
        fetchDirectory(currentFolderId);
    }, [currentFolderId, fetchDirectory]); // fetchDirectory depends on workspace

    const navigateTo = (folderId: string | null) => {
        setCurrentFolderId(folderId);
    };

    const createFolder = async (name: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { error } = await supabase
                .from('folders')
                .insert([{
                    name,
                    parent_id: currentFolderId,
                    user_id: user.id,
                    workspace // Inject workspace
                }]);

            if (error) throw error;
            fetchDirectory(currentFolderId); // Refresh
        } catch (err: any) {
            console.error('Error creating folder:', err);
            alert('Failed to create folder');
        }
    };

    const moveNote = async (noteId: string, targetFolderId: string | null) => {
        try {
            const { error } = await supabase
                .from('notes')
                .update({ folder_id: targetFolderId })
                .eq('id', noteId);

            if (error) throw error;
            fetchDirectory(currentFolderId); // Refresh to remove moved note
        } catch (err: any) {
            console.error('Error moving note:', err);
            alert('Failed to move note');
        }
    };

    return {
        currentFolderId,
        folders,
        notes,
        breadcrumbs,
        isLoading,
        error,
        navigateTo,
        createFolder,
        moveNote,
        refresh: () => fetchDirectory(currentFolderId)
    };
}
