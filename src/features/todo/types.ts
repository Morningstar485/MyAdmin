export type TodoStatus = 'Backlogs' | 'Today' | 'This Week' | 'Later';

export type PlanStatus = 'Not Started' | 'Going On' | 'Stuck' | 'Completed' | 'Archived';

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface Plan {
    id: string;
    title: string;
    description?: string;
    status: PlanStatus;
    created_at: string;
}

export interface Todo {
    id: string; // UUID from Supabase
    title: string;
    description?: string;
    status: TodoStatus;
    completed: boolean;
    duration?: number; // Estimated time in minutes
    order?: number; // For Drag and Drop sorting
    created_at: string; // Supabase uses snake_case by default
    tags?: Tag[];
    plan_id?: string | null;
    plan?: Plan; // For displaying plan details
    is_archived?: boolean;
}

export const TAG_COLORS = [
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Orange', value: 'bg-orange-500' },
    { name: 'Yellow', value: 'bg-yellow-500' },
    { name: 'Green', value: 'bg-emerald-500' },
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Purple', value: 'bg-purple-500' }
];
