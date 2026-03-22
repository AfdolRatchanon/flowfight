import { Handle, Position, useReactFlow } from 'reactflow';
import { useSandboxStore } from '../sandboxStore';

interface Props {
  id: string;
  data: { expression?: string };
}

const stop = (e: React.SyntheticEvent) => { e.stopPropagation(); };

const W = 180, H = 90;

export default function SbDecisionNode({ id, data }: Props) {
  const { setNodes } = useReactFlow();
  const activeHandleKey = useSandboxStore(s => s.activeHandleKey);
  const setActiveHandleKey = useSandboxStore(s => s.setActiveHandleKey);
  const visited   = useSandboxStore(s => s.execResult?.visitedNodeIds.includes(id) ?? false);
  const isCurrent = useSandboxStore(s => s.currentNodeId === id);
  const hl = visited && !isCurrent;

  function handleChange(val: string) {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, expression: val } } : n));
  }

  return (
    <div style={{
      position: 'relative', width: W, height: H, userSelect: 'none',
      filter: isCurrent ? 'drop-shadow(0 0 8px white) brightness(1.2)' : undefined,
      transition: 'filter 0.15s ease',
    }}>
      {/* Diamond SVG background */}
      <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        <polygon
          points={`${W / 2},2 ${W - 2},${H / 2} ${W / 2},${H - 2} 2,${H / 2}`}
          fill={hl ? '#fbbf24' : '#d97706'}
          stroke={hl ? '#fff' : '#92400e'}
          strokeWidth={2}
          style={{ filter: hl ? 'drop-shadow(0 0 12px rgba(251,191,36,0.8))' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }}
        />
      </svg>

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 30px', gap: 4,
      }}>
        <div style={{ fontSize: 8, color: 'rgba(0,0,0,0.4)', fontWeight: 700, letterSpacing: 1 }}>DECISION</div>
        <input
          value={data.expression ?? ''}
          placeholder="x > 0"
          onChange={e => handleChange(e.target.value)}
          onMouseDown={stop} onPointerDown={stop} onKeyDown={stop} onClick={stop}
          style={{
            width: '100%', background: 'rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.2)', borderRadius: 4,
            color: '#1c1917', fontSize: 11, fontWeight: 700,
            padding: '2px 5px', outline: 'none', boxSizing: 'border-box',
            textAlign: 'center', fontFamily: "'Courier New', monospace",
          }}
        />
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top}
        className={`flow-handle${activeHandleKey === `${id}::target` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::target`)}
        style={{ top: -4, left: '50%', transform: 'translateX(-50%)', background: '#fde68a', border: '2px solid #fff', width: 10, height: 10 }}
      />
      <Handle type="source" id="yes" position={Position.Right}
        className={`flow-handle${activeHandleKey === `${id}::yes` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::yes`)}
        style={{ right: -4, top: '50%', transform: 'translateY(-50%)', background: '#4ade80', border: '2px solid #fff', width: 10, height: 10 }}
      />
      <Handle type="source" id="no" position={Position.Bottom}
        className={`flow-handle${activeHandleKey === `${id}::no` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::no`)}
        style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)', background: '#f87171', border: '2px solid #fff', width: 10, height: 10 }}
      />

      {/* YES / NO labels */}
      <span style={{
        position: 'absolute', right: -28, top: '50%', transform: 'translateY(-50%)',
        fontSize: 9, fontWeight: 800, color: '#4ade80',
      }}>YES</span>
      <span style={{
        position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
        fontSize: 9, fontWeight: 800, color: '#f87171',
      }}>NO</span>
    </div>
  );
}
