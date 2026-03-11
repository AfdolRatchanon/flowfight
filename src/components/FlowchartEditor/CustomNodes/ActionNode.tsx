import { Handle, Position } from 'reactflow';

const ACTION_ICONS: Record<string, string> = {
  attack:       '⚔️',
  power_strike: '💥',
  dodge:        '🌀',
  cast_spell:   '✨',
  heal:         '💚',
  use_potion:   '🧪',
  use_antidote: '💊',
};

export default function ActionNode({
  data,
}: {
  data: { label: string; actionType?: string; isActive?: boolean };
}) {
  const active = data.isActive;
  const icon = ACTION_ICONS[data.actionType ?? ''] ?? '▶';

  return (
    <div
      style={{
        position: 'relative',
        width: 180,
        padding: '10px 16px',
        borderRadius: 8,
        background: active
          ? 'linear-gradient(135deg,#60a5fa,#2563eb)'
          : 'linear-gradient(135deg,#1e3a8a,#1d4ed8)',
        border: active ? '2px solid #fff' : '2px solid rgba(147,197,253,0.3)',
        boxShadow: active
          ? '0 0 18px rgba(96,165,250,0.9)'
          : '0 3px 10px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', gap: 10,
        userSelect: 'none',
      }}
    >
      <Handle
        type="target" position={Position.Top}
        style={{ top: -6, background: '#93c5fd', border: '2px solid #fff', width: 10, height: 10 }}
      />
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1 }}>
          PROCESS
        </div>
        <div style={{ fontSize: 13, color: 'white', fontWeight: 800 }}>{data.label}</div>
      </div>
      <Handle
        type="source" position={Position.Bottom}
        style={{ bottom: -6, background: '#93c5fd', border: '2px solid #fff', width: 10, height: 10 }}
      />
    </div>
  );
}
