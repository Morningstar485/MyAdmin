import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import type { Todo } from '../types';

export function useTodos() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { workspace } = useWorkspace();

    const fetchTodos = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('todos')
                .select(`
                    *,
                    todo_tags (
                        tag:tags (*)
                    )
                `)
                .eq('is_archived', false)
                .eq('workspace', workspace) // FILTER BY WORKSPACE
                .order('order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formattedTodos = data.map((t: any) => ({
                    ...t,
                    tags: t.todo_tags.map((tt: any) => tt.tag).filter(Boolean)
                }));
                setTodos(formattedTodos as Todo[]);
            }
        } catch (error) {
            console.error('Error fetching todos:', error);
        } finally {
            setIsLoading(false);
        }
    }, [workspace]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const addTodo = async (title: string, status: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('todos').insert([{
                title,
                status,
                user_id: user.id,
                workspace, // INJECT WORKSPACE
                order: todos.length
            }]);

            if (error) throw error;
            fetchTodos();
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    };

    const updateTodo = async (id: string, updates: Partial<Todo>) => {
        try {
            // Logic to handle completed_at timestamp
            const payload: any = {
                ...updates
                // updated_at removed
            };

            // Handle boolean toggle
            if (updates.completed !== undefined) {
                payload.completed_at = updates.completed ? new Date().toISOString() : null;
            }

            // Handle status change (Kanban)
            if (updates.status !== undefined) {
                if (updates.status === 'Done' || updates.status === 'Completed') {
                    payload.completed_at = new Date().toISOString();
                    payload.completed = true;
                } else if (updates.status !== 'Done' && updates.status !== 'Completed') {
                    // Only auto-uncheck if not explicitly managed in same update
                    if (updates.completed === undefined) {
                        payload.completed_at = null;
                        payload.completed = false;
                    }
                }
            }

            const { error } = await supabase
                .from('todos')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            fetchTodos();
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    };

    const deleteTodo = async (id: string) => {
        try {
            const { error } = await supabase
                .from('todos')
                .update({ is_archived: true }) // Soft delete
                .eq('id', id);

            if (error) throw error;
            fetchTodos();
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const reorderTodos = async (newTodos: Todo[]) => {
        setTodos(newTodos); // Optimistic update
        try {
            const updates = newTodos.map((todo, index) => ({
                id: todo.id,
                order: index,
                status: todo.status
                // updated_at removed
            }));

            const { error } = await supabase
                .from('todos')
                .upsert(updates);

            if (error) throw error;
        } catch (error) {
            console.error('Error reordering todos:', error);
            fetchTodos(); // Revert on error
        }
    };

    return {
        todos,
        isLoading,
        fetchTodos,
        addTodo,
        updateTodo,
        deleteTodo,
        reorderTodos
    };
}
