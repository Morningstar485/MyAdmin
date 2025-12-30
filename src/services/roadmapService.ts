import { supabase } from '../lib/supabase';
import type { Roadmap, MilestoneWithItems, RoadmapItem } from '../features/roadmaps/types';
import type { Resource } from '../features/learning/types';

/**
 * Fetches all roadmaps for the current user in the 'learning' workspace.
 */
export async function fetchRoadmaps(): Promise<Roadmap[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('roadmaps')
            .select(`
                *,
                roadmap_milestones (
                    roadmap_items (
                        is_completed
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('workspace', 'learning')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate progress for each roadmap
        const processed = (data || []).map((roadmap: any) => {
            const allItems = (roadmap.roadmap_milestones || []).flatMap((m: any) => m.roadmap_items || []);
            const total_tasks = allItems.length;
            const completed_tasks = allItems.filter((i: any) => i.is_completed).length;

            return {
                ...roadmap,
                total_tasks,
                completed_tasks
            };
        });

        return processed as Roadmap[];
    } catch (err) {
        console.error('Error fetching roadmaps:', err);
        return [];
    }
}

/**
 * Fetches a single roadmap by its ID.
 */
export async function fetchRoadmapById(id: string): Promise<Roadmap | null> {
    try {
        const { data, error } = await supabase
            .from('roadmaps')
            .select(`
                *,
                roadmap_milestones (
                    roadmap_items (
                        is_completed
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (data) {
            const allItems = (data.roadmap_milestones || []).flatMap((m: any) => m.roadmap_items || []);
            const total_tasks = allItems.length;
            const completed_tasks = allItems.filter((i: any) => i.is_completed).length;

            return {
                ...data,
                total_tasks,
                completed_tasks
            } as Roadmap;
        }

        return data;
    } catch (err) {
        console.error('Error fetching roadmap by ID:', err);
        return null;
    }
}

/**
 * Fetches all milestones for a roadmap, including their items and linked resources.
 */
export async function fetchMilestonesForRoadmap(roadmapId: string): Promise<MilestoneWithItems[]> {
    try {
        const { data, error } = await supabase
            .from('roadmap_milestones')
            .select(`
                *,
                roadmap_items (
                    *,
                    resources (*)
                )
            `)
            .eq('roadmap_id', roadmapId)
            .order('order_index', { ascending: true });

        if (error) throw error;

        // Sort items within each milestone by order_index
        const processedData = (data || []).map((milestone: any) => ({
            ...milestone,
            roadmap_items: (milestone.roadmap_items || []).sort((a: any, b: any) => a.order_index - b.order_index)
        }));

        return processedData as MilestoneWithItems[];
    } catch (err) {
        console.error('Error fetching milestones:', err);
        return [];
    }
}

/**
 * Creates a new roadmap.
 */
// ... (rest of the file remains same, adding it back for context or just the relevant parts)
export async function createRoadmap(title: string, description: string): Promise<Roadmap | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data, error } = await supabase
            .from('roadmaps')
            .insert([{
                title,
                description,
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
 * Deletes a roadmap and its associated milestones/items via cascade.
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

/**
 * Creates a new milestone for a roadmap.
 */
export async function createMilestone(roadmapId: string, title: string, orderIndex: number): Promise<MilestoneWithItems | null> {
    try {
        const { data, error } = await supabase
            .from('roadmap_milestones')
            .insert([{
                roadmap_id: roadmapId,
                title,
                order_index: orderIndex,
                status: 'not_started'
            }])
            .select()
            .single();

        if (error) throw error;
        return { ...data, roadmap_items: [] };
    } catch (err) {
        console.error('Error creating milestone:', err);
        return null;
    }
}

/**
 * Creates a new roadmap item (task) in a milestone.
 */
export async function createRoadmapItem(milestoneId: string, title: string, orderIndex: number, resourceId?: string): Promise<RoadmapItem | null> {
    try {
        const { data, error } = await supabase
            .from('roadmap_items')
            .insert([{
                milestone_id: milestoneId,
                title,
                order_index: orderIndex,
                resource_id: resourceId || null,
                is_completed: false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error creating roadmap item:', err);
        return null;
    }
}

/**
 * Updates a roadmap item, e.g., toggling completion.
 */
export async function updateRoadmapItem(id: string, updates: Partial<RoadmapItem>): Promise<RoadmapItem | null> {
    try {
        const { data, error } = await supabase
            .from('roadmap_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error updating roadmap item:', err);
        return null;
    }
}

/**
 * Fetches all resources in the learning workspace.
 */
export async function fetchLibraryResources(): Promise<Resource[]> {
    try {
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('workspace', 'learning');

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching library resources:', err);
        return [];
    }
}
