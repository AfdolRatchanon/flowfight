import { Handle, Position, useReactFlow } from 'reactflow';
import { useSandboxStore } from '../sandboxStore';

interface Props {
  id: string;
  data: { expression?: string };
}

const stop = (e: React.SyntheticEvent) => { e.stopPropagation(); };

export default function SbProcessNode({ id, data }: Props) {
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
      position: 'relative', width: 180,
      padding: '8px 14px',
      borderRadius: 6,
      background: hl
        ? 'linear-gradient(135deg,#60a5fa,#2563eb)'
        : 'linear-gradient(135deg,#1e3a8a,#1d4ed8)',
      border: isCurrent ? '2px solid #fff' : hl ? '2px solid #fff' : '2px solid rgba(147,197,253,0.35)',
      boxShadow: isCurrent ? '0 0 0 3px #fff, 0 0 20px rgba(255,255,255,0.6)' : hl ? '0 0 16px rgba(96,165,250,0.8)' : '0 3px 10px rgba(0,0,0,0.5)',
      userSelect: 'none',
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    }}>
      <Handle
        type="target" position={Position.Top}
        className={`flow-handle${activeHandleKey === `${id}::target` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::target`)}
        style={{ top: -6, background: '#93c5fd', border: '2px solid #fff', width: 10, height: 10 }}
      />

      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
        PROCESS
      </div>
      <input
        value={data.expression ?? ''}
        placeholder="x = x + 1"
        onChange={e => handleChange(e.target.value)}
        onMouseDown={stop} onPointerDown={stop} onKeyDown={stop} onClick={stop}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4,
          color: 'white', fontSize: 12, fontWeight: 700,
          padding: '3px 6px', outline: 'none', boxSizing: 'border-box',
          fontFamily: "'Courier New', monospace",
        }}
      />

      <Handle
        type="source" position={Position.Bottom}
        className={`flow-handle${activeHandleKey === `${id}::source` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::source`)}
        style={{ bottom: -6, background: '#93c5fd', border: '2px solid #fff', width: 10, height: 10 }}
      />
    </div>
  );
}
