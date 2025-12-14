export type TodoStatus = 'Backlogs' | 'Today' | 'This Week' | 'Later';

export interface Todo {
    id: string; // UUID from Supabase
    title: string;
    description?: string;
    status: TodoStatus;
    completed: boolean;
    duration?: number; // In minutes
    order?: number; // For Drag and Drop sorting
    created_at: string; // Supabase uses snake_case by default
    tags?: Tag[];
    is_archived?: boolean;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export const TAG_COLORS = [
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Orange', value: 'bg-orange-500' },
    { name: 'Yellow', value: 'bg-yellow-500' },
    { name: 'Green', value: 'bg-emerald-500' },
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Purple', value: 'bg-purple-500' }
];
