import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
} from 'reactflow';
import type { Connection, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { useFlowchartStore } from '../../stores/flowchartStore';
import type { FlowNode, FlowEdge, FlowNodeType } from '../../types/game.types';
import BlockPalette from './BlockPalette';
import StartNode from './CustomNodes/StartNode';
import EndNode from './CustomNodes/EndNode';
import ActionNode from './CustomNodes/ActionNode';
import ConditionNode from './CustomNodes/ConditionNode';
import LoopNode from './CustomNodes/LoopNode';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  condition: ConditionNode,
  loop: LoopNode,
};

function getEdgeType(sourceHandle: string | null | undefined): string {
  if (sourceHandle === 'yes' || sourceHandle === 'no') return 'smoothstep';
  if (sourceHandle === 'loop' || sourceHandle === 'next') return 'smoothstep';
  return 'step'; // orthogonal routing: right-angle turns, no diagonal
}

export default function FlowchartEditor() {
  // store เป็น source of truth
  const storeNodes = useFlowchartStore((s) => s.nodes);
  const storeEdges = useFlowchartStore((s) => s.edges);
  const store = useFlowchartStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges as Edge[]);

  // *** KEY FIX: sync store → ReactFlow local state ***
  // เมื่อ store เปลี่ยน (reset, highlight, startBattle) ให้ ReactFlow อัพเดทตาม
  useEffect(() => {
    setNodes(storeNodes as Node[]);
  }, [storeNodes]);

  useEffect(() => {
    setEdges(storeEdges as Edge[]);
  }, [storeEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sh = params.sourceHandle;
      const isYes  = sh === 'yes';
      const isNo   = sh === 'no';
      const isLoopContinue = sh === 'loop';
      const isLoopNext     = sh === 'next';

      const strokeColor = isYes ? '#4ade80'
        : isNo   ? '#f87171'
        : isLoopContinue ? '#fb923c'
        : isLoopNext     ? '#60a5fa'
        : '#94a3b8';

      const newEdge: Edge = {
        id: `e_${params.source}_${params.target}_${Date.now()}`,
        source: params.source ?? '',
        target: params.target ?? '',
        sourceHandle: sh ?? undefined,
        type: getEdgeType(sh),
        label: isYes ? 'YES' : isNo ? 'NO' : isLoopContinue ? 'LOOP' : isLoopNext ? 'NEXT' : undefined,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: strokeColor },
        style: { stroke: strokeColor, strokeWidth: 2 },
        labelStyle: { fill: strokeColor, fontWeight: 800, fontSize: 11 },
        labelBgStyle: { fill: '#08080f', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      };

      // อัพเดท store เป็น source of truth → effect จะ sync กลับมา ReactFlow
      const updatedEdges = addEdge(newEdge, storeEdges as Edge[]);
      store.setEdges(updatedEdges as FlowEdge[]);
    },
    [storeEdges, store]
  );

  function onNodesChangeHandler(changes: any) {
    onNodesChange(changes);
    // sync deletion ไปยัง store
    const deletions = changes.filter((c: any) => c.type === 'remove');
    if (deletions.length > 0) {
      const ids = new Set(deletions.map((c: any) => c.id));
      store.setNodes(storeNodes.filter((n) => !ids.has(n.id)) as FlowNode[]);
      store.setEdges(storeEdges.filter((e) => !ids.has(e.source) && !ids.has(e.target)) as FlowEdge[]);
    }
    // sync position changes ไปยัง store
    const positions = changes.filter((c: any) => c.type === 'position' && c.position);
    if (positions.length > 0) {
      const updated = storeNodes.map((n) => {
        const p = positions.find((c: any) => c.id === n.id);
        return p ? { ...n, position: p.position } : n;
      });
      store.setNodes(updated as FlowNode[]);
    }
  }

  function onEdgesChangeHandler(changes: any) {
    onEdgesChange(changes);
    // sync edge deletion
    const deletions = changes.filter((c: any) => c.type === 'remove');
    if (deletions.length > 0) {
      const ids = new Set(deletions.map((c: any) => c.id));
      store.setEdges(storeEdges.filter((e) => !ids.has(e.id)) as FlowEdge[]);
    }
  }

  function addBlock(type: FlowNodeType, label: string, data: Record<string, any> = {}) {
    const id = `${type}_${Date.now()}`;
    const newNode: FlowNode = {
      id, type,
      position: { x: 180 + Math.random() * 160, y: 80 + Math.random() * 140 },
      data: { label, ...data },
    } as FlowNode;
    store.setNodes([...storeNodes, newNode]);
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <BlockPalette onAddBlock={addBlock} />

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeHandler}
          onEdgesChange={onEdgesChangeHandler}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.Step}
          connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,3' }}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          deleteKeyCode="Delete"
          snapToGrid
          snapGrid={[16, 16]}
          style={{ background: '#08080f' }}
        >
          <Background variant={BackgroundVariant.Lines} color="#111120" gap={16} />
          <Controls style={{ background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)' }} />
        </ReactFlow>
      </div>
    </div>
  );
}
