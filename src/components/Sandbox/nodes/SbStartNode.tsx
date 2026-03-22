import { Handle, Position } from 'reactflow';
import { useSandboxStore } from '../sandboxStore';

export default function SbStartNode({ id }: { id: string }) {
  const activeHandleKey = useSandboxStore(s => s.activeHandleKey);
  const setActiveHandleKey = useSandboxStore(s => s.setActiveHandleKey);
  const visited   = useSandboxStore(s => s.execResult?.visitedNodeIds.includes(id) ?? false);
  const isCurrent = useSandboxStore(s => s.currentNodeId === id);
  const hl = visited && !isCurrent;

  return (
    <div style={{
      width: 180, height: 46, borderRadius: 23,
      background: hl
        ? 'linear-gradient(135deg,#4ade80,#16a34a)'
        : 'linear-gradient(135deg,#22c55e,#15803d)',
      border: isCurrent ? '2px solid #fff' : hl ? '2px solid #fff' : '2px solid #166534',
      boxShadow: isCurrent ? '0 0 0 3px #fff, 0 0 20px rgba(255,255,255,0.6)' : hl ? '0 0 18px rgba(74,222,128,0.9)' : '0 3px 10px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 13, color: 'white', letterSpacing: 3,
      userSelect: 'none',
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    }}>
      START
      <Handle
        type="source" position={Position.Bottom}
        className={`flow-handle${activeHandleKey === `${id}::source` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()}
        onMouseDown={() => setActiveHandleKey(`${id}::source`)}
        style={{ bottom: -6, background: '#4ade80', border: '2px solid #fff', width: 10, height: 10 }}
      />
    </div>
  );
}
