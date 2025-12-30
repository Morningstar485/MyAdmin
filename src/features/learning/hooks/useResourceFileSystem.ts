import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { fetchResources } from '../learningService';
import type { Resource, Folder } from '../types';

export interface Breadcrumb {
    id: string;
    name: string;
}

export function useResourceFileSystem(initialFolderId: string | null = null) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const workspace = 'learning';

    const fetchDirectory = useCallback(async (folderId: string | null) => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch Sub-folders
            let foldersQuery = supabase
                .from('folders')
                .select('*')
                .eq('workspace', workspace)
                .order('name');

            if (folderId) {
                foldersQuery = foldersQuery.eq('parent_id', folderId);
            } else {
                foldersQuery = foldersQuery.is('parent_id', null);
            }

            const { data: foldersData, error: foldersError } = await foldersQuery;
            if (foldersError) throw foldersError;
            setFolders(foldersData as Folder[]);

            // 2. Fetch Resources
            // We use the service function we just updated
            const resourcesData = await fetchResources(folderId);
            setResources(resourcesData);

            // 3. Fetch Breadcrumbs
            if (folderId) {
                // Assuming get_folder_path RPC exists and works for any folder
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
    }, [workspace]);

    // Initial load and on navigation change
    useEffect(() => {
        fetchDirectory(currentFolderId);
    }, [currentFolderId, fetchDirectory]);

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
                    workspace
                }]);

            if (error) throw error;
            fetchDirectory(currentFolderId); // Refresh
        } catch (err: any) {
            console.error('Error creating folder:', err);
            // In a real app we'd expose this error
        }
    };

    return {
        currentFolderId,
        folders,
        resources,
        breadcrumbs,
        isLoading,
        error,
        navigateTo,
        createFolder,
        refresh: () => fetchDirectory(currentFolderId)
    };
}
