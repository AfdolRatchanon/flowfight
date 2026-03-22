import { Handle, Position } from 'reactflow';
import { useSandboxStore } from '../sandboxStore';

export default function SbEndNode({ id }: { id: string }) {
  const activeHandleKey = useSandboxStore(s => s.activeHandleKey);
  const setActiveHandleKey = useSandboxStore(s => s.setActiveHandleKey);
  const visited   = useSandboxStore(s => s.execResult?.visitedNodeIds.includes(id) ?? false);
  const isCurrent = useSandboxStore(s => s.currentNodeId === id);
  const hl = visited && !isCurrent;

  return (
    <div style={{
      width: 180, height: 46, borderRadius: 23,
      background: hl
        ? 'linear-gradient(135deg,#f87171,#dc2626)'
        : 'linear-gradient(135deg,#ef4444,#b91c1c)',
      border: isCurrent ? '2px solid #fff' : hl ? '2px solid #fff' : '2px solid #7f1d1d',
      boxShadow: isCurrent ? '0 0 0 3px #fff, 0 0 20px rgba(255,255,255,0.6)' : hl ? '0 0 18px rgba(248,113,113,0.9)' : '0 3px 10px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 13, color: 'white', letterSpacing: 3,
      userSelect: 'none',
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    }}>
      <Handle
        type="target" position={Position.Top}
        className={`flow-handle${activeHandleKey === `${id}::target` ? ' flow-handle--active' : ''}`}
        onContextMenu={e => e.stopPropagation()}
        onMouseDown={() => setActiveHandleKey(`${id}::target`)}
        style={{ top: -6, background: '#f87171', border: '2px solid #fff', width: 10, height: 10 }}
      />
      END
    </div>
  );
}
