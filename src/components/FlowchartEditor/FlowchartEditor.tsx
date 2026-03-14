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
import { CLASS_SKILLS } from '../../utils/constants';
import { BLOCK_MANA_COST } from '../../engines/FlowchartEngine';
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
// Level-2 = categories, Level-3 = items inside
const ACTION_GROUPS = [
  {
    key: 'combat', label: 'COMBAT', icon: '⚔️',
    items: [
      { type: 'attack',       icon: '⚔️', label: 'Attack',       description: 'โจมตีศัตรูด้วยพลังปกติ' },
      { type: 'power_strike', icon: '💥', label: 'Power Strike',  description: 'โจมตีหนัก 2× แต่ราคาสูง' },
      { type: 'dodge',        icon: '🌀', label: 'Dodge',         description: 'หลบหนีการโจมตีครั้งถัดไป' },
      { type: 'cast_spell',   icon: '✨', label: 'Cast Spell',    description: 'เวทมนตร์ดาเมจสูงมาก' },
    ],
  },
  {
    key: 'support', label: 'SUPPORT', icon: '💚',
    items: [
      { type: 'heal',         icon: '💚', label: 'Heal',          description: 'ฟื้นฟู HP ของตัวเอง' },
      { type: 'berserk',      icon: '💢', label: 'Berserk',       description: 'เพิ่ม ATK แต่ลด DEF ชั่วคราว' },
      { type: 'use_potion',   icon: '🧪', label: 'Use Potion',    description: 'ดื่มยาฟื้นฟู HP ทันที' },
      { type: 'use_antidote', icon: '💊', label: 'Use Antidote',  description: 'แก้พิษ / Poisoned ทันที' },
      { type: 'debug_block',  icon: '🔧', label: 'Debug',         description: 'หยุด execution ชั่วคราว' },
    ],
  },
];

