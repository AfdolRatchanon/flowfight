/**
 * SandboxEditor — Flowgorithm-style flowchart editor + executor
 * คลิกซ้าย canvas = เมนูเพิ่ม node
 * คลิก node = เมนู Copy / Delete
 * คลิก edge = เมนู Delete Edge
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background, Controls,
  addEdge, useNodesState, useEdgesState,
  BackgroundVariant, ConnectionLineType, MarkerType,
} from 'reactflow';
import type { Connection, Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { useTheme } from '../../contexts/ThemeContext';
import { useSandboxStore } from './sandboxStore';
import { sandboxStepper, type SbStep, type Value } from './sandboxEngine';
import SbStartNode    from './nodes/SbStartNode';
import SbEndNode      from './nodes/SbEndNode';
import SbProcessNode  from './nodes/SbProcessNode';
import SbDecisionNode from './nodes/SbDecisionNode';
import SbOutputNode   from './nodes/SbOutputNode';
import SbInputNode    from './nodes/SbInputNode';

const nodeTypes = {
  sb_start:    SbStartNode,
  sb_end:      SbEndNode,
  sb_process:  SbProcessNode,
  sb_decision: SbDecisionNode,
  sb_output:   SbOutputNode,
  sb_input:    SbInputNode,
};

const INITIAL_NODES: Node[] = [
  { id: 'start', type: 'sb_start', position: { x: 160, y: 40  }, data: {} },
  { id: 'end',   type: 'sb_end',   position: { x: 160, y: 220 }, data: {} },
];
const INITIAL_EDGES: Edge[] = [
  {
    id: 'start-end', source: 'start', target: 'end',
    type: 'step', markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  },
];

type SbType = 'sb_process' | 'sb_decision' | 'sb_output' | 'sb_input';

const ADD_MENU_ITEMS: { type: SbType; icon: string; label: string; desc: string; color: string }[] = [
  { type: 'sb_input',    icon: '▷', label: 'Input',    desc: 'รับค่าตัวแปร',       color: '#06b6d4' },
  { type: 'sb_process',  icon: '▭', label: 'Process',  desc: 'กำหนดค่า / คำนวณ',  color: '#3b82f6' },
  { type: 'sb_output',   icon: '▷', label: 'Output',   desc: 'แสดงผล / Print',     color: '#a855f7' },
  { type: 'sb_decision', icon: '◇', label: 'Decision', desc: 'เงื่อนไข YES / NO',  color: '#f59e0b' },
];

type RunMode = 'idle' | 'running' | 'paused' | 'done';
const SPEED_MS: Record<number, number> = { 1: 1200, 2: 600, 3: 250, 4: 80, 5: 20 };

type CtxMenu =
  | { kind: 'pane';  x: number; y: number; flowX: number; flowY: number }
  | { kind: 'node';  x: number; y: number; nodeId: string; nodeType: string }
  | { kind: 'edge';  x: number; y: number; edgeId: string }
  | null;

interface Props { onBack: () => void }

export default function SandboxEditor({ onBack }: Props) {
  const { colors } = useTheme();
  const setActiveHandleKey = useSandboxStore(s => s.setActiveHandleKey);
  const setExecResult      = useSandboxStore(s => s.setExecResult);
  const clearExecResult    = useSandboxStore(s => s.clearExecResult);
  const execResult         = useSandboxStore(s => s.execResult);
  const setCurrentNodeId   = useSandboxStore(s => s.setCurrentNodeId);

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [showOutput, setShowOutput] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>(null);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [pendingInputVars, setPendingInputVars] = useState<string[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [pendingRunMode, setPendingRunMode] = useState<'auto' | 'step'>('auto');

  // Step/auto run state
  const [runMode, setRunMode] = useState<RunMode>('idle');
  const [speed, setSpeed] = useState<1|2|3|4|5>(2);
  const [stepCount, setStepCount] = useState(0);

  const rfInstance  = useRef<any>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const menuRef     = useRef<HTMLDivElement>(null);
  const nodeCounter   = useRef(0);
  const runModeRef    = useRef<RunMode>('idle');
  const speedRef      = useRef<number>(2);
  const stepperRef    = useRef<Generator<SbStep, void, void> | null>(null);
  const timeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepCountRef  = useRef(0);

  function closeMenu() { setCtxMenu(null); }

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!ctxMenu) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeMenu(); }
    function onDown(e: MouseEvent)   {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [ctxMenu]);

  // Delete key — protect start/end
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setNodes(nds => nds.filter(n => !n.selected || n.type === 'sb_start' || n.type === 'sb_end'));
        setEdges(eds => eds.filter(ed => !ed.selected));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setNodes, setEdges]);

  const onConnect = useCallback((connection: Connection) => {
    const sh = connection.sourceHandle;
    const label = sh === 'yes' ? 'YES' : sh === 'no' ? 'NO' : '';
    const strokeColor = sh === 'yes' ? '#4ade80' : sh === 'no' ? '#f87171' : '#94a3b8';
    const edge: Edge = {
      ...connection,
      id: `e-${connection.source}-${sh ?? 'out'}-${connection.target}-${Date.now()}`,
      type: (sh === 'yes' || sh === 'no') ? 'smoothstep' : 'step',
      label,
      labelStyle: { fontSize: 10, fontWeight: 800, fill: strokeColor },
      labelBgStyle: { fill: 'rgba(0,0,0,0.65)', rx: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
      style: { stroke: strokeColor, strokeWidth: 2 },
    };
    setEdges(eds => addEdge(edge, eds));
    setActiveHandleKey(null);
  }, [setEdges, setActiveHandleKey]);

  // ── Add node ────────────────────────────────────────────────────────────────
  function addNode(type: SbType, flowPos?: { x: number; y: number }) {
    const id = `${type}-${Date.now()}`;
    let position = flowPos;
    if (!position) {
      const count = nodeCounter.current;
      const vp   = rfInstance.current?.getViewport?.() ?? { x: 0, y: 0, zoom: 1 };
      const rect = wrapperRef.current?.getBoundingClientRect();
      const cx = rect ? rect.width  * 0.45 : 200;
      const cy = rect ? rect.height * 0.45 : 150;
      position = {
        x: (-vp.x + cx) / vp.zoom + (count % 4) * 20,
        y: (-vp.y + cy) / vp.zoom + Math.floor(count / 4) * 30,
      };
    }
    nodeCounter.current++;
    setNodes(nds => [...nds, { id, type, position: position!, data: {} }]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stepperRef.current = null;
    setRunModeSynced('idle');
    clearExecResult();
    closeMenu();
  }

  // ── Copy node ────────────────────────────────────────────────────────────────
  function copyNode(nodeId: string) {
    const src = nodes.find(n => n.id === nodeId);
    if (!src) return;
    const id = `${src.type}-${Date.now()}`;
    setNodes(nds => [...nds, {
      ...src, id,
      position: { x: src.position.x + 40, y: src.position.y + 40 },
      data: { ...src.data },
      selected: false,
    }]);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stepperRef.current = null;
    setRunModeSynced('idle');
    clearExecResult();
    closeMenu();
  }

  // ── Delete node ──────────────────────────────────────────────────────────────
  function deleteNode(nodeId: string) {
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stepperRef.current = null;
    setRunModeSynced('idle');
    clearExecResult();
    closeMenu();
  }

  // ── Delete edge ──────────────────────────────────────────────────────────────
  function deleteEdge(edgeId: string) {
    setEdges(eds => eds.filter(e => e.id !== edgeId));
    closeMenu();
  }

  // ── Pane click → show "Add" menu ─────────────────────────────────────────────
  function handlePaneClick(e: React.MouseEvent) {
    setActiveHandleKey(null);
    if (ctxMenu) { closeMenu(); return; }
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || !rfInstance.current) return;
    const flow = rfInstance.current.project({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const menuW = 210, menuH = 210;
    setCtxMenu({
      kind: 'pane', flowX: flow.x, flowY: flow.y,
      x: Math.min(e.clientX + 6, window.innerWidth  - menuW - 8),
      y: Math.min(e.clientY + 6, window.innerHeight - menuH - 8),
    });
  }

  // ── Node click → show node menu ──────────────────────────────────────────────
  function handleNodeClick(e: React.MouseEvent, node: Node) {
    e.stopPropagation();
    if ((e.target as HTMLElement).closest('.flow-handle')) return;
    if ((e.target as HTMLElement).closest('input'))       return;
    if (node.type === 'sb_start' || node.type === 'sb_end') return;
    const menuW = 160, menuH = 100;
    setCtxMenu({
      kind: 'node', nodeId: node.id, nodeType: node.type ?? '',
      x: Math.min(e.clientX + 6, window.innerWidth  - menuW - 8),
      y: Math.min(e.clientY + 6, window.innerHeight - menuH - 8),
    });
  }

  // ── Edge click → show edge menu ───────────────────────────────────────────────
  function handleEdgeClick(e: React.MouseEvent, edge: Edge) {
    e.stopPropagation();
    const menuW = 160, menuH = 60;
    setCtxMenu({
      kind: 'edge', edgeId: edge.id,
      x: Math.min(e.clientX + 6, window.innerWidth  - menuW - 8),
      y: Math.min(e.clientY + 6, window.innerHeight - menuH - 8),
    });
  }

  // ── Step execution helpers ──────────────────────────────────────────────────

  function setRunModeSynced(mode: RunMode) {
    runModeRef.current = mode;
    setRunMode(mode);
  }

  function applyStep(step: SbStep) {
    stepCountRef.current++;
    setStepCount(stepCountRef.current);
    setCurrentNodeId(step.done ? null : (step.nodeId || null));
    setExecResult({
      output: step.output,
      variables: step.vars,
      // When done: show all visited. While running: exclude current from visited so it shows current highlight
      visitedNodeIds: step.done
        ? step.visitedSoFar
        : step.visitedSoFar.filter(id => id !== step.nodeId),
      error: step.error,
    });
    setShowOutput(true);
  }

  /** Advance one step. Returns true if can continue. */
  function advanceStepper(): boolean {
    if (!stepperRef.current) return false;
    const result = stepperRef.current.next();
    if (result.done || !result.value) {
      setRunModeSynced('done');
      setCurrentNodeId(null);
      return false;
    }
    const step = result.value;
    applyStep(step);
    if (step.done) {
      setRunModeSynced('done');
      return false;
    }
    return true;
  }

  function scheduleAutoStep() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (runModeRef.current !== 'running') return;
      const canContinue = advanceStepper();
      if (canContinue && runModeRef.current === 'running') scheduleAutoStep();
    }, SPEED_MS[speedRef.current] ?? 600);
  }

  function initStepper(inputs: Record<string, Value>) {
    stepperRef.current = sandboxStepper(nodes as any, edges as any, inputs);
    stepCountRef.current = 0;
    setStepCount(0);
  }

  function startAuto(inputs: Record<string, Value>) {
    initStepper(inputs);
    setRunModeSynced('running');
    scheduleAutoStep();
  }

  function startStep(inputs: Record<string, Value>) {
    initStepper(inputs);
    setRunModeSynced('paused');
    advanceStepper();
  }

  // ── Input collection helper ─────────────────────────────────────────────────

  function collectInputVarNames(): string[] {
    return [
      ...new Set(
        nodes
          .filter(n => n.type === 'sb_input')
          .map(n => ((n.data as any).varName ?? '').trim() as string)
          .filter(Boolean),
      ),
    ];
  }

  function parseInputValues(): Record<string, Value> {
    const parsed: Record<string, Value> = {};
    for (const varName of pendingInputVars) {
      const raw = inputValues[varName] ?? '';
      const num = parseFloat(raw);
      parsed[varName] = isNaN(num) ? raw : num;
    }
    return parsed;
  }

  // ── Button handlers ─────────────────────────────────────────────────────────

  function handleAutoBtn() {
    if (runMode === 'running') {
      // Pause
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setRunModeSynced('paused');
      return;
    }
    if (runMode === 'paused') {
      // Resume auto from current position
      setRunModeSynced('running');
      scheduleAutoStep();
      return;
    }
    // idle or done → start fresh
    const varNames = collectInputVarNames();
    if (varNames.length > 0) {
      setPendingRunMode('auto');
      setPendingInputVars(varNames);
      setInputValues({});
      setShowInputDialog(true);
    } else {
      startAuto({});
    }
  }

  function handleStepBtn() {
    if (runMode === 'running') {
      // Pause first, then advance once
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setRunModeSynced('paused');
      advanceStepper();
      return;
    }
    if (runMode === 'paused') {
      advanceStepper();
      return;
    }
    // idle or done → create new stepper + advance one step
    const varNames = collectInputVarNames();
    if (varNames.length > 0) {
      setPendingRunMode('step');
      setPendingInputVars(varNames);
      setInputValues({});
      setShowInputDialog(true);
    } else {
      startStep({});
    }
  }

  function handleStop() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    stepperRef.current = null;
    setRunModeSynced('idle');
    setCurrentNodeId(null);
    // Keep execResult visible so student can see where it stopped
  }

  function confirmRun() {
    const parsed = parseInputValues();
    setShowInputDialog(false);
    if (pendingRunMode === 'auto') startAuto(parsed);
    else startStep(parsed);
  }

  function handleClear() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    stepperRef.current = null;
    setRunModeSynced('idle');
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    clearExecResult();
    nodeCounter.current = 0;
    stepCountRef.current = 0;
    setStepCount(0);
  }

  const hasError  = execResult?.error;
  const outputLog = execResult?.output ?? [];
  const variables = execResult?.variables ?? {};

  // ── Menu style helpers ───────────────────────────────────────────────────────
  const menuBase: React.CSSProperties = {
    position: 'fixed', zIndex: 10000,
    background: colors.bgCard ?? '#1e293b',
    border: `1px solid ${colors.border ?? '#334155'}`,
    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  };
  const menuHeader: React.CSSProperties = {
    padding: '7px 14px', fontSize: 10, fontWeight: 800,
    color: colors.textMuted ?? '#94a3b8', letterSpacing: 1,
    borderBottom: `1px solid ${colors.borderSubtle ?? '#1e293b'}`,
    background: 'rgba(255,255,255,0.03)',
  };

  function MenuBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '9px 14px', border: 'none', cursor: 'pointer',
          background: hov ? `${color}20` : 'transparent', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        background: colors.bgSurface, borderBottom: `1px solid ${colors.borderSubtle}`,
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: `1px solid ${colors.borderSubtle}`,
          color: colors.text, width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 15,
        }}>←</button>

        <div>
          <div style={{ fontFamily: "'Cinzel', serif", color: '#FBBF24', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>
            Sandbox — Flowchart
          </div>
          <div style={{ color: colors.textMuted, fontSize: 10 }}>
            คลิก canvas = เพิ่ม · คลิก node/edge = เมนู · Del = ลบ · ลาก handle = เชื่อม
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Speed selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 9, color: colors.textMuted, marginRight: 2, fontWeight: 700 }}>SPEED</span>
          {([1,2,3,4,5] as const).map(s => (
            <button key={s} onClick={() => { speedRef.current = s; setSpeed(s); }} style={{
              padding: '3px 7px', borderRadius: 4, fontSize: 10, fontWeight: 800, cursor: 'pointer',
              border: s === speed ? '1px solid #fbbf24' : `1px solid ${colors.borderSubtle}`,
              background: s === speed ? 'rgba(251,191,36,0.15)' : 'transparent',
              color: s === speed ? '#fbbf24' : colors.textMuted,
            }}>x{s}</button>
          ))}
        </div>

        {/* Status pill */}
        {runMode !== 'idle' && (
          <div style={{
            padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 800,
            background: runMode === 'running' ? 'rgba(34,197,94,0.15)' : runMode === 'done' ? 'rgba(96,165,250,0.15)' : 'rgba(251,191,36,0.15)',
            color: runMode === 'running' ? '#4ade80' : runMode === 'done' ? '#60a5fa' : '#fbbf24',
            border: `1px solid ${runMode === 'running' ? 'rgba(74,222,128,0.3)' : runMode === 'done' ? 'rgba(96,165,250,0.3)' : 'rgba(251,191,36,0.3)'}`,
          }}>
            {runMode === 'running' ? `Running...` : runMode === 'done' ? `Done (${stepCount} steps)` : `Step ${stepCount}`}
          </div>
        )}

        {/* Step button */}
        <button
          onClick={handleStepBtn}
          disabled={runMode === 'done'}
          style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: runMode === 'done' ? 'not-allowed' : 'pointer',
            background: runMode === 'done' ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.15)',
            color: runMode === 'done' ? colors.textMuted : '#fbbf24',
            border: `1px solid ${runMode === 'done' ? colors.borderSubtle : 'rgba(251,191,36,0.4)'}`,
            opacity: runMode === 'done' ? 0.5 : 1,
          }}
        >⊳ Step</button>

        {/* Auto / Pause / Resume button */}
        <button onClick={handleAutoBtn} style={{
          padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer',
          background: runMode === 'running'
            ? 'linear-gradient(135deg,#f59e0b,#d97706)'
            : 'linear-gradient(135deg,#22c55e,#15803d)',
          color: 'white', border: 'none',
          boxShadow: runMode === 'running' ? '0 2px 8px rgba(245,158,11,0.4)' : '0 2px 8px rgba(34,197,94,0.4)',
        }}>
          {runMode === 'running' ? '⏸ Pause' : runMode === 'paused' ? '▶ Resume' : '▶ Auto'}
        </button>

        {/* Stop button */}
        <button
          onClick={handleStop}
          disabled={runMode === 'idle' || runMode === 'done'}
          style={{
            padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800,
            cursor: runMode === 'idle' || runMode === 'done' ? 'not-allowed' : 'pointer',
            border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)', color: '#f87171',
            opacity: runMode === 'idle' || runMode === 'done' ? 0.4 : 1,
          }}
        >■ Stop</button>

        <button onClick={handleClear} style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          border: `1px solid ${colors.borderSubtle}`, background: 'transparent', color: colors.textMuted,
        }}>↺ Reset</button>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Canvas */}
        <div ref={wrapperRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={inst => (rfInstance.current = inst)}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.Step}
            connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,3' }}
            deleteKeyCode={null}
            fitView fitViewOptions={{ padding: 0.3 }}
            snapToGrid snapGrid={[16, 16]}
            minZoom={0.2} maxZoom={2}
            style={{ background: colors.rfBg ?? '#0d1117' }}
            onPaneClick={handlePaneClick}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
          >
            <Background variant={BackgroundVariant.Lines} color={colors.border ?? '#1e293b'} gap={16} />
            <Controls style={{ background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}` }} />
          </ReactFlow>

          {/* ── Context Menus ── */}
          {ctxMenu && (
            <div ref={menuRef} style={{ ...menuBase, left: ctxMenu.x, top: ctxMenu.y }}>

              {/* Pane menu — Add node */}
              {ctxMenu.kind === 'pane' && (
                <>
                  <div style={menuHeader}>เพิ่ม Node</div>
                  {ADD_MENU_ITEMS.map(item => (
                    <button
                      key={item.type}
                      onClick={() => addNode(item.type, { x: ctxMenu.flowX, y: ctxMenu.flowY })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '9px 14px', background: 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${item.color}18`)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: 15, color: item.color, width: 22, textAlign: 'center' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: colors.textMuted }}>{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Node menu — Copy / Delete */}
              {ctxMenu.kind === 'node' && (
                <>
                  <div style={menuHeader}>Node</div>
                  <MenuBtn label="Copy" color="#60a5fa"
                    onClick={() => copyNode(ctxMenu.nodeId)} />
                  <MenuBtn label="Delete" color="#f87171"
                    onClick={() => deleteNode(ctxMenu.nodeId)} />
                </>
              )}

              {/* Edge menu — Delete */}
              {ctxMenu.kind === 'edge' && (
                <>
                  <div style={menuHeader}>Edge</div>
                  <MenuBtn label="Delete Edge" color="#f87171"
                    onClick={() => deleteEdge(ctxMenu.edgeId)} />
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Output Panel ── */}
        {showOutput && (
          <div style={{
            width: 260, flexShrink: 0,
            background: colors.bgSurface, borderLeft: `1px solid ${colors.borderSubtle}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderBottom: `1px solid ${colors.borderSubtle}`, flexShrink: 0,
            }}>
              <span style={{ color: colors.text, fontSize: 12, fontWeight: 700 }}>Output</span>
              <button onClick={() => setShowOutput(false)} style={{
                background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 16, padding: 0,
              }}>×</button>
            </div>

            {hasError && (
              <div style={{
                margin: 8, padding: '8px 10px', borderRadius: 6,
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                color: '#f87171', fontSize: 11,
              }}>Error: {execResult?.error}</div>
            )}

            {Object.keys(variables).length > 0 && (
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.borderSubtle}`, flexShrink: 0 }}>
                <div style={{ color: colors.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>VARIABLES</div>
                {Object.entries(variables).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12 }}>
                    <span style={{ color: '#67e8f9', fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{k}</span>
                    <span style={{ color: '#bef264', fontFamily: "'Courier New', monospace" }}>
                      {typeof v === 'string' ? `"${v}"` : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              <div style={{ color: colors.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>CONSOLE</div>
              {outputLog.length === 0 && !hasError && (
                <div style={{ color: colors.textMuted, fontSize: 11, fontStyle: 'italic' }}>ไม่มี output</div>
              )}
              {outputLog.map((line, i) => (
                <div key={i} style={{
                  fontSize: 12, fontFamily: "'Courier New', monospace",
                  color: line.startsWith('---') ? colors.textMuted : colors.text,
                  fontStyle: line.startsWith('---') ? 'italic' : 'normal', marginBottom: 2,
                }}>
                  {!line.startsWith('---') && <span style={{ color: '#4ade80', marginRight: 6, fontSize: 10 }}>{i + 1}</span>}
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Input Dialog ── */}
      {showInputDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 20000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: colors.bgCard ?? '#1e293b',
            border: `1px solid ${colors.border ?? '#334155'}`,
            borderRadius: 12, padding: 24, minWidth: 320,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#67e8f9', marginBottom: 4 }}>กรอกค่า Input</div>
            <div style={{ fontSize: 10, color: colors.textMuted ?? '#94a3b8', marginBottom: 16 }}>
              โปรแกรมต้องการค่าตัวแปรต่อไปนี้
            </div>
            {pendingInputVars.map((varName, idx) => (
              <div key={varName} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: colors.textMuted ?? '#94a3b8', display: 'block', marginBottom: 4 }}>
                  ตัวแปร{' '}
                  <span style={{ color: '#67e8f9', fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{varName}</span>
                </label>
                <input
                  autoFocus={idx === 0}
                  value={inputValues[varName] ?? ''}
                  placeholder="กรอกค่า..."
                  onChange={e => setInputValues(prev => ({ ...prev, [varName]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && confirmRun()}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 6, color: 'white', fontSize: 13,
                    padding: '7px 10px', outline: 'none',
                    fontFamily: "'Courier New', monospace",
                  }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => setShowInputDialog(false)}
                style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: 'transparent', border: `1px solid ${colors.borderSubtle ?? '#334155'}`,
                  color: colors.textMuted ?? '#94a3b8',
                }}
              >ยกเลิก</button>
              <button
                onClick={confirmRun}
                style={{
                  padding: '6px 18px', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  background: 'linear-gradient(135deg,#22c55e,#15803d)',
                  color: 'white', border: 'none',
                }}
              >▶ Run</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div style={{
        padding: '4px 14px', background: colors.bgSurface,
        borderTop: `1px solid ${colors.borderSubtle}`,
        display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0,
      }}>
        {[
          { color: '#22c55e', label: 'Start / End (Oval)' },
          { color: '#3b82f6', label: 'Process (Rectangle)' },
          { color: '#f59e0b', label: 'Decision (Diamond)' },
          { color: '#a855f7', label: 'Output (Parallelogram)' },
          { color: '#06b6d4', label: 'Input (Parallelogram)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span style={{ color: colors.textMuted, fontSize: 10 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
