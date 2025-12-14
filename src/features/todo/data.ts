import type { Todo } from './types';

export const INITIAL_TODOS: Todo[] = [
    {
        id: '1',
        title: 'Research Competitors',
        description: 'Analyze top 3 productivity apps in the market to understand common patterns.',
        status: 'Backlogs',
        completed: false,
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Setup Project Repo',
        description: 'Initialize Git, install dependencies, and setup CI/CD pipeline.',
        status: 'Backlogs',
        completed: true,
        created_at: new Date().toISOString(),
    },
    {
        id: '3',
        title: 'Design System',
        description: 'Define colors, typography, and spacing tokens for Tailwind config.',
        status: 'Today',
        completed: false,
        created_at: new Date().toISOString(),
    },
    {
        id: '4',
        title: 'Implement Auth',
        description: 'Set up Supabase authentication flow.',
        status: 'Today',
        completed: false,
        created_at: new Date().toISOString(),
    },
    {
        id: '5',
        title: 'Database Schema',
        description: 'Draft initial SQL schema for tasks and user profiles.',
        status: 'This Week',
        completed: false,
        created_at: new Date().toISOString(),
    },
    {
        id: '6',
        title: 'Mobile Layout',
        description: 'Optimize dashboard for mobile responsiveness.',
        status: 'Later',
        completed: false,
        created_at: new Date().toISOString(),
    },
];
