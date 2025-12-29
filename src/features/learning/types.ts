export interface Resource {
    id: string;
    user_id: string;
    workspace: string;
    title: string;
    drive_file_id: string;
    drive_embed_link: string;
    mime_type: string;
    type: string;
    created_at: string;
}

export interface LearningNote {
    id: string;
    resource_id: string; // UUID of the PDF/Resource
    content: string | any; // Actual note content (Text/JSON)
    title: string;
    created_at?: string;
    updated_at?: string;
    user_id?: string;
    workspace?: string;
}
