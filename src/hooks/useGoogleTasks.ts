import { supabase } from '../lib/supabase';
import type { Todo } from '../features/todo/types';

const GOOGLE_TASKS_API = 'https://tasks.googleapis.com/tasks/v1';

export function useGoogleTasks() {

    const getProviderToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.provider_token) {
            console.warn('Google Tasks: No provider token found.');
            return null;
        }
        return session.provider_token;
    };

    const createTaskInGoogle = async (todo: Todo) => {
        const token = await getProviderToken();
        if (!token) return null;

        const body: any = {
            title: todo.title,
            notes: todo.description || '',
        };

        if (todo.due_date) {
            // Google Tasks expects RFC 3339 timestamp
            body.due = new Date(todo.due_date).toISOString();
        }

        try {
            const response = await fetch(`${GOOGLE_TASKS_API}/lists/@default/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('Failed to create Google Task:', err);
                return null;
            }

            const data = await response.json();
            return data.id; // Return Google Task ID
        } catch (error) {
            console.error('Error creating Google Task:', error);
            return null;
        }
    };

    const updateTaskInGoogle = async (todo: Todo) => {
        if (!todo.google_task_id) return;

        const token = await getProviderToken();
        if (!token) return;

        const body: any = {
            title: todo.title,
            notes: todo.description || '',
            status: todo.completed ? 'completed' : 'needsAction'
        };

        if (todo.due_date) {
            body.due = new Date(todo.due_date).toISOString();
        }

        try {
            await fetch(`${GOOGLE_TASKS_API}/lists/@default/tasks/${todo.google_task_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
        } catch (error) {
            console.error('Error updating Google Task:', error);
        }
    };

    const deleteTaskInGoogle = async (googleTaskId: string) => {
        const token = await getProviderToken();
        if (!token) return;

        try {
            await fetch(`${GOOGLE_TASKS_API}/lists/@default/tasks/${googleTaskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error deleting Google Task:', error);
        }
    };

    const toggleCompletion = async (googleTaskId: string, isCompleted: boolean) => {
        const token = await getProviderToken();
        if (!token) return;

        const status = isCompleted ? 'completed' : 'needsAction';

        try {
            await fetch(`${GOOGLE_TASKS_API}/lists/@default/tasks/${googleTaskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error('Error creating Google Task:', error);
        }
    };

    const listGoogleTasks = async () => {
        const token = await getProviderToken();
        if (!token) return [];

        try {
            const response = await fetch(`${GOOGLE_TASKS_API}/lists/@default/tasks?showCompleted=true&showHidden=true`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('Failed to list Google Tasks');
                return [];
            }

            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Error listing Google Tasks:', error);
            return [];
        }
    };

    return {
        createTaskInGoogle,
        updateTaskInGoogle,
        deleteTaskInGoogle,
        toggleCompletion,
        listGoogleTasks
    };
}
