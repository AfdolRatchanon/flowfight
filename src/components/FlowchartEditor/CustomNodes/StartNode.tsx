import { Handle, Position } from 'reactflow';

export default function StartNode({ data }: { data: { label: string; isActive?: boolean } }) {
  const active = data.isActive;
  return (
    <div style={{
      position: 'relative',
      width: 180, height: 46,
      borderRadius: 23,
      background: active
        ? 'linear-gradient(135deg,#4ade80,#16a34a)'
        : 'linear-gradient(135deg,#22c55e,#15803d)',
      border: active ? '2px solid #fff' : '2px solid #166534',
      boxShadow: active ? '0 0 18px rgba(74,222,128,0.9)' : '0 3px 10px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 12, color: 'white', letterSpacing: 2,
      userSelect: 'none',
    }}>
      START
      <Handle type="source" position={Position.Bottom} style={{
        bottom: -6, background: '#4ade80', border: '2px solid #fff', width: 10, height: 10,
      }} />
    </div>
  );
}
