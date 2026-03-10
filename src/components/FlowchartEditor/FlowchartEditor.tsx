import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../contexts/ThemeContext';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  condition: ConditionNode,
  loop: LoopNode,
};

const ALL_BLOCKS: { type: FlowNodeType; label: string; icon: string; data: Record<string, any>; color: string; description: string }[] = [
  { type: 'action',    label: 'Attack',       icon: '⚔️', data: { actionType: 'attack' },                      color: '#3b82f6', description: 'โจมตีศัตรู' },
  { type: 'action',    label: 'Heal',          icon: '💚', data: { actionType: 'heal' },                        color: '#22c55e', description: 'ฟื้นฟู HP' },
  { type: 'action',    label: 'Dodge',         icon: '🌀', data: { actionType: 'dodge' },                       color: '#3b82f6', description: 'หลบการโจมตี' },
  { type: 'action',    label: 'Cast Spell',    icon: '✨', data: { actionType: 'cast_spell' },                  color: '#3b82f6', description: 'เวทมนตร์ (25 Mana)' },
  { type: 'action',    label: 'Power Strike',  icon: '💥', data: { actionType: 'power_strike' },                color: '#7c3aed', description: 'โจมตีหนัก 2x (20 Mana)' },
  { type: 'condition', label: 'HP < 50?',      icon: '◇',  data: { conditionType: 'hp_less', threshold: 50 },  color: '#d97706', description: 'ตรวจ HP น้อยกว่า 50' },
  { type: 'condition', label: 'HP > 50?',      icon: '◇',  data: { conditionType: 'hp_greater', threshold: 50 },color: '#d97706', description: 'ตรวจ HP มากกว่า 50' },
  { type: 'condition', label: 'Enemy Alive?',  icon: '◇',  data: { conditionType: 'enemy_alive' },              color: '#d97706', description: 'ศัตรูยังมีชีวิตอยู่?' },
];

function getEdgeType(sourceHandle: string | null | undefined): string {
  if (sourceHandle === 'yes' || sourceHandle === 'no') return 'smoothstep';
  if (sourceHandle === 'loop' || sourceHandle === 'next') return 'smoothstep';
  return 'step';
}

type CtxMenu = {
  kind: 'node';
  x: number; y: number;
  id: string; label: string; nodeType: string;
} | {
  kind: 'edge';
  x: number; y: number;
  id: string;
} | {
  kind: 'pane';
  x: number; y: number;
} | null;

interface FlowchartEditorProps {
  allowedBlocks?: string[];
}

