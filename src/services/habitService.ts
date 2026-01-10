import { supabase } from '../lib/supabase';
import { type Database } from '../types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Cast the client to include the Database types
const client = supabase as SupabaseClient<Database>;

export type Habit = Database['public']['Tables']['habits']['Row'];
export type HabitLog = Database['public']['Tables']['habit_logs']['Row'];

/**
 * Fetches all active (non-archived) habits, ordered by default_time.
 */
export async function getActiveHabits() {
    try {
        const { data, error } = await client
            .from('habits')
            .select('*')
            .eq('is_archived', false)
            .order('default_time', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching habits:', err);
        return [];
    }
}

/**
 * Fetches all habit logs for a specific date.
 * @param date YYYY-MM-DD string
 */
export async function getDailyHabitLogs(date: string) {
    try {
        const { data, error } = await client
            .from('habit_logs')
            .select('*')
            .eq('log_date', date);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching habit logs:', err);
        return [];
    }
}

/**
 * Fetches habit logs within a date range.
 * @param startDate YYYY-MM-DD string
 * @param endDate YYYY-MM-DD string
 */
export async function getHabitLogs(startDate: string, endDate: string) {
    try {
        const { data, error } = await client
            .from('habit_logs')
            .select('*')
            .gte('log_date', startDate)
            .lte('log_date', endDate);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching habit logs range:', err);
        return [];
    }
}

/**
 * Upserts a habit log for a specific habit and date.
 * If status is null, the log is deleted.
 * Intensity is automatically calculated based on status.
 */
export async function upsertHabitLog(habitId: string, date: string, status: 'completed' | 'partial' | 'skipped' | null) {
    try {
        // If status is null, delete the log (reset)
        if (status === null) {
            const { error } = await client
                .from('habit_logs')
                .delete()
                .match({ habit_id: habitId, log_date: date });

            if (error) throw error;
            return true;
        }

        // Calculate intensity
        let intensity = 0.0;
        if (status === 'completed') intensity = 1.0;
        else if (status === 'partial') intensity = 0.5;
        else if (status === 'skipped') intensity = 0.0;

        // Upsert the log
        const { error } = await client
            .from('habit_logs')
            .upsert({
                habit_id: habitId,
                log_date: date,
                status,
                intensity
            }, {
                onConflict: 'habit_id, log_date'
            });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error updating habit log:', err);
        return false;
    }
}

/**
 * Creates a new habit.
 */
export async function createHabit(habit: { title: string; default_time: string; icon: string }) {
    try {
        const { data, error } = await client
            .from('habits')
            .insert({
                title: habit.title,
                default_time: habit.default_time,
                icon: habit.icon,
                user_id: (await supabase.auth.getUser()).data.user?.id!
                // Note: RLS Usually handles user_id automatic insertion if set up with default auth.uid(), 
                // but checking the schema, it's NOT NULL and doesn't have a default. 
                // However, the policy "Users can manage their own habits" handles 'with check (auth.uid() = user_id)'.
                // We should explicitly retrieve the user.
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error creating habit:', err);
        throw err;
    }
}

/**
 * Updates an existing habit.
 */
export async function updateHabit(id: string, updates: { title?: string; default_time?: string; icon?: string }) {
    try {
        const { data, error } = await client
            .from('habits')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error updating habit:', err);
        throw err;
    }
}

/**
 * Archives (soft deletes) a habit.
 */
export async function deleteHabit(id: string) {
    try {
        const { error } = await client
            .from('habits')
            .update({ is_archived: true })
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error deleting habit:', err);
        throw err;
    }
}
