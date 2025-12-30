import { useState } from 'react';
import type { Resource } from './types';
import type { View } from '../../layouts/AppShell';

import { NotesBoard } from '../notes/NotesBoard';
import { StudySession } from './components/StudySession';
import { ResourcesBoard } from './components/ResourcesBoard';
import { RoadmapDashboard, RoadmapDetails } from '../roadmaps';
import { Dashboard } from '../dashboard/Dashboard';

interface LearningWorkspaceProps {
    currentView: View;
}

export function LearningWorkspace({ currentView }: LearningWorkspaceProps) {
    // State
    const [selectedResource, setSelectedResourceState] = useState<Resource | null>(() => {
        const saved = localStorage.getItem('learning_selected_resource');
        return saved ? JSON.parse(saved) : null;
    });

    const [selectedRoadmapId, setSelectedRoadmapIdState] = useState<string | null>(() => {
        return localStorage.getItem('learning_selected_roadmap_id');
    });

    const setSelectedResource = (resource: Resource | null) => {
        setSelectedResourceState(resource);
        if (resource) {
            localStorage.setItem('learning_selected_resource', JSON.stringify(resource));
        } else {
            localStorage.removeItem('learning_selected_resource');
        }
    };

    const setSelectedRoadmapId = (id: string | null) => {
        setSelectedRoadmapIdState(id);
        if (id) {
            localStorage.setItem('learning_selected_roadmap_id', id);
        } else {
            localStorage.removeItem('learning_selected_roadmap_id');
        }
    };

    console.log("DEBUG ENV:", import.meta.env.VITE_GOOGLE_API_KEY);

    // Layout Logic
    const isLibraryView = currentView === 'library';
    const isStudyView = isLibraryView && selectedResource !== null;

    const renderMainContent = () => {
        if (isStudyView && selectedResource) {
            return (
                <StudySession
                    resource={selectedResource}
                    onClose={() => setSelectedResource(null)}
                />
            );
        }

        switch (currentView) {
            case 'dashboard':
                return <Dashboard workspace="learning" />;
            case 'roadmap':
            case 'planner':
                if (selectedRoadmapId) {
                    return (
                        <RoadmapDetails
                            roadmapId={selectedRoadmapId}
                            onBack={() => setSelectedRoadmapId(null)}
                        />
                    );
                }
                return <RoadmapDashboard onSelectRoadmap={(id) => setSelectedRoadmapId(id)} workspace="learning" />;
            case 'notes':
                return <NotesBoard workspace="learning" />;
            case 'library':
                return (
                    <ResourcesBoard
                        onSelectResource={setSelectedResource}
                        workspace="learning"
                    />
                );
            case 'settings':
                return <div className="p-8 text-slate-500">Settings coming soon for Learning Workspace...</div>;
            default:
                return <Dashboard workspace="learning" />;
        }
    };

    return (
        <div className="h-full flex overflow-hidden bg-slate-950">
            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
                {renderMainContent()}
            </main>
        </div>
    );
}
