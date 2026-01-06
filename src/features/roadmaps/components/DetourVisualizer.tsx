import { useState, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    useNodesState,
    useEdgesState,
    type Edge,
    type Node,
    Position,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, CornerDownRight, Map, ArrowRight, X, Check, Loader2 } from 'lucide-react';
import type { RoadmapDetour } from '../types';

interface DetourVisualizerProps {
    taskId: string;
    taskTitle: string;
    detours: RoadmapDetour[];
    onCreateDetour: (title: string, justification?: string) => Promise<void>;
    onCompleteDetour: (detourId: string) => Promise<void>;
    onClose: () => void;
}

const INITIAL_NODES: Node[] = [
    {
        id: 'main',
        type: 'input',
        data: { label: 'Main Task' },
        position: { x: 50, y: 50 },
        style: {
            background: '#1e293b', // slate-800
            border: '1px solid #334155', // slate-700
            borderRadius: '8px',
            padding: '10px',
            width: 200,
            fontSize: '12px',
            fontWeight: 500,
            color: '#e2e8f0' // slate-200
        },
        sourcePosition: Position.Right,
    },
];

export function DetourVisualizer({ taskId, taskTitle, detours, onCreateDetour, onCompleteDetour, onClose }: DetourVisualizerProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [activeDetour, setActiveDetour] = useState<RoadmapDetour | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newDetourTitle, setNewDetourTitle] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Sync nodes with props
    useEffect(() => {
        const active = detours.find(d => d.status === 'active');
        setActiveDetour(active || null);

        const newNodes: Node[] = [
            {
                id: 'main',
                type: 'input',
                data: { label: taskTitle },
                position: { x: 50, y: 50 },
                style: {
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px',
                    width: 200,
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#e2e8f0'
                },
                sourcePosition: Position.Right,
            }
        ];

        const newEdges: Edge[] = [];

        if (active) {
            newNodes.push({
                id: active.id,
                data: { label: active.title },
                position: { x: 300, y: 150 },
                style: {
                    background: '#022c22', // emerald-950
                    border: '1px solid #047857', // emerald-700
                    borderRadius: '8px',
                    padding: '10px',
                    width: 200,
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#a7f3d0' // emerald-200
                },
                targetPosition: Position.Left,
            });

            newEdges.push({
                id: `e-${taskId}-${active.id}`,
                source: 'main',
                target: active.id,
                type: 'bezier',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
            });
        }

        setNodes(newNodes);
        setEdges(newEdges);
    }, [taskId, taskTitle, detours, setNodes, setEdges]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDetourTitle.trim()) return;

        setIsCreating(true);
        await onCreateDetour(newDetourTitle);
        setNewDetourTitle('');
        setIsCreating(false);
        setIsFormOpen(false);
    };

    const handleMerge = async () => {
        if (!activeDetour) return;

        // Simple visual feedback
        const detourNode = nodes.find(n => n.id === activeDetour.id);
        if (detourNode) {
            setNodes(nodes.map(n => n.id === activeDetour.id ? ({
                ...n,
                style: { ...n.style, background: '#064e3b', borderColor: '#34d399', transition: 'all 0.5s' }
            }) : n));
        }

        await onCompleteDetour(activeDetour.id);
    };

    return (
        <div className="flex flex-col h-full border-l border-slate-800 bg-slate-950">

            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GitBranch size={16} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-200">Detour Map</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                    <X size={16} />
                </button>
            </div>

            {/* Visualizer Area */}
            <div className="h-64 bg-slate-900 border-b border-slate-800 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    attributionPosition="bottom-right"
                    proOptions={{ hideAttribution: true }}
                >
                    <Background gap={12} size={1} color="#334155" />
                </ReactFlow>

                {!activeDetour && !isFormOpen && (
                    <div className="absolute top-4 right-4 bg-slate-900/90 p-2 rounded shadow-sm border border-slate-800 text-[10px] text-slate-400 max-w-[150px]">
                        Main Trunk active. No deviations.
                    </div>
                )}
            </div>

            {/* Workspace Area */}
            <div className="flex-1 p-6 flex flex-col overflow-y-auto bg-slate-950">

                {activeDetour ? (
                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                <CornerDownRight size={16} />
                                Active Detour
                            </h4>
                            <span className="px-2 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-900 rounded-full text-[10px] font-medium">
                                Running
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-slate-900 border border-emerald-500/20 rounded-lg shadow-sm">
                                <p className="text-sm font-medium text-slate-200">{activeDetour.title}</p>
                                {activeDetour.justification && (
                                    <p className="text-xs text-slate-400 mt-1 italic">{activeDetour.justification}</p>
                                )}
                            </div>

                            <div className="text-xs text-slate-600 text-center py-4 border-t border-slate-800 border-dashed">
                                This space is for deep work on this specific sub-topic.
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-800">
                            <button
                                onClick={handleMerge}
                                className="w-full py-2 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                            >
                                <GitBranch size={14} className="rotate-180" />
                                Merge & Complete Detour
                            </button>
                        </div>
                    </div>
                ) : isFormOpen ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <h4 className="text-sm font-semibold text-slate-200 mb-3">Name your Detour</h4>
                        <form onSubmit={handleCreateSubmit} className="space-y-3">
                            <input
                                autoFocus
                                value={newDetourTitle}
                                onChange={(e) => setNewDetourTitle(e.target.value)}
                                placeholder="e.g. Deep dive into..."
                                className="w-full text-sm border-slate-800 rounded px-3 py-2 bg-slate-900 text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={!newDetourTitle.trim() || isCreating}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-all"
                                >
                                    {isCreating ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                                    Start Detour
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="w-12 h-12 bg-indigo-950/30 rounded-full flex items-center justify-center text-indigo-400 mb-2">
                            <Map size={24} />
                        </div>
                        <div className="max-w-[200px]">
                            <h4 className="text-sm font-medium text-slate-200 mb-1">Need to deep dive?</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Create a temporary detour to explore this topic without cluttering your main roadmap.
                            </p>
                        </div>

                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="group relative inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-indigo-900/50 rounded-lg text-indigo-400 text-sm font-medium shadow-sm hover:bg-indigo-950/30 hover:border-indigo-800 hover:shadow transition-all"
                        >
                            <GitBranch size={16} />
                            Fork this Topic
                            <span className="flex items-center absolute right-full mr-2 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all text-[10px] text-slate-500 font-normal whitespace-nowrap">
                                Start Detour
                                <ArrowRight size={10} className="ml-0.5" />
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
