import { Handle, Position } from 'reactflow';

const ACTION_ICONS: Record<string, string> = {
  attack: '⚔️',
  heal: '💚',
  dodge: '🌀',
  cast_spell: '✨',
  use_item: '🎒',
};

export default function ActionNode({ data }: { data: { label: string; actionType?: string; isActive?: boolean } }) {
  const active = data.isActive;
  const icon = ACTION_ICONS[data.actionType ?? ''] ?? '▶';
  return (
    <div style={{
      position: 'relative',
      minWidth: 130, padding: '10px 16px',
      borderRadius: 6,
      background: active
        ? 'linear-gradient(135deg,#60a5fa,#2563eb)'
        : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
      border: active ? '2px solid #fff' : '2px solid #1e3a8a',
      boxShadow: active ? '0 0 18px rgba(96,165,250,0.9)' : '0 3px 10px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontWeight: 700, fontSize: 12, color: 'white',
      userSelect: 'none',
    }}>
      <Handle type="target" position={Position.Top} style={{
        top: -6, background: '#93c5fd', border: '2px solid #fff', width: 10, height: 10,
      }} />
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{data.label}</span>
      <Handle type="source" position={Position.Bottom} style={{
        bottom: -6, background: '#93c5fd', border: '2px solid #fff', width: 10, height: 10,
      }} />
    </div>
  );
}
