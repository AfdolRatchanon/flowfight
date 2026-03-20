import { Handle, Position } from 'reactflow';
import { useFlowchartStore } from '../../../stores/flowchartStore';
import { BLOCK_MANA_COST } from '../../../engines/FlowchartEngine';

const ACTION_TOOLTIPS: Record<string, string> = {
  attack:        'โจมตีศัตรู — ดาเมจปกติตาม ATK',
  power_strike:  'โจมตีหนัก — ดาเมจ 2× แต่ใช้ 💎 มากกว่า',
  dodge:         'หลบการโจมตี — ลดดาเมจที่รับ 65% ใน turn นี้',
  cast_spell:    'ร่ายคาถา — ดาเมจสูง ทะลุ Armor',
  heal:          'ฟื้นฟู HP — ใช้ได้สูงสุด 3 ครั้ง/การต่อสู้',
  berserk:       'คลั่ง — ATK +50%, รับดาเมจ -20% เป็นเวลา 3 turn',
  use_potion:    'ใช้ยา — ฟื้น HP จำนวนมาก (จาก inventory)',
  use_antidote:  'ใช้ยาถอนพิษ — ลบสถานะ Poison/Burn',
  debug_block:   'Debug — ลบ Virus ออกจาก Flowchart',
  shield:        '[Knight] ป้องกัน — ลดดาเมจที่รับ turn นี้',
  counter:       '[Knight] สวนกลับ — โจมตีเมื่อถูกโจมตี',
  war_cry:       '[Knight] ตะโกนรบ — buff ทีมและ debuff ศัตรู',
  fireball:      '[Mage] ลูกไฟ — ดาเมจสูง + Burn 3 turn',
  frost_nova:    '[Mage] น้ำแข็ง — Freeze ศัตรู 2 turn',
  arcane_surge:  '[Mage] Arcane — ดาเมจสูงมาก ทะลุทุก Defense',
  backstab:      '[Rogue] แทงหลัง — โจมตีสูงมากถ้าศัตรูไม่ทัน',
  poison_strike: '[Rogue] พิษ — โจมตี + Poison ศัตรู 5 turn',
  shadow_step:   '[Rogue] เงา — เพิ่มโอกาส dodge และ ATK turn นี้',
  whirlwind:     '[Barbarian] ลมหมุน — โจมตี AoE ทุกศัตรู',
  bloodthirst:   '[Barbarian] โหยหาเลือด — โจมตีและดูด HP คืน',
  battle_cry:    '[Barbarian] คำรามสงคราม — buff ATK สูงสุด 3 turn',
};

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
  const shieldGlowTypes = useFlowchartStore((s) => s.shieldGlowTypes);
  const activeHandleKey = useFlowchartStore((s) => s.activeHandleKey);
  const setActiveHandleKey = useFlowchartStore((s) => s.setActiveHandleKey);
  const wasVisited = visitedNodeIds.includes(id);
  const isShieldTarget = shieldGlowTypes.includes(data.actionType ?? '');

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
        <Handle type="target" position={Position.Top} className={`flow-handle${activeHandleKey === `${id}::target` ? ' flow-handle--active' : ''}`} onContextMenu={(e) => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::target`)} style={{ background: '#dc0050', width: 8, height: 8 }} />
        <span style={{ fontSize: 20, flexShrink: 0 }}>☠️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 7, color: 'rgba(220,0,80,0.9)', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>VIRUS</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#ff4070', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label}</div>
        </div>
        <Handle type="source" position={Position.Bottom} className={`flow-handle${activeHandleKey === `${id}::source` ? ' flow-handle--active' : ''}`} onContextMenu={(e) => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::source`)} style={{ background: '#dc0050', width: 8, height: 8 }} />
      </div>
    );
  }

  const active = data.isActive;
  const icon = ACTION_ICONS[data.actionType ?? ''] ?? '▶';
  const cost = BLOCK_MANA_COST[data.actionType ?? ''] ?? 1;
  const tooltip = ACTION_TOOLTIPS[data.actionType ?? ''];

  return (
    <div
      title={tooltip}
      style={{
        position: 'relative',
        width: 180,
        padding: '10px 16px',
        borderRadius: 8,
        background: active
          ? 'linear-gradient(135deg,#60a5fa,#2563eb)'
          : 'linear-gradient(135deg,#1e3a8a,#1d4ed8)',
        border: active ? '2px solid #fff' : isShieldTarget ? '2px solid #fb923c' : wasVisited ? '2px solid rgba(74,222,128,0.7)' : '2px solid rgba(147,197,253,0.3)',
        boxShadow: active
          ? '0 0 18px rgba(96,165,250,0.9)'
          : isShieldTarget ? '0 0 14px rgba(251,146,60,0.8), 0 0 4px rgba(251,146,60,0.4)'
          : wasVisited ? '0 0 10px rgba(74,222,128,0.4)' : '0 3px 10px rgba(0,0,0,0.5)',
        animation: isShieldTarget ? 'shieldPulse 1.4s ease-in-out infinite' : undefined,
        display: 'flex', alignItems: 'center', gap: 10,
        userSelect: 'none',
      }}
    >
      <Handle
        type="target" position={Position.Top}
        className={`flow-handle${activeHandleKey === `${id}::target` ? ' flow-handle--active' : ''}`}
        onContextMenu={(e) => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::target`)}
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
        className={`flow-handle${activeHandleKey === `${id}::source` ? ' flow-handle--active' : ''}`}
        onContextMenu={(e) => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::source`)}
        style={{ bottom: -6, background: '#93c5fd', border: '2px solid #fff', width: 10, height: 10 }}
      />
    </div>
  );
}
