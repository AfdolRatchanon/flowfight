/**
 * Output Node — parallelogram shape (print statement)
 * ใช้ skewed background div เพื่อให้ handle ตำแหน่งถูกต้อง
 */
import { Handle, Position, useReactFlow } from 'reactflow';
import { useSandboxStore } from '../sandboxStore';

interface Props {
  id: string;
  data: { expression?: string };
}

const stop = (e: React.SyntheticEvent) => { e.stopPropagation(); };

export default function SbOutputNode({ id, data }: Props) {
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
      position: 'relative', width: 180, height: 54, userSelect: 'none',
      filter: isCurrent ? 'drop-shadow(0 0 8px white) brightness(1.2)' : undefined,
      transition: 'filter 0.15s ease',
    }}>
      {/* Parallelogram background (skewed) */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: 'skewX(-12deg)',
        background: hl
          ? 'linear-gradient(135deg,#c084fc,#7c3aed)'
          : 'linear-gradient(135deg,#7c3aed,#5b21b6)',
        border: hl ? '2px solid #fff' : '2px solid #6d28d9',
        borderRadius: 4,
        boxShadow: hl ? '0 0 16px rgba(192,132,252,0.8)' : '0 3px 10px rgba(0,0,0,0.5)',
      }} />

      {/* Content (not skewed) */}
      <div style={{
        position: 'relative', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', gap: 3,
      }}>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1 }}>
          OUTPUT
        </div>
        <input
          value={data.expression ?? ''}
          placeholder={'"Hello" หรือ x'}
          onChange={e => handleChange(e.target.value)}
          onMouseDown={stop} onPointerDown={stop} onKeyDown={stop} onClick={stop}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4,
            color: 'white', fontSize: 12, fontWeight: 700,
            padding: '3px 6px', outline: 'none', boxSizing: 'border-box',
            textAlign: 'center', fontFamily: "'Courier New', monospace",
          }}
        />
      </div>

      <Handle type="target" position={Position.Top}
        className={`flow-handle${activeHandleKey === `${id}::target` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::target`)}
        style={{ top: -6, background: '#c084fc', border: '2px solid #fff', width: 10, height: 10 }}
      />
      <Handle type="source" position={Position.Bottom}
        className={`flow-handle${activeHandleKey === `${id}::source` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::source`)}
        style={{ bottom: -6, background: '#c084fc', border: '2px solid #fff', width: 10, height: 10 }}
      />
    </div>
  );
}
