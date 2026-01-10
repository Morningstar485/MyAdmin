export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            habits: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    icon: string | null
                    default_time: string
                    is_archived: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    icon?: string | null
                    default_time?: string
                    is_archived?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    icon?: string | null
                    default_time?: string
                    is_archived?: boolean | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "habits_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            habit_logs: {
                Row: {
                    id: string
                    habit_id: string
                    log_date: string
                    status: 'completed' | 'partial' | 'skipped' | null
                    intensity: number | null
                    notes: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    habit_id: string
                    log_date: string
                    status?: 'completed' | 'partial' | 'skipped' | null
                    intensity?: number | null
                    notes?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    habit_id?: string
                    log_date?: string
                    status?: 'completed' | 'partial' | 'skipped' | null
                    intensity?: number | null
                    notes?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "habit_logs_habit_id_fkey"
                        columns: ["habit_id"]
                        referencedRelation: "habits"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
