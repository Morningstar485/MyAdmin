import type { Resource } from '../learning/types';

export type RoadmapStatus = 'active' | 'paused' | 'completed';
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed';

export interface Roadmap {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    status: RoadmapStatus;
    created_at: string;
    workspace: string;
    total_tasks?: number;
    completed_tasks?: number;
}

export interface RoadmapMilestone {
    id: string;
    roadmap_id: string;
    title: string;
    description: string | null;
    status: MilestoneStatus;
    order_index: number;
    created_at: string;
}

export interface RoadmapItem {
    id: string;
    milestone_id: string;
    resource_id: string | null;
    title: string;
    is_completed: boolean;
    order_index: number;
    created_at: string;
    resources?: Resource | null; // Joined resource data
}

export interface MilestoneWithItems extends RoadmapMilestone {
    roadmap_items: RoadmapItem[];
}

export interface RoadmapDetour {
    id: string;
    parent_task_id: string;
    title: string;
    justification: string | null;
    status: 'active' | 'merged' | 'abandoned';
    created_at: string;
    completed_at: string | null;
}
