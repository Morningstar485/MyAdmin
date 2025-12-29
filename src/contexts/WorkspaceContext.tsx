import { createContext, useContext, useState, type ReactNode } from 'react';

export type WorkspaceType = 'work' | 'learning';

export interface WorkspaceTheme {
    primary: string;           // 'indigo', 'emerald'
    accent: string;            // for tailored classes like 'text-indigo-400'
    label: string;
}

interface WorkspaceContextType {
    workspace: WorkspaceType;
    setWorkspace: (ws: WorkspaceType) => void;
    theme: WorkspaceTheme;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const THEMES: Record<WorkspaceType, WorkspaceTheme> = {
    work: {
        primary: 'indigo',
        accent: 'indigo',
        label: 'Work'
    },
    learning: {
        primary: 'emerald',
        accent: 'emerald',
        label: 'Learning'
    }
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [workspace, setWorkspaceState] = useState<WorkspaceType>('work');

    const setWorkspace = (ws: WorkspaceType) => {
        setWorkspaceState(ws);
        localStorage.setItem('myadmin_workspace', ws);
    };

    const theme = THEMES[workspace];

    return (
        <WorkspaceContext.Provider value={{ workspace, setWorkspace, theme }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}