// Condition items — flat list per group (all clickable directly in level-3)
const CONDITION_GROUPS = [
  {
    key: 'hp', label: 'HP', icon: '❤️',
    items: [
      { conditionType: 'hp_less',    icon: '❤️', label: 'HP < 50?', threshold: 50 },
      { conditionType: 'hp_greater', icon: '❤️', label: 'HP > 50?', threshold: 50 },
    ],
  },
  {
    key: 'ailment', label: 'AILMENT', icon: '🔥',
    items: [
      { conditionType: 'hero_burning',   icon: '🔥', label: 'ฉัน Burning?' },
      { conditionType: 'enemy_burning',  icon: '🔥', label: 'ศัตรู Burning?' },
      { conditionType: 'hero_poisoned',  icon: '🟣', label: 'ฉัน Poisoned?' },
      { conditionType: 'enemy_poisoned', icon: '🟣', label: 'ศัตรู Poisoned?' },
      { conditionType: 'hero_frozen',    icon: '❄️', label: 'ฉัน Frozen?' },
      { conditionType: 'enemy_frozen',   icon: '❄️', label: 'ศัตรู Frozen?' },
    ],
  },
  {
    key: 'status', label: 'STATUS', icon: '☠️',
    items: [
      { conditionType: 'enemy_alive',   icon: '☠️', label: 'Enemy Alive?' },
      { conditionType: 'enemy_stunned', icon: '⚡', label: 'Enemy Stunned?' },
      { conditionType: 'is_corrupted',  icon: '🦠', label: 'Virus Present?' },
    ],
  },
  {
    key: 'counter', label: 'COUNTER', icon: '🔢',
    items: [
      { conditionType: 'turn_gte', icon: '🔢', label: 'Turn ≥ 3?', threshold: 3 },
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

type SubmenuKind = 'process' | 'decision' | 'change_action' | 'change_condition' | 'class_skills' | null;

const MENU_W = 200; // main menu width

interface FlowchartEditorProps {
  allowedBlocks?: string[];
  shieldRequiredTypes?: string[];
  nodeLimit?: number;
  turnManaMax?: number;
  turnManaUsed?: number;
  characterClass?: string;
  characterLevel?: number;
}

export default function FlowchartEditor({ allowedBlocks, shieldRequiredTypes, nodeLimit, turnManaMax, turnManaUsed, characterClass, characterLevel }: FlowchartEditorProps = {}) {
  const storeNodes = useFlowchartStore((s) => s.nodes);
  const storeEdges = useFlowchartStore((s) => s.edges);
  const store = useFlowchartStore();
  const { colors } = useTheme();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges as Edge[]);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>(null);
  const [submenu, setSubmenu] = useState<SubmenuKind>(null);
  const [subSubmenu, setSubSubmenu] = useState<string | null>(null); // level-3: variant item type
  const [submenuY, setSubmenuY] = useState(0);       // Y of level-1 item → positions level-2
  const [subSubmenuY, setSubSubmenuY] = useState(0); // Y of level-2 item → positions level-3
  const [nodeLimitFlash, setNodeLimitFlash] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfInstance = useRef<any>(null);

  // Count action nodes only (not start/end/condition/loop)
  const actionNodeCount = storeNodes.filter((n) => n.type === 'action').length;
  const atNodeLimit = nodeLimit !== undefined && actionNodeCount >= nodeLimit;
  const manaOverBudget = turnManaMax !== undefined && turnManaUsed !== undefined && turnManaUsed > turnManaMax;

  useEffect(() => { setNodes(storeNodes as Node[]); }, [storeNodes]);
  useEffect(() => {
    store.setShieldGlowTypes(shieldRequiredTypes ?? []);
    return () => { store.setShieldGlowTypes([]); };
  }, [shieldRequiredTypes]);
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

  function closeAll() { setCtxMenu(null); setSubmenu(null); setSubSubmenu(null); }

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
    // Enforce node limit for action nodes
    if (type === 'action' && nodeLimit !== undefined && actionNodeCount >= nodeLimit) {
      setNodeLimitFlash(true);
      setTimeout(() => setNodeLimitFlash(false), 1800);
      closeAll();
      return;
    }
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

  // Filter ACTION_GROUPS by allowedBlocks (if provided, hide blocks not in list)
  const filteredActionGroups = allowedBlocks
    ? ACTION_GROUPS
        .map((g) => ({ ...g, items: g.items.filter((item) => allowedBlocks.includes(item.type)) }))
        .filter((g) => g.items.length > 0)
    : ACTION_GROUPS;
  const showDecision = !allowedBlocks || allowedBlocks.includes('condition');

  // Filter CONDITION_GROUPS: if allowedBlocks contains specific conditionTypes, show only those
  const allConditionTypes = new Set(CONDITION_GROUPS.flatMap((g) => g.items.map((i) => i.conditionType)));
  const hasSpecificConditions = allowedBlocks?.some((b) => allConditionTypes.has(b)) ?? false;
  const filteredConditionGroups = allowedBlocks && hasSpecificConditions
    ? CONDITION_GROUPS
        .map((g) => ({ ...g, items: g.items.filter((item) => allowedBlocks.includes(item.conditionType)) }))
        .filter((g) => g.items.length > 0)
    : CONDITION_GROUPS;

  // Submenu content
  const showSubmenu = submenu !== null;
  const submenuGroups =
    submenu === 'process' || submenu === 'change_action'   ? filteredActionGroups
    : submenu === 'decision' || submenu === 'change_condition' ? filteredConditionGroups
    : null;

  // Class skills: all skills of the class (for display), filtered to unlocked for use
  const allClassSkills = characterClass
    ? CLASS_SKILLS.filter((s) => s.class === characterClass)
    : [];
  const unlockedClassSkills = allClassSkills.filter(
    (s) => s.requiredLevel <= (characterLevel ?? 1)
  );

  // Position the main menu
  const menuX = ctxMenu ? ctxMenu.x + 6 : 0;
  const menuY = ctxMenu ? ctxMenu.y + 6 : 0;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div ref={wrapperRef} style={{ flex: 1, position: 'relative' }}>
        {(nodeLimit !== undefined || (turnManaMax !== undefined && turnManaUsed !== undefined)) && (
          <div style={{
            position: 'absolute', top: 8, left: 8, zIndex: 100,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {turnManaMax !== undefined && turnManaUsed !== undefined && (
              <div style={{
                background: manaOverBudget ? 'rgba(239,68,68,0.18)' : 'rgba(59,130,246,0.15)',
                border: `1px solid ${manaOverBudget ? 'rgba(239,68,68,0.5)' : 'rgba(99,179,237,0.4)'}`,
                borderRadius: 8, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ fontSize: 12 }}>💎</span>
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  color: manaOverBudget ? '#f87171' : '#93c5fd',
                }}>
                  Budget: {turnManaUsed}/{turnManaMax} pts
                </span>
                {manaOverBudget && (
                  <span style={{ color: '#fca5a5', fontSize: 9, fontWeight: 700 }}>เกิน!</span>
                )}
              </div>
            )}
            {nodeLimit !== undefined && (
              <div style={{
                background: atNodeLimit ? 'rgba(239,68,68,0.18)' : 'rgba(100,116,139,0.15)',
                border: `1px solid ${atNodeLimit ? 'rgba(239,68,68,0.5)' : 'rgba(100,116,139,0.4)'}`,
                borderRadius: 8, padding: '4px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ fontSize: 12 }}>▭</span>
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  color: atNodeLimit ? '#f87171' : '#94a3b8',
                }}>
                  Blocks: {actionNodeCount}/{nodeLimit}
                </span>
                {atNodeLimit && (
                  <span style={{ color: '#fca5a5', fontSize: 9, fontWeight: 700 }}>เต็ม!</span>
                )}
              </div>
            )}
            {nodeLimitFlash && (
              <div style={{
                background: 'rgba(239,68,68,0.9)', borderRadius: 8, padding: '4px 10px',
                fontSize: 11, fontWeight: 800, color: 'white', textAlign: 'center',
                animation: 'pulse 0.3s ease',
              }}>
                ถึงขีดจำกัด Block แล้ว!
              </div>
            )}
          </div>
        )}
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
                    onEnter={(y) => { setSubmenu('process'); setSubmenuY(y); setSubSubmenu(null); }}
                    colors={colors}
                  />
                  {showDecision && (
                    <SubMenuItem
                      icon="◇" label="Decision" desc="เงื่อนไข YES / NO" color="#d97706"
                      active={submenu === 'decision'}
                      onEnter={(y) => { setSubmenu('decision'); setSubmenuY(y); setSubSubmenu(null); }}
                      colors={colors}
                    />
                  )}
                  {allClassSkills.length > 0 && !allowedBlocks && (
                    <SubMenuItem
                      icon="⭐" label="Class Skills" desc={`${unlockedClassSkills.length}/${allClassSkills.length} unlocked`} color="#a855f7"
                      active={submenu === 'class_skills'}
                      onEnter={(y) => { setSubmenu('class_skills'); setSubmenuY(y); setSubSubmenu(null); }}
                      colors={colors}
                    />
                  )}
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
                          onEnter={(y) => { setSubmenu('change_action'); setSubmenuY(y); setSubSubmenu(null); }}
                          colors={colors}
                        />
                      )}
                      {isConditionNode && (
                        <SubMenuItem
                          icon="🔄" label="เปลี่ยน Condition" color={colors.text}
                          active={submenu === 'change_condition'}
                          onEnter={(y) => { setSubmenu('change_condition'); setSubmenuY(y); setSubSubmenu(null); }}
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
                ...clampPos(menuX + MENU_W + 4, submenuY, 200, (submenuGroups.length * 44) + 8),
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                minWidth: 200,
                overflow: 'hidden',
              }}>
                {/* Level-2: category headers only */}
                {submenuGroups.map((group: any) => (
                  <div
                    key={group.key}
                    onMouseEnter={(e) => { setSubSubmenu(group.key); setSubSubmenuY(e.currentTarget.getBoundingClientRect().top); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', cursor: 'default',
                      background: subSubmenu === group.key ? colors.bgSurfaceHover : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{group.icon}</span>
                    <span style={{ color: colors.text, fontSize: 13, fontWeight: 600, flex: 1 }}>{group.label}</span>
                    <span style={{ color: colors.textMuted, fontSize: 11 }}>▶</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Class Skills submenu panel ── */}
            {showSubmenu && submenu === 'class_skills' && allClassSkills.length > 0 && (
              <div style={{
                position: 'fixed',
                ...clampPos(menuX + MENU_W + 4, submenuY, 240, allClassSkills.length * 62 + 32),
                background: colors.bgCard,
                border: `1px solid rgba(168,85,247,0.5)`,
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                minWidth: 240,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '6px 12px 3px', fontSize: 9, fontWeight: 800, color: '#a855f7', letterSpacing: 1 }}>
                  CLASS SKILLS — {characterClass?.toUpperCase()} (Lv.{characterLevel ?? 1})
                </div>
                <div style={{ height: 1, background: colors.borderSubtle, margin: '2px 0' }} />
                {allClassSkills.map((skill) => {
                  const locked = skill.requiredLevel > (characterLevel ?? 1);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => {
                        if (!locked && ctxMenu?.kind === 'pane') {
                          addBlock('action', { actionType: skill.id, label: skill.name }, { x: ctxMenu.x, y: ctxMenu.y });
                        }
                      }}
                      title={locked ? `ต้องการ Lv.${skill.requiredLevel}` : skill.description}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '8px 14px',
                        border: 'none', background: 'transparent',
                        cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'left',
                        opacity: locked ? 0.45 : 1,
                      }}
                      onMouseEnter={(e) => { if (!locked) (e.currentTarget as HTMLButtonElement).style.background = colors.bgSurfaceHover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{skill.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>{skill.name}</div>
                        <div style={{ color: colors.textMuted, fontSize: 9 }}>{skill.description}</div>
                      </div>
                      {locked
                        ? <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>🔒 Lv.{skill.requiredLevel}</span>
                        : <span style={{ color: '#93c5fd', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>💎{skill.manaCost}</span>
                      }
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Level-3: items ── */}
            {showSubmenu && subSubmenu && (() => {
              const group = (submenuGroups ?? []).find((g: any) => g.key === subSubmenu);
              if (!group) return null;
              const isAction = submenu === 'process' || submenu === 'change_action';
              const level3H = 36 + (group as any).items.length * 37; // header ~36px + items ~37px each
              return (
                <div style={{
                  position: 'fixed',
                  ...clampPos(menuX + MENU_W + 4 + 204, subSubmenuY, 200, level3H),
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  minWidth: 200,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '6px 12px 3px', fontSize: 9, fontWeight: 800, color: colors.textMuted, letterSpacing: 1 }}>
                    {(group as any).label}
                  </div>
                  <div style={{ height: 1, background: colors.borderSubtle, margin: '2px 0' }} />
                  {(group as any).items.map((item: any) => (
                    <button
                      key={item.type ?? item.conditionType}
                      onClick={() => {
                        if (isAction) {
                          if (submenu === 'process' && ctxMenu?.kind === 'pane') {
                            addBlock('action', { actionType: item.type, label: item.label }, { x: ctxMenu.x, y: ctxMenu.y });
                          } else if (submenu === 'change_action' && selectedNodeId) {
                            changeAction(selectedNodeId, item.type, item.label);
                          }
                        } else {
                          if (submenu === 'decision' && ctxMenu?.kind === 'pane') {
                            addBlock('condition', { conditionType: item.conditionType, label: item.label, threshold: item.threshold ?? 50 }, { x: ctxMenu.x, y: ctxMenu.y });
                          } else if (submenu === 'change_condition' && selectedNodeId) {
                            changeCondition(selectedNodeId, { conditionType: item.conditionType, label: item.label, threshold: item.threshold ?? 50 });
                          }
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                        {isAction && item.description && (
                          <div style={{ color: colors.textMuted, fontSize: 10 }}>{item.description}</div>
                        )}
                      </div>
                      {isAction && (() => {
                        const cost = BLOCK_MANA_COST[item.type] ?? 1;
                        return (
                          <span style={{
                            fontSize: 9, fontWeight: 800, flexShrink: 0,
                            color: cost === 0 ? 'rgba(255,255,255,0.3)' : '#fbbf24',
                            background: cost === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.15)',
                            border: `1px solid ${cost === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(251,191,36,0.4)'}`,
                            borderRadius: 4, padding: '1px 5px',
                          }}>
                            {cost === 0 ? 'free' : `💎${cost}`}
                          </span>
                        );
                      })()}
                    </button>
                  ))}
                </div>
              );
            })()}
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
  active: boolean; onEnter: (y: number) => void; colors: ThemeColors;
}) {
  return (
    <button
      onMouseEnter={(e) => onEnter(e.currentTarget.getBoundingClientRect().top)}
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
