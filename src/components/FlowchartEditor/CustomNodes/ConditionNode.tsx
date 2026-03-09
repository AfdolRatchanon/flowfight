import { Handle, Position } from 'reactflow';

export default function ConditionNode({ data }: { data: { label: string; isActive?: boolean } }) {
  const active = data.isActive;
  // Diamond shape: ใช้ SVG เพื่อให้ handles ทำงานถูกต้อง
  const W = 150, H = 70;
  return (
    <div style={{ position: 'relative', width: W, height: H, userSelect: 'none' }}>
      {/* Diamond SVG */}
      <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <polygon
          points={`${W/2},2 ${W-2},${H/2} ${W/2},${H-2} 2,${H/2}`}
          fill={active ? '#fbbf24' : '#d97706'}
          stroke={active ? '#fff' : '#92400e'}
          strokeWidth={2}
          style={{ filter: active ? 'drop-shadow(0 0 12px rgba(251,191,36,0.8))' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }}
        />
      </svg>

      {/* Label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, color: '#1c1917',
        textAlign: 'center', padding: '0 20px', lineHeight: 1.3,
      }}>
        {data.label}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{
        top: -4, left: '50%', transform: 'translateX(-50%)',
        background: '#fde68a', border: '2px solid #fff', width: 10, height: 10,
      }} />
      {/* YES → ขวา */}
      <Handle type="source" id="yes" position={Position.Right} style={{
        right: -4, top: '50%', transform: 'translateY(-50%)',
        background: '#4ade80', border: '2px solid #fff', width: 10, height: 10,
      }} />
      {/* NO → ล่าง */}
      <Handle type="source" id="no" position={Position.Bottom} style={{
        bottom: -4, left: '50%', transform: 'translateX(-50%)',
        background: '#f87171', border: '2px solid #fff', width: 10, height: 10,
      }} />

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
