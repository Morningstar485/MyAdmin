import { supabase } from '../../lib/supabase';
import type { Roadmap, RoadmapMilestone, RoadmapItem } from './types';

/**
 * Fetches all roadmaps for the current user in the learning workspace.
 */
export async function fetchRoadmaps(): Promise<Roadmap[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data, error } = await supabase
            .from('roadmaps')
            .select('*')
            .eq('user_id', user.id)
            .eq('workspace', 'learning')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching roadmaps:', err);
        return [];
    }
}

/**
 * Creates a new roadmap.
 */
export async function createRoadmap(roadmap: { title: string; description?: string }): Promise<Roadmap | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data, error } = await supabase
            .from('roadmaps')
            .insert([{
                ...roadmap,
                user_id: user.id,
                workspace: 'learning',
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error creating roadmap:', err);
        return null;
    }
}

/**
 * Fetches full details of a roadmap including milestones and items.
 */
export async function fetchRoadmapDetails(roadmapId: string) {
    try {
        const { data: milestones, error: mError } = await supabase
            .from('roadmap_milestones')
            .select('*')
            .eq('roadmap_id', roadmapId)
            .order('order_index', { ascending: true });

        if (mError) throw mError;

        const milestoneIds = milestones.map(m => m.id);
        const { data: items, error: iError } = await supabase
            .from('roadmap_items')
            .select('*')
            .in('milestone_id', milestoneIds)
            .order('order_index', { ascending: true });

        if (iError) throw iError;

        return {
            milestones: milestones as RoadmapMilestone[],
            items: items as RoadmapItem[]
        };
    } catch (err) {
        console.error('Error fetching roadmap details:', err);
        return { milestones: [], items: [] };
    }
}

/**
 * Updates a roadmap status or title.
 */
export async function updateRoadmap(id: string, updates: Partial<Roadmap>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('roadmaps')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error updating roadmap:', err);
        return false;
    }
}

/**
 * Toggles the completion status of a roadmap item.
 */
export async function toggleItemCompletion(itemId: string, isCompleted: boolean): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('roadmap_items')
            .update({ is_completed: isCompleted })
            .eq('id', itemId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error toggling item completion:', err);
        return false;
    }
}

/**
 * Deletes a roadmap.
 */
export async function deleteRoadmap(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('roadmaps')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error deleting roadmap:', err);
        return false;
    }
}
