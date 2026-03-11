import { Handle, Position } from 'reactflow';

export default function EndNode({ data }: { data: { label: string; isActive?: boolean } }) {
  const active = data.isActive;
  return (
    <div style={{
      position: 'relative',
      width: 180, height: 46,
      borderRadius: 23,
      background: active
        ? 'linear-gradient(135deg,#f87171,#dc2626)'
        : 'linear-gradient(135deg,#ef4444,#b91c1c)',
      border: active ? '2px solid #fff' : '2px solid #7f1d1d',
      boxShadow: active ? '0 0 18px rgba(248,113,113,0.9)' : '0 3px 10px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 12, color: 'white', letterSpacing: 2,
      userSelect: 'none',
    }}>
      <Handle type="target" position={Position.Top} style={{
        top: -6, background: '#f87171', border: '2px solid #fff', width: 10, height: 10,
      }} />
      END
    </div>
  );
}
