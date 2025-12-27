export interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    user_id: string;
    created_at: string;
}

export interface Note {
    id: string;
    title: string;
    content: string; // HTML string from TipTap
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    user_id?: string;
    plan_id?: string;
    folder_id?: string | null; // Added for Folder System
}

