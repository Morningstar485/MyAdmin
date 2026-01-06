import { supabase } from '../lib/supabase';
import type { RoadmapDetour } from '../features/roadmaps/types';

/**
 * Creates a new detour for a specific roadmap task.
 */
export async function createDetour(parentTaskId: string, title: string, justification?: string): Promise<RoadmapDetour | null> {
    try {
        const { data, error } = await supabase
            .from('roadmap_detours')
            .insert([{
                parent_task_id: parentTaskId,
                title,
                justification: justification || null,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error creating detour:', err);
        return null;
    }
}

/**
 * Fetches all detours associated with a specific task.
 */
export async function getDetoursByTaskId(taskId: string): Promise<RoadmapDetour[]> {
    try {
        const { data, error } = await supabase
            .from('roadmap_detours')
            .select('*')
            .eq('parent_task_id', taskId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching detours:', err);
        return [];
    }
}

/**
 * Marks a detour as merged (completed).
 */
export async function completeDetour(detourId: string): Promise<RoadmapDetour | null> {
    try {
        const { data, error } = await supabase
            .from('roadmap_detours')
            .update({
                status: 'merged',
                completed_at: new Date().toISOString()
            })
            .eq('id', detourId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error completing detour:', err);
        return null;
    }
}
