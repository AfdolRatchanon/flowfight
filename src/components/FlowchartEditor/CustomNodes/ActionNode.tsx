import { Handle, Position } from 'reactflow';
import { useFlowchartStore } from '../../../stores/flowchartStore';
import { BLOCK_MANA_COST } from '../../../engines/FlowchartEngine';

const ACTION_ICONS: Record<string, string> = {
  attack:       '⚔️',
  power_strike: '💥',
  dodge:        '🌀',
  cast_spell:   '✨',
  heal:         '💚',
  berserk:      '💢',
  use_potion:   '🧪',
  use_antidote: '💊',
  debug_block:  '🔧',
  // Knight
  shield:       '🛡️',
  counter:      '⚔️',
  war_cry:      '📣',
  // Mage
  fireball:     '🔥',
  frost_nova:   '❄️',
  arcane_surge: '✨',
  // Rogue
  backstab:     '🗡️',
  poison_strike:'🟣',
  shadow_step:  '👤',
  // Barbarian
  whirlwind:    '🌪️',
  bloodthirst:  '🩸',
  battle_cry:   '💥',
};

export default function ActionNode({
  id,
  data,
}: {
  id: string;
  data: { label: string; actionType?: string; isActive?: boolean; isVirus?: boolean; virusEffect?: string };
}) {
  const visitedNodeIds = useFlowchartStore((s) => s.visitedNodeIds);
  const wasVisited = visitedNodeIds.includes(id);

  // Virus node: early return with special styling
  if (data.isVirus) {
    return (
      <div style={{
        width: 180, padding: '8px 14px', borderRadius: 8,
        background: 'linear-gradient(135deg, #4a0010, #2d0008)',
        border: '2px solid #dc0050',
        boxShadow: '0 0 16px rgba(220,0,80,0.5)',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'default',
      }}>
        <Handle type="target" position={Position.Top} style={{ background: '#dc0050', width: 8, height: 8 }} />
        <span style={{ fontSize: 20, flexShrink: 0 }}>☠️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 7, color: 'rgba(220,0,80,0.9)', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>VIRUS</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#ff4070', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label}</div>
        </div>
        <Handle type="source" position={Position.Bottom} style={{ background: '#dc0050', width: 8, height: 8 }} />
      </div>
    );
  }

  const active = data.isActive;
  const icon = ACTION_ICONS[data.actionType ?? ''] ?? '▶';
  const cost = BLOCK_MANA_COST[data.actionType ?? ''] ?? 1;

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
        border: active ? '2px solid #fff' : wasVisited ? '2px solid rgba(74,222,128,0.7)' : '2px solid rgba(147,197,253,0.3)',
        boxShadow: active
          ? '0 0 18px rgba(96,165,250,0.9)'
          : wasVisited ? '0 0 10px rgba(74,222,128,0.4)' : '0 3px 10px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', gap: 10,
        userSelect: 'none',
      }}
    >
      <Handle
        type="target" position={Position.Top}
        style={{ top: -6, background: '#93c5fd', border: '2px solid #fff', width: 10, height: 10 }}
      />
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1 }}>
          PROCESS
        </div>
        <div style={{ fontSize: 13, color: 'white', fontWeight: 800 }}>{data.label}</div>
      </div>
      <div style={{
        fontSize: 9, fontWeight: 800,
        color: cost === 0 ? 'rgba(255,255,255,0.3)' : '#fbbf24',
        background: cost === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.15)',
        border: `1px solid ${cost === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(251,191,36,0.4)'}`,
        borderRadius: 4, padding: '1px 5px', flexShrink: 0,
      }}>
        {cost === 0 ? 'free' : `💎${cost}`}
      </div>
      <Handle
        type="source" position={Position.Bottom}
        style={{ bottom: -6, background: '#93c5fd', border: '2px solid #fff', width: 10, height: 10 }}
      />
    </div>
  );
}
