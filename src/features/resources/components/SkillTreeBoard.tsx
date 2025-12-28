import { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge,
    type Node,
    BackgroundVariant,
    Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '../../../lib/supabase';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AddResourceButton } from './AddResourceButton';

const nodeColor = (type: string) => {
    switch (type) {
        case 'pdf': return '#10b981'; // Emerald-500
        case 'video': return '#f43f5e'; // Rose-500
        case 'link': return '#3b82f6'; // Blue-500
        default: return '#64748b'; // Slate-500
    }
};

export function SkillTreeBoard() {
    const { workspace } = useWorkspace();
    const navigate = useNavigate();

    // ReactFlow State
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                // Fetch Resources (Nodes)
                const { data: resData, error: resError } = await supabase
                    .from('resources')
                    .select('*')
                    .eq('workspace', workspace);

                if (resError) throw resError;

                // Fetch Edges
                const { data: edgeData, error: edgeError } = await supabase
                    .from('resource_edges')
                    .select('*')
                    .eq('workspace', workspace);

                if (edgeError) throw edgeError;

                // Transform to ReactFlow Format
                const flowNodes: Node[] = (resData || []).map(r => ({
                    id: r.id,
                    type: 'input', // Using 'input' just for simple top handle, or default? Default has both. 
                    // Actually default is fine, but customizing style slightly?
                    // Let's use standard nodes for now.
                    position: { x: r.position_x || Math.random() * 500, y: r.position_y || Math.random() * 500 },
                    data: { label: r.title },
                    style: {
                        background: '#1e293b',
                        color: 'white',
                        border: `1px solid ${nodeColor(r.type)}`,
                        borderRadius: '0.5rem',
                        padding: '10px',
                        width: 180,
                        fontSize: '12px'
                    }
                }));

                const flowEdges: Edge[] = (edgeData || []).map(e => ({
                    id: e.id,
                    source: e.source_id,
                    target: e.target_id,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#10b981' }
                }));

                setNodes(flowNodes);
                setEdges(flowEdges);

            } catch (err) {
                console.error("Failed to load skill tree:", err);
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [workspace, setNodes, setEdges]);

    // Save Position on Drag Stop
    const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
        // Update DB
        await supabase
            .from('resources')
            .update({ position_x: node.position.x, position_y: node.position.y })
            .eq('id', node.id);
    }, []);

    // Connect Nodes
    const onConnect = useCallback(async (params: Connection) => {
        // Optimistic UI
        setEdges((eds) => addEdge(params, eds));

        // DB Insert
        if (params.source && params.target) {
            await supabase.from('resource_edges').insert({
                source_id: params.source,
                target_id: params.target,
                workspace: workspace
            });
        }
    }, [workspace, setEdges]);

    // Double Click to Open Study Mode
    const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
        navigate(`/study/${node.id}`);
    }, [navigate]);

    // Add New Node (Center of Screen logic is complex without viewport, assume (100,100) for now or use AddResourceButton normally)
    const handleResourceAdded = (resource: any) => {
        // Add to nodes list immediately
        const newNode: Node = {
            id: resource.id,
            position: { x: 250, y: 50 }, // Default spawn point
            data: { label: resource.title },
            style: {
                background: '#1e293b',
                color: 'white',
                border: `1px solid ${nodeColor(resource.type)}`,
                borderRadius: '0.5rem',
                padding: '10px',
                width: 180,
                fontSize: '12px'
            }
        };
        setNodes((nds) => nds.concat(newNode));
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center text-emerald-500">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-950">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                onNodeDoubleClick={onNodeDoubleClick}
                fitView
            >
                <Background color="#10b981" variant={BackgroundVariant.Dots} gap={24} size={1} className="opacity-20" />
                <Controls className="bg-slate-800 border-slate-700 fill-slate-400" />

                {/* Floating Toolbar */}
                <Panel position="top-right" className="bg-transparent p-0 m-4 flex gap-2">
                    <AddResourceButton onResourceAdded={handleResourceAdded} />
                </Panel>
            </ReactFlow>
        </div>
    );
}
