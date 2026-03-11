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

// ── Submenu data ──────────────────────────────────────────────────────────────
const ACTION_GROUPS = [
  {
    label: 'COMBAT',
    items: [
      { type: 'attack',       icon: '⚔️', label: 'Attack' },
      { type: 'power_strike', icon: '💥', label: 'Power Strike' },
      { type: 'dodge',        icon: '🌀', label: 'Dodge' },
      { type: 'cast_spell',   icon: '✨', label: 'Cast Spell' },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { type: 'heal',         icon: '💚', label: 'Heal' },
      { type: 'use_potion',   icon: '🧪', label: 'Use Potion' },
      { type: 'use_antidote', icon: '💊', label: 'Use Antidote' },
    ],
  },
];

const CONDITION_GROUPS = [
  {
    label: 'HP / MP',
    items: [
      { type: 'hp_less',      icon: '❤️',  label: 'HP < 50?',  conditionType: 'hp_less',      threshold: 50 },
      { type: 'hp_greater',   icon: '❤️',  label: 'HP > 50?',  conditionType: 'hp_greater',   threshold: 50 },
      { type: 'mana_less',    icon: '💙', label: 'MP < 25?',  conditionType: 'mana_less',    threshold: 25 },
      { type: 'mana_greater', icon: '💙', label: 'MP > 25?',  conditionType: 'mana_greater', threshold: 25 },
    ],
  },
  {
    label: 'STATUS',
    items: [
      { type: 'enemy_alive',   icon: '☠️', label: 'Enemy Alive?',  conditionType: 'enemy_alive' },
      { type: 'hero_burning',  icon: '🔥', label: 'Burning?',       conditionType: 'hero_burning' },
      { type: 'hero_poisoned', icon: '🟣', label: 'Poisoned?',      conditionType: 'hero_poisoned' },
      { type: 'hero_frozen',   icon: '❄️', label: 'Frozen?',        conditionType: 'hero_frozen' },
      { type: 'enemy_stunned', icon: '⚡', label: 'Enemy Stunned?', conditionType: 'enemy_stunned' },
    ],
  },
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

type SubmenuKind = 'process' | 'decision' | 'change_action' | 'change_condition' | null;

const MENU_W = 200; // main menu width

interface FlowchartEditorProps {
  allowedBlocks?: string[];
}

export default function FlowchartEditor({ allowedBlocks: _allowedBlocks }: FlowchartEditorProps = {}) {
  const storeNodes = useFlowchartStore((s) => s.nodes);
  const storeEdges = useFlowchartStore((s) => s.edges);
  const store = useFlowchartStore();
  const { colors } = useTheme();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges as Edge[]);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>(null);
  const [submenu, setSubmenu] = useState<SubmenuKind>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfInstance = useRef<any>(null);

  useEffect(() => { setNodes(storeNodes as Node[]); }, [storeNodes]);
  useEffect(() => { setEdges(storeEdges as Edge[]); }, [storeEdges]);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!ctxMenu) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeAll(); }
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) closeAll();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onMouseDown); };
  }, [ctxMenu]);

  function closeAll() { setCtxMenu(null); setSubmenu(null); }

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
        labelBgStyle: { fill: colors.rfBg, fillOpacity: 0.95 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      };

      const updatedEdges = addEdge(newEdge, storeEdges as Edge[]);
      store.setEdges(updatedEdges as FlowEdge[]);
    },
    [storeEdges, store],
  );

  function onNodesChangeHandler(changes: any) {
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

  // Add a brand-new node at the clicked position
  function addBlock(type: FlowNodeType, data: Record<string, any>, screenPos?: { x: number; y: number }) {
    const id = `${type}_${Date.now()}`;
    let position = { x: 180 + Math.random() * 160, y: 80 + Math.random() * 140 };
    if (screenPos && rfInstance.current && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      position = rfInstance.current.project({ x: screenPos.x - rect.left, y: screenPos.y - rect.top });
    }
    store.setNodes([...storeNodes, { id, type, position, data } as FlowNode]);
    closeAll();
  }

  // Change an existing node's action type
  function changeAction(nodeId: string, actionType: string, label: string) {
    store.setNodes(
      storeNodes.map((n) =>
        n.id !== nodeId ? n : { ...n, data: { ...n.data, actionType, label } },
      ) as FlowNode[],
    );
    closeAll();
  }

  // Change an existing node's condition type
  function changeCondition(nodeId: string, patch: Record<string, any>) {
    store.setNodes(
      storeNodes.map((n) =>
        n.id !== nodeId ? n : { ...n, data: { ...n.data, ...patch } },
      ) as FlowNode[],
    );
    closeAll();
  }

  function copyNode(id: string) {
    const src = storeNodes.find((n) => n.id === id);
    if (!src) return;
    const newId = `${src.type}_${Date.now()}`;
    store.setNodes([...storeNodes, { ...src, id: newId, position: { x: src.position.x + 40, y: src.position.y + 40 }, data: { ...src.data } } as FlowNode]);
    closeAll();
  }

  function deleteNode(id: string) {
    store.setNodes(storeNodes.filter((n) => n.id !== id) as FlowNode[]);
    store.setEdges(storeEdges.filter((e) => e.source !== id && e.target !== id) as FlowEdge[]);
    closeAll();
  }

  function deleteEdge(id: string) {
    store.setEdges(storeEdges.filter((e) => e.id !== id) as FlowEdge[]);
    closeAll();
  }

  // Clamp so menu doesn't overflow viewport
  function clampPos(x: number, y: number, w: number, h: number) {
    return {
      left: Math.min(x, window.innerWidth - w - 8),
      top:  Math.min(y, window.innerHeight - h - 8),
    };
  }

  // Which node is selected (for change-action/condition)
  const selectedNodeId = ctxMenu?.kind === 'node' ? ctxMenu.id : null;
  const selectedNode = selectedNodeId ? storeNodes.find((n) => n.id === selectedNodeId) : null;
  const isActionNode    = selectedNode?.type === 'action';
  const isConditionNode = selectedNode?.type === 'condition';

  // Submenu content
  const showSubmenu = submenu !== null;
  const submenuGroups =
    submenu === 'process' || submenu === 'change_action'   ? ACTION_GROUPS
    : submenu === 'decision' || submenu === 'change_condition' ? CONDITION_GROUPS
    : null;

  // Position the main menu
  const menuX = ctxMenu ? ctxMenu.x + 6 : 0;
  const menuY = ctxMenu ? ctxMenu.y + 6 : 0;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div ref={wrapperRef} style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          onInit={(instance) => { rfInstance.current = instance; }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeHandler}
          onEdgesChange={onEdgesChangeHandler}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
          connectionLineType={ConnectionLineType.Step}
          connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,3' }}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1.1 }}
          minZoom={0.2}
          maxZoom={2}
          deleteKeyCode="Delete"
          snapToGrid
          snapGrid={[16, 16]}
          style={{ background: colors.rfBg }}
          onNodeClick={(e, node) => {
            e.stopPropagation();
            if ((e.target as HTMLElement).closest('button')) return;
            setSubmenu(null);
            setCtxMenu({ kind: 'node', x: e.clientX, y: e.clientY, id: node.id, label: (node.data as any).label ?? node.type ?? '', nodeType: node.type ?? '' });
          }}
          onEdgeClick={(e, edge) => {
            e.stopPropagation();
            setSubmenu(null);
            setCtxMenu({ kind: 'edge', x: e.clientX, y: e.clientY, id: edge.id });
          }}
          onPaneClick={(e) => {
            if (ctxMenu) { closeAll(); return; }
            setCtxMenu({ kind: 'pane', x: e.clientX, y: e.clientY });
          }}
        >
          <Background variant={BackgroundVariant.Lines} color={colors.border} gap={16} />
          <Controls style={{ background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)' }} />
        </ReactFlow>

        {/* ── Context Menu ─────────────────────────────────────────────────── */}
        {ctxMenu && (
          <div ref={menuRef} style={{ position: 'fixed', zIndex: 10000 }}>

            {/* Main menu */}
            <div style={{
              position: 'fixed',
              ...clampPos(menuX, menuY, MENU_W, 200),
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              minWidth: MENU_W,
              overflow: 'hidden',
            }}>
              {/* ── Pane menu ── */}
              {ctxMenu.kind === 'pane' && (
                <>
                  <MenuHeader label="เพิ่ม Block" colors={colors} />
                  <SubMenuItem
                    icon="▭" label="Process" desc="โจมตี / ฮีล / หลบ" color="#3b82f6"
                    active={submenu === 'process'}
                    onEnter={() => setSubmenu('process')}
                    colors={colors}
                  />
                  <SubMenuItem
                    icon="◇" label="Decision" desc="เงื่อนไข YES / NO" color="#d97706"
                    active={submenu === 'decision'}
                    onEnter={() => setSubmenu('decision')}
                    colors={colors}
                  />
                </>
              )}

              {/* ── Node menu ── */}
              {ctxMenu.kind === 'node' && (
                <>
                  <MenuHeader label={ctxMenu.label} colors={colors} />
                  {ctxMenu.nodeType !== 'start' && ctxMenu.nodeType !== 'end' && (
                    <>
                      {isActionNode && (
                        <SubMenuItem
                          icon="🔄" label="เปลี่ยน Action" color={colors.text}
                          active={submenu === 'change_action'}
                          onEnter={() => setSubmenu('change_action')}
                          colors={colors}
                        />
                      )}
                      {isConditionNode && (
                        <SubMenuItem
                          icon="🔄" label="เปลี่ยน Condition" color={colors.text}
                          active={submenu === 'change_condition'}
                          onEnter={() => setSubmenu('change_condition')}
                          colors={colors}
                        />
                      )}
                      <div style={{ height: 1, background: colors.borderSubtle, margin: '2px 0' }} />
                      <PlainMenuItem label="📋 คัดลอก" color={colors.text} onClick={() => copyNode(ctxMenu.id)} onEnter={() => setSubmenu(null)} colors={colors} />
                      <PlainMenuItem label="🗑 ลบ" color="#f87171" onClick={() => deleteNode(ctxMenu.id)} onEnter={() => setSubmenu(null)} colors={colors} />
                    </>
                  )}
                </>
              )}

              {/* ── Edge menu ── */}
              {ctxMenu.kind === 'edge' && (
                <>
                  <MenuHeader label="เส้นเชื่อม" colors={colors} />
                  <PlainMenuItem label="🗑 ลบเส้นนี้" color="#f87171" onClick={() => deleteEdge(ctxMenu.id)} onEnter={() => setSubmenu(null)} colors={colors} />
                </>
              )}
            </div>

            {/* ── Submenu panel ── */}
            {showSubmenu && submenuGroups && (
              <div style={{
                position: 'fixed',
                ...clampPos(menuX + MENU_W + 4, menuY, 200, 400),
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                minWidth: 200,
                overflow: 'hidden',
              }}>
                {submenuGroups.map((group) => (
                  <div key={group.label}>
                    {/* Group header */}
                    <div style={{ padding: '6px 12px 3px', fontSize: 9, fontWeight: 800, color: colors.textMuted, letterSpacing: 1 }}>
                      {group.label}
                    </div>
                    {group.items.map((item) => (
                      <button
                        key={item.type}
                        onClick={() => {
                          if (submenu === 'process' && ctxMenu?.kind === 'pane') {
                            addBlock('action', { actionType: item.type, label: item.label }, { x: ctxMenu.x, y: ctxMenu.y });
                          } else if (submenu === 'decision' && ctxMenu?.kind === 'pane') {
                            const cond = item as any;
                            addBlock('condition', { conditionType: cond.conditionType, label: item.label, threshold: cond.threshold ?? 50 }, { x: ctxMenu.x, y: ctxMenu.y });
                          } else if (submenu === 'change_action' && selectedNodeId) {
                            changeAction(selectedNodeId, item.type, item.label);
                          } else if (submenu === 'change_condition' && selectedNodeId) {
                            const cond = item as any;
                            changeCondition(selectedNodeId, { conditionType: cond.conditionType, label: item.label, threshold: cond.threshold ?? 50 });
                          }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', padding: '8px 14px',
                          border: 'none', background: 'transparent',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.bgSurfaceHover; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                        <span style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                      </button>
                    ))}
                    {/* Group separator */}
                    <div style={{ height: 1, background: colors.borderSubtle, margin: '2px 0' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MenuHeader({ label, colors }: { label: string; colors: ThemeColors }) {
  return (
    <div style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.borderSubtle}` }}>
      <p style={{ margin: 0, color: colors.textSub, fontSize: 11, fontWeight: 700 }}>{label}</p>
    </div>
  );
}

/** Menu item that opens a submenu on hover (shows › arrow) */
function SubMenuItem({
  icon, label, desc, color, active, onEnter, colors,
}: {
  icon: string; label: string; desc?: string; color: string;
  active: boolean; onEnter: () => void; colors: ThemeColors;
}) {
  return (
    <button
      onMouseEnter={onEnter}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '9px 12px',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        background: active ? colors.bgSurfaceHover : 'transparent',
      }}
    >
      <span style={{ fontSize: 14, color, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ color: colors.textMuted, fontSize: 10 }}>{desc}</div>}
      </div>
      <span style={{ color: colors.textMuted, fontSize: 12 }}>›</span>
    </button>
  );
}

/** Simple menu item — no submenu */
function PlainMenuItem({
  label, color, onClick, onEnter, colors,
}: {
  label: string; color: string; onClick: () => void; onEnter: () => void; colors: ThemeColors;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: '9px 12px',
        border: 'none', background: 'transparent', cursor: 'pointer',
        textAlign: 'left', color, fontWeight: 600, fontSize: 13,
      }}
      onMouseEnter={(e) => { onEnter(); (e.currentTarget as HTMLButtonElement).style.background = colors.bgSurfaceHover; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {label}
    </button>
  );
}
