import { useCallback, useEffect, useState, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    Position,
    Handle,
    MarkerType,
    type NodeProps,
    BaseEdge,
    EdgeLabelRenderer,
    type EdgeProps,
    getBezierPath,
    addEdge,
    type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { supabase } from '../../../lib/supabase';
import { GripHorizontal, Plus, X } from 'lucide-react';

const nodeWidth = 140;
const nodeHeight = 40;

// --- Custom Edge Implementation ---
const DeletableEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) => {
    // Note: setEdges removed as it was unused
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
    });

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 12,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    <button
                        className="w-3.5 h-3.5 p-0 bg-slate-900 border border-red-500 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors cursor-pointer shadow-sm"
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('plan-mindmap-delete-edge', { detail: { id } }));
                        }}
                        title="Remove Connection"
                    >
                        <X size={8} strokeWidth={2.5} />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

// --- Custom Node Implementation ---
const MindMapNode = ({ data, isConnectable }: NodeProps) => {
    return (
        <div
            className={`
                px-2 py-1 rounded-lg border shadow-lg min-w-[120px] relative group
                transition-all duration-200
            `}
            style={{
                backgroundColor: data.bgColor as string || '#1e293b',
                borderColor: data.borderColor as string || '#334155',
                color: data.textColor as string || '#fff'
            }}
        >
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-slate-500 !w-1.5 !h-1.5" />

            <div className="flex items-center gap-1.5">
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold truncate leading-tight">{data.label as string}</p>
                    {typeof data.status === 'string' && (
                        <p className="text-[7px] opacity-70 uppercase tracking-wider">{data.status}</p>
                    )}
                </div>
            </div>

            {/* Add Child Button (Always Visible) */}
            <button
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-600 border border-slate-900 text-white rounded-full p-[1px] hover:scale-110 shadow-md z-50 flex items-center justify-center transition-transform"
                style={{ width: '14px', height: '14px' }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (typeof data.onAddChild === 'function') {
                        (data.onAddChild as (id: string) => void)(data.id as string);
                    }
                }}
                title="Add Sub-task"
            >
                <Plus size={8} />
            </button>

            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-slate-500 !w-1.5 !h-1.5" />
        </div>
    );
};

const nodeTypes = {
    mindMap: MindMapNode,
};

const edgeTypes = {
    deletable: DeletableEdge,
};