export default function FlowchartEditor({ allowedBlocks }: FlowchartEditorProps = {}) {
  const storeNodes = useFlowchartStore((s) => s.nodes);
  const storeEdges = useFlowchartStore((s) => s.edges);
  const store = useFlowchartStore();
  const { colors } = useTheme();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges as Edge[]);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setNodes(storeNodes as Node[]); }, [storeNodes]);
  useEffect(() => { setEdges(storeEdges as Edge[]); }, [storeEdges]);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!ctxMenu) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setCtxMenu(null); }
    function onMouseDown(e: MouseEvent) {
      if (ctxRef.current && !ctxRef.current.contains(e.target as HTMLElement)) setCtxMenu(null);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onMouseDown); };
  }, [ctxMenu]);

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

      const updatedEdges = addEdge(newEdge, storeEdges as Edge[]);
      store.setEdges(updatedEdges as FlowEdge[]);
    },
    [storeEdges, store]
  );

  function onNodesChangeHandler(changes: any) {
    // Block deletion of start/end nodes
    const filtered = changes.map((c: any) => {
      if (c.type === 'remove') {
        const node = storeNodes.find((n) => n.id === c.id);
        if (node?.type === 'start' || node?.type === 'end') return null;
      }
      return c;
    }).filter(Boolean);
    onNodesChange(filtered);
    const deletions = filtered.filter((c: any) => c.type === 'remove');
    if (deletions.length > 0) {
      const ids = new Set(deletions.map((c: any) => c.id));
      store.setNodes(storeNodes.filter((n) => !ids.has(n.id)) as FlowNode[]);
      store.setEdges(storeEdges.filter((e) => !ids.has(e.source) && !ids.has(e.target)) as FlowEdge[]);
    }
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
    setCtxMenu(null);
  }

  function copyNode(id: string) {
    const src = storeNodes.find((n) => n.id === id);
    if (!src) return;
    const newId = `${src.type}_${Date.now()}`;
    const copy: FlowNode = {
      ...src,
      id: newId,
      position: { x: src.position.x + 40, y: src.position.y + 40 },
      data: { ...src.data },
    } as FlowNode;
    store.setNodes([...storeNodes, copy]);
    setCtxMenu(null);
  }

  function deleteNode(id: string) {
    store.setNodes(storeNodes.filter((n) => n.id !== id) as FlowNode[]);
    store.setEdges(storeEdges.filter((e) => e.source !== id && e.target !== id) as FlowEdge[]);
    setCtxMenu(null);
  }

  function deleteEdge(id: string) {
    store.setEdges(storeEdges.filter((e) => e.id !== id) as FlowEdge[]);
    setCtxMenu(null);
  }

  const visibleBlocks = allowedBlocks && allowedBlocks.length > 0
    ? ALL_BLOCKS.filter((b) => {
        if (b.type === 'action') return allowedBlocks.includes(b.data?.actionType ?? '');
        if (b.type === 'condition') return allowedBlocks.includes('condition');
        return true;
      })
    : ALL_BLOCKS;

  // Clamp popup position so it doesn't overflow viewport
  function clamp(x: number, y: number, w: number, h: number) {
    return {
      left: Math.min(x, window.innerWidth - w - 8),
      top:  Math.min(y, window.innerHeight - h - 8),
    };
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <BlockPalette onAddBlock={addBlock} allowedBlocks={allowedBlocks} />

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
          fitViewOptions={{ padding: 0.4, maxZoom: 0.85 }}
          minZoom={0.2}
          maxZoom={2}
          deleteKeyCode="Delete"
          snapToGrid
          snapGrid={[16, 16]}
          style={{ background: '#08080f' }}
          onNodeClick={(e, node) => {
            e.stopPropagation();
            setCtxMenu({ kind: 'node', x: e.clientX, y: e.clientY, id: node.id, label: (node.data as any).label ?? node.type ?? '', nodeType: node.type ?? '' });
          }}
          onEdgeClick={(e, edge) => {
            e.stopPropagation();
            setCtxMenu({ kind: 'edge', x: e.clientX, y: e.clientY, id: edge.id });
          }}
          onPaneClick={(e) => {
            if (ctxMenu) { setCtxMenu(null); return; }
            setCtxMenu({ kind: 'pane', x: e.clientX, y: e.clientY });
          }}
        >
          <Background variant={BackgroundVariant.Lines} color="#111120" gap={16} />
          <Controls style={{ background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)' }} />
        </ReactFlow>

        {/* Context Menu Popup */}
        {ctxMenu && (
          <div
            ref={ctxRef}
            style={{
              position: 'fixed',
              ...clamp(
                ctxMenu.x + 6,
                ctxMenu.y + 6,
                ctxMenu.kind === 'pane' ? 180 : 160,
                ctxMenu.kind === 'pane' ? visibleBlocks.length * 38 + 48 : 120,
              ),
              zIndex: 10000,
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              minWidth: ctxMenu.kind === 'pane' ? 180 : 160,
              overflow: 'hidden',
            }}
          >
            {/* Node menu */}
            {ctxMenu.kind === 'node' && (
              <>
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  <p style={{ margin: 0, color: colors.textSub, fontSize: 11, fontWeight: 700 }}>{ctxMenu.label}</p>
                </div>
                {ctxMenu.nodeType !== 'start' && ctxMenu.nodeType !== 'end' && (
                  <>
                    <CtxButton label="📋 คัดลอก node นี้" color={colors.text} onClick={() => copyNode(ctxMenu.id)} colors={colors} />
                    <CtxButton label="🗑 ลบ node นี้" color="#f87171" onClick={() => deleteNode(ctxMenu.id)} colors={colors} />
                  </>
                )}
              </>
            )}

            {/* Edge menu */}
            {ctxMenu.kind === 'edge' && (
              <>
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  <p style={{ margin: 0, color: colors.textSub, fontSize: 11, fontWeight: 700 }}>เส้นเชื่อม</p>
                </div>
                <CtxButton label="🗑 ลบเส้นนี้" color="#f87171" onClick={() => deleteEdge(ctxMenu.id)} colors={colors} />
              </>
            )}

            {/* Pane menu — add blocks */}
            {ctxMenu.kind === 'pane' && (
              <>
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.borderSubtle}` }}>
                  <p style={{ margin: 0, color: colors.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>เพิ่ม Block</p>
                </div>
                {visibleBlocks.map((b, i) => (
                  <button
                    key={i}
                    onClick={() => addBlock(b.type, b.label, b.data)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '7px 12px', border: 'none', background: 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.bgSurfaceHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{b.icon}</span>
                    <div>
                      <p style={{ margin: 0, color: colors.text, fontSize: 12, fontWeight: 600 }}>{b.label}</p>
                      <p style={{ margin: 0, color: colors.textMuted, fontSize: 10 }}>{b.description}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CtxButton({ label, color, onClick, colors }: {
  label: string; color: string; onClick: () => void; colors: ThemeColors;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: '9px 12px',
        border: 'none', background: 'transparent', cursor: 'pointer',
        textAlign: 'left', color, fontWeight: 600, fontSize: 13,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.bgSurfaceHover; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {label}
    </button>
  );
}
