/**
 * Input Node — parallelogram shape
 * ผู้ใช้ระบุชื่อตัวแปร — ค่าจะถูกถามก่อน Run ผ่าน Input Dialog
 */
import { Handle, Position, useReactFlow } from 'reactflow';
import { useSandboxStore } from '../sandboxStore';

interface Props {
  id: string;
  data: { varName?: string };
}

const stop = (e: React.SyntheticEvent) => { e.stopPropagation(); };

export default function SbInputNode({ id, data }: Props) {
  const { setNodes } = useReactFlow();
  const activeHandleKey = useSandboxStore(s => s.activeHandleKey);
  const setActiveHandleKey = useSandboxStore(s => s.setActiveHandleKey);
  const visited   = useSandboxStore(s => s.execResult?.visitedNodeIds.includes(id) ?? false);
  const isCurrent = useSandboxStore(s => s.currentNodeId === id);
  const hl = visited && !isCurrent;

  function handleChange(val: string) {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, varName: val } } : n));
  }

  return (
    <div style={{
      position: 'relative', width: 180, height: 62, userSelect: 'none',
      filter: isCurrent ? 'drop-shadow(0 0 8px white) brightness(1.2)' : undefined,
      transition: 'filter 0.15s ease',
    }}>
      {/* Parallelogram background */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: 'skewX(-12deg)',
        background: hl
          ? 'linear-gradient(135deg,#67e8f9,#0891b2)'
          : 'linear-gradient(135deg,#0891b2,#0e7490)',
        border: hl ? '2px solid #fff' : '2px solid #155e75',
        borderRadius: 4,
        boxShadow: hl ? '0 0 16px rgba(103,232,249,0.8)' : '0 3px 10px rgba(0,0,0,0.5)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 18px', gap: 3,
      }}>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1 }}>
          INPUT
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>รับค่า</span>
          <input
            value={data.varName ?? ''}
            placeholder="ชื่อตัวแปร"
            onChange={e => handleChange(e.target.value)}
            onMouseDown={stop} onPointerDown={stop} onKeyDown={stop} onClick={stop}
            style={{
              flex: 1, minWidth: 0,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4, color: 'white', fontSize: 12, fontWeight: 700,
              padding: '3px 6px', outline: 'none',
              fontFamily: "'Courier New', monospace",
            }}
          />
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
          ค่าจะถูกถามก่อน Run
        </div>
      </div>

      <Handle type="target" position={Position.Top}
        className={`flow-handle${activeHandleKey === `${id}::target` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::target`)}
        style={{ top: -6, left: '50%', transform: 'translateX(-50%)', background: '#67e8f9', border: '2px solid #fff', width: 10, height: 10 }}
      />
      <Handle type="source" position={Position.Bottom}
        className={`flow-handle${activeHandleKey === `${id}::source` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::source`)}
        style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)', background: '#67e8f9', border: '2px solid #fff', width: 10, height: 10 }}
      />
    </div>
  );
}