// --- Layout Helper ---
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'TB' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        return {
            ...node,
            position: {
                x: nodeWithPosition ? nodeWithPosition.x - nodeWidth / 2 : 0,
                y: nodeWithPosition ? nodeWithPosition.y - nodeHeight / 2 : 0,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

// --- Main Component ---
interface PlanMindMapProps {
    planId: string;
    onNodeClick?: (nodeId: string, type: 'plan' | 'task') => void;
}

export function PlanMindMap({ planId }: PlanMindMapProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs to track current state for layout merging without dependency cycles
    const nodesRef = useRef<Node[]>([]);
    const edgesRef = useRef<Edge[]>([]);

    useEffect(() => {
        nodesRef.current = nodes;
        edgesRef.current = edges;
    }, [nodes, edges]);

    const handleAddChild = useCallback(async (parentId: string) => {
        const title = prompt("Enter title for sub-task:");
        if (!title) return;

        try {
            const isRootTask = parentId === planId;

            const payload = {
                title,
                plan_id: planId,
                status: 'Backlog', // Default
                parent_task_id: isRootTask ? null : parentId,
                // New Root Tasks are Detached by default (Template style)
                metadata: isRootTask ? { detached: true } : {},
                user_id: (await supabase.auth.getUser()).data.user?.id
            };

            const { error } = await supabase.from('todos').insert(payload);
            if (error) throw error;

            window.dispatchEvent(new CustomEvent('plan-mindmap-refresh'));
        } catch (error) {
            console.error('Error adding child task:', error);
            alert('Failed to add task');
        }
    }, [planId]);

    const fetchTree = useCallback(async () => {
        // Only show loading indicator on first load to prevent flicker
        if (nodesRef.current.length === 0) setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_plan_tree', { plan_uuid: planId });

            if (error) throw error;
            if (!data) return;

            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            // Helper to recursively parse
            const processNode = (nodeData: any, parentId?: string) => {
                let bgColor = '#1e293b';
                let borderColor = '#334155';

                if (nodeData.type === 'plan') {
                    bgColor = '#312e81'; //indigo-900
                    borderColor = '#6366f1'; //indigo-500
                } else {
                    switch (nodeData.status) {
                        case 'Completed': borderColor = '#4ade80'; bgColor = '#15803d'; break; // Light Green
                        case 'Going On': borderColor = '#3b82f6'; bgColor = '#172554'; break; // blue
                        case 'Stuck': borderColor = '#ef4444'; bgColor = '#450a0a'; break; // red
                        default: break; // slate default
                    }
                }

                newNodes.push({
                    id: nodeData.id,
                    type: 'mindMap',
                    position: { x: 0, y: 0 }, // Calculated by dagre later
                    data: {
                        label: nodeData.title,
                        status: nodeData.status,
                        id: nodeData.id,
                        bgColor,
                        borderColor,
                        onAddChild: handleAddChild
                    },
                });

                if (parentId) {
                    if (parentId === planId) {
                        // Root Logic with Metadata
                        // Check explicit "detached" state. 
                        // If metadata.detached is FALSE, we show the visible edge.
                        // If metadata.detached is TRUE (or undefined aka default), we show invisible edge (Template style).
                        const isDetached = nodeData.metadata?.detached !== false;

                        if (isDetached) {
                            // Invisible edge for layout (Detached)
                            newEdges.push({
                                id: `${parentId}-${nodeData.id}`,
                                source: parentId,
                                target: nodeData.id,
                                type: 'default',
                                style: { opacity: 0, pointerEvents: 'none' }, // Invisible & Non-interactive
                            });
                        } else {
                            // Visible Edge (Explicitly Connected)
                            newEdges.push({
                                id: `${parentId}-${nodeData.id}`,
                                source: parentId,
                                target: nodeData.id,
                                type: 'deletable',
                                markerEnd: { type: MarkerType.ArrowClosed },
                                style: { stroke: '#64748b' },
                                data: { targetNodeId: nodeData.id }
                            });
                        }
                    } else {
                        // Standard deletable edge for sub-tasks
                        newEdges.push({
                            id: `${parentId}-${nodeData.id}`,
                            source: parentId,
                            target: nodeData.id,
                            type: 'deletable', // Use custom edge
                            markerEnd: { type: MarkerType.ArrowClosed },
                            style: { stroke: '#64748b' },
                            data: { targetNodeId: nodeData.id }
                        });
                    }
                }

                if (nodeData.children && Array.isArray(nodeData.children)) {
                    nodeData.children.forEach((child: any) => processNode(child, nodeData.id));
                }
            };

            processNode(data);

            const layouted = getLayoutedElements(newNodes, newEdges);

            // Merge Positions Logic: Layout Stability
            const mergedNodes = layouted.nodes.map(newNode => {
                const prevNode = nodesRef.current.find(n => n.id === newNode.id);
                if (!prevNode) return newNode; // New node

                // Find Parent in new vs old structure
                const newParent = layouted.edges.find(e => e.target === newNode.id)?.source;
                const prevParent = edgesRef.current.find(e => e.target === newNode.id)?.source;

                // If parent structure is identical, keep position
                if (newParent === prevParent) {
                    return { ...newNode, position: prevNode.position };
                }

                // If parent changed, snap to new structure
                return newNode;
            });

            setNodes(mergedNodes);
            setEdges(layouted.edges);

        } catch (err: any) {
            console.error('Error fetching mind map:', err);
            setError(err.message || 'Failed to load mind map');
        } finally {
            setLoading(false);
        }
    }, [planId, handleAddChild, setEdges, setNodes]);

    // Handle new connections (Task -> Task)
    const onConnect = useCallback(async (params: Connection) => {
        if (!params.source || !params.target) return;
        if (params.source === params.target) return;

        const targetIsPlan = params.target === planId;
        const sourceIsPlan = params.source === planId;

        // Optimistic UI: If connecting to Plan, we expect a visible edge
        setEdges((eds) => addEdge({ ...params, type: 'deletable' }, eds));

        try {
            if (sourceIsPlan || targetIsPlan) {
                // Determine which is task
                const taskID = sourceIsPlan ? params.target : params.source;

                // Connecting to Plan -> Make Root & Explicitly Connected
                const { error } = await supabase
                    .from('todos')
                    .update({
                        parent_task_id: null,
                        metadata: { detached: false } // Visible Edge
                    })
                    .eq('id', taskID);

                if (error) throw error;
            } else {
                // Task -> Task connection
                const { error } = await supabase
                    .from('todos')
                    .update({ parent_task_id: params.source })
                    .eq('id', params.target);

                if (error) throw error;
            }

            // Force refresh to update structure
            window.dispatchEvent(new CustomEvent('plan-mindmap-refresh'));

        } catch (err: any) {
            console.error("Failed to connect:", err);
            alert("Failed to link tasks.");
            fetchTree(); // Revert
        }
    }, [planId, setEdges, fetchTree]);

    // Handle edge deletion event from Custom Edge
    useEffect(() => {
        const handleEdgeDeleteRequest = async (e: Event) => {
            const { id } = (e as CustomEvent).detail;

            // Find edge in current state
            const edge = edges.find(ed => ed.id === id);
            let targetId: string | null = null;
            let isRootEdge = false;

            if (edge) {
                targetId = edge.target;
                if (edge.source === planId) isRootEdge = true;
            } else {
                const parts = id.split('-');
                if (parts.length >= 2) {
                    if (parts[0] === planId) isRootEdge = true;
                    if (id.length >= 36) {
                        targetId = id.slice(-36);
                    }
                }
            }

            if (targetId) {
                try {
                    if (isRootEdge) {
                        // Breaking Plan -> Task relation
                        // Means "Detach", so set metadata.detached = true
                        const { error } = await supabase
                            .from('todos')
                            .update({ metadata: { detached: true } })
                            .eq('id', targetId);
                        if (error) throw error;
                    } else {
                        // Breaking Task -> Task relation
                        // Just set parent to null. It becomes a Root Task.
                        // Default to detached logic (metadata can be null or explicit)
                        const { error } = await supabase
                            .from('todos')
                            .update({
                                parent_task_id: null,
                                metadata: { detached: true } // Clean detach
                            })
                            .eq('id', targetId);
                        if (error) throw error;
                    }

                    fetchTree();
                } catch (err) {
                    console.error("Failed to delete relation", err);
                    alert("Failed to break relationship");
                    fetchTree(); // restore
                }
            }
        };

        window.addEventListener('plan-mindmap-delete-edge', handleEdgeDeleteRequest);
        return () => window.removeEventListener('plan-mindmap-delete-edge', handleEdgeDeleteRequest);
    }, [edges, fetchTree, planId]);

    useEffect(() => {
        fetchTree();
        const handleRefresh = () => fetchTree();
        window.addEventListener('plan-mindmap-refresh', handleRefresh);
        return () => window.removeEventListener('plan-mindmap-refresh', handleRefresh);
    }, [fetchTree]);

    if (loading) return <div className="h-full flex items-center justify-center text-slate-500">Loading Mind Map...</div>;

    if (error) return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-900">
            <div className="p-4 rounded-full bg-slate-800 mb-4">
                <GripHorizontal className="text-red-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Setup Required</h3>
            <p className="max-w-md mb-6">{error.includes('function') || error.includes('rpc') ? "The Database Migration hasn't been run yet." : error}</p>
            {error.includes('function') || error.includes('rpc') ? (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-left w-full max-w-lg overflow-x-auto">
                    <p className="text-xs text-slate-500 mb-2 font-mono">Run `16_add_metadata.sql` in Supabase SQL Editor:</p>
                    <code className="text-xs font-mono text-indigo-300 block">
                        ALTER TABLE todos ADD COLUMN...
                    </code>
                </div>
            ) : (
                <button onClick={fetchTree} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
                    Retry
                </button>
            )}
        </div>
    );

    return (
        <div className="h-[450px] w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-slate-900"
                minZoom={0.1}
            >
                <Background color="#334155" gap={16} size={1} />
                <Controls className="bg-slate-800 border-slate-700 text-slate-200 fill-slate-200" />
            </ReactFlow>
        </div>
    );
}
