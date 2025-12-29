import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import type { Plan, PlanStatus } from '../../todo/types';

export function usePlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { workspace } = useWorkspace();

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .neq('status', 'Archived') // Assuming we filter archived
                .eq('workspace', workspace) // FILTER BY WORKSPACE
                .order('created_at', { ascending: true });

            if (error) throw error;
            setPlans(data as Plan[]);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setIsLoading(false);
        }
    }, [workspace]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const addPlan = async (title: string, description: string, status: PlanStatus) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('plans').insert([{
                title,
                description,
                status,
                user_id: user.id,
                workspace, // INJECT WORKSPACE
            }]);

            if (error) throw error;
            fetchPlans();
        } catch (error) {
            console.error('Error adding plan:', error);
        }
    };

    const updatePlan = async (id: string, updates: Partial<Plan>) => {
        try {
            const { error } = await supabase
                .from('plans')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            fetchPlans();
        } catch (error) {
            console.error('Error updating plan:', error);
        }
    };

    // For Plan Columns (optional if we want them workspace specific too)
    const [columns, setColumns] = useState<{ title: string; status: PlanStatus }[]>([]);
    const fetchColumns = useCallback(async () => {
        // Columns could be global or workspace specific. Let's make them workspace specific for flexibility.
        const { data } = await supabase
            .from('plan_columns')
            .select('*')
            .eq('workspace', workspace)
            .order('position');

        if (data && data.length > 0) {
            setColumns(data.map(c => ({ title: c.title, status: c.title as PlanStatus })));
        } else {
            // Defaults if no custom columns
            setColumns([
                { title: 'Not Started', status: 'Not Started' },
                { title: 'Going On', status: 'Going On' },
                { title: 'Stuck', status: 'Stuck' },
                { title: 'Completed', status: 'Completed' },
            ]);
        }
    }, [workspace]);

    useEffect(() => {
        fetchColumns();
    }, [fetchColumns]);

    return {
        plans,
        columns,
        isLoading,
        fetchPlans,
        addPlan,
        updatePlan,
        refresh: fetchPlans
    };
}
