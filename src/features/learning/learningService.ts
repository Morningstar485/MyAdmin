import { supabase } from '../../lib/supabase';
import type { LearningNote, Resource } from './types';

/**
 * Fetches a note associated with a specific resource ID.
 * 
 * CRITICAL CONSTRAINTS:
 * - READ-ONLY: Strictly a SELECT query.
 * - NO SIDE EFFECTS: Does not INSERT, UPDATE, or DELETE.
 * - RETURNS NULL: Returns null if no row is found, does not throw or create.
 * 
 * @param resourceId The UUID of the resource to check.
 * @returns The note object found or null.
 */
export async function fetchNoteForResource(resourceId: string): Promise<LearningNote | null> {
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('resource_id', resourceId)
            .maybeSingle(); // Returns null if no row is found

        if (error) {
            console.error('Error fetching note for resource:', error.message);
            // Even on error, we return null as per constraints: "Do NOT throw an error"
            console.log(`Checking database for Resource ID: ${resourceId}... Found: false`);
            return null;
        }

        const found = !!data;
        console.log(`Checking database for Resource ID: ${resourceId}... Found: ${found}`);

        return data as LearningNote | null;
    } catch (err) {
        console.error('Unexpected error in fetchNoteForResource:', err);
        console.log(`Checking database for Resource ID: ${resourceId}... Found: false`);
        return null;
    }
}

/**
 * Fetches all resources for the current workspace.
 * 
 * @returns Array of resources.
 */
export async function fetchResources(): Promise<Resource[]> {
    try {
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('workspace', 'learning')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching resources:', err);
        return [];
    }
}

/**
 * Creates a new resource in the database.
 * 
 * @param resource Partial resource metadata.
 * @returns The created resource or null.
 */
export async function createResource(resource: {
    title: string;
    drive_file_id: string;
    drive_embed_link: string;
    mime_type: string;
}): Promise<Resource | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data, error } = await supabase
            .from('resources')
            .insert([{
                ...resource,
                user_id: user.id,
                workspace: 'learning',
                type: 'pdf'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error creating resource:', err);
        return null;
    }
}
/**
 * Saves or updates a note for a resource.
 * 
 * @param resourceId The UUID of the resource.
 * @param title The title of the note.
 * @param content The content of the note (string or JSON).
 * @returns The saved note or null.
 */
export async function saveNote(resourceId: string, title: string, content: any): Promise<LearningNote | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data: existingNote } = await supabase
            .from('notes')
            .select('id')
            .eq('resource_id', resourceId)
            .maybeSingle();

        const noteData = {
            resource_id: resourceId,
            title,
            content,
            user_id: user.id,
            workspace: 'learning',
            updated_at: new Date().toISOString()
        };

        let result;
        if (existingNote) {
            result = await supabase
                .from('notes')
                .update(noteData)
                .eq('id', existingNote.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from('notes')
                .insert([{ ...noteData, is_pinned: false }])
                .select()
                .single();
        }

        if (result.error) throw result.error;
        return result.data;
    } catch (err) {
        console.error('Error saving note:', err);
        return null;
    }
}
/**
 * Deletes multiple resources and their associated notes.
 * 
 * @param ids Array of resource UUIDs to delete.
 */
export async function deleteResources(ids: string[]): Promise<boolean> {
    try {
        if (ids.length === 0) return true;

        // Notes are linked via resource_id. 
        // We delete notes first (optional if cascade is on, but safer)
        const { error: notesError } = await supabase
            .from('notes')
            .delete()
            .in('resource_id', ids);

        if (notesError) throw notesError;

        const { error: resourcesError } = await supabase
            .from('resources')
            .delete()
            .in('id', ids);

        if (resourcesError) throw resourcesError;

        return true;
    } catch (err) {
        console.error('Error deleting resources:', err);
        return false;
    }
}
