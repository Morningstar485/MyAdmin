export interface Note {
    id: string;
    title: string;
    content: string; // HTML string from TipTap
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
}
