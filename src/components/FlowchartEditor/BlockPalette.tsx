import type { FlowNodeType } from '../../types/game.types';

interface BlockDef {
  type: FlowNodeType;
  label: string;
  icon: string;
  data?: Record<string, any>;
  description: string;
  color: string;
}

const BLOCKS: BlockDef[] = [
  { type: 'action',    label: 'Attack',       icon: '⚔️',  color: '#3b82f6', data: { actionType: 'attack' },                     description: 'โจมตีศัตรู' },
  { type: 'action',    label: 'Heal',          icon: '💚',  color: '#3b82f6', data: { actionType: 'heal' },                       description: 'ฟื้นฟู HP' },
  { type: 'action',    label: 'Dodge',         icon: '🌀',  color: '#3b82f6', data: { actionType: 'dodge' },                      description: 'หลบการโจมตี' },
  { type: 'action',    label: 'Cast Spell',    icon: '✨',  color: '#3b82f6', data: { actionType: 'cast_spell' },                 description: 'เวทมนตร์ (ดาเมจสูง)' },
  { type: 'condition', label: 'HP < 50?',      icon: '◇',   color: '#d97706', data: { conditionType: 'hp_less', threshold: 50 },  description: 'ตรวจ HP น้อยกว่า 50' },
  { type: 'condition', label: 'HP > 50?',      icon: '◇',   color: '#d97706', data: { conditionType: 'hp_greater', threshold: 50 },description: 'ตรวจ HP มากกว่า 50' },
  { type: 'condition', label: 'Enemy Alive?',  icon: '◇',   color: '#d97706', data: { conditionType: 'enemy_alive' },             description: 'ศัตรูยังมีชีวิตอยู่?' },
  { type: 'loop',      label: 'Repeat 3x',     icon: '◈',   color: '#c2410c', data: { loopType: 'repeat', loopCount: 3 },         description: 'วนซ้ำ 3 รอบ (LOOP=ต่อ, NEXT=ออก)' },
  { type: 'loop',      label: 'While Alive',   icon: '◈',   color: '#c2410c', data: { loopType: 'while_alive' },                  description: 'วนขณะศัตรูยังมีชีวิต' },
];

// Legend items: สัญลักษณ์ตามมาตรฐาน Flowchart
const LEGEND = [
  {
    label: 'Start / End',
    desc: 'จุดเริ่มต้น/สิ้นสุด',
    shape: (
      <div style={{ width: 44, height: 18, borderRadius: 9, background: 'linear-gradient(135deg,#22c55e,#15803d)', border: '1.5px solid #166534' }} />
    ),
  },
  {
    label: 'Process',
    desc: 'คำสั่ง/การกระทำ',
    shape: (
      <div style={{ width: 44, height: 18, borderRadius: 3, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: '1.5px solid #1e3a8a' }} />
    ),
  },
  {
    label: 'Decision',
    desc: 'เงื่อนไข YES/NO',
    shape: (
      <svg width={44} height={22}>
        <polygon points="22,1 43,11 22,21 1,11" fill="#d97706" stroke="#92400e" strokeWidth={1.5} />
      </svg>
    ),
  },
  {
    label: 'Loop',
    desc: 'วนซ้ำ LOOP/NEXT',
    shape: (
      <svg width={44} height={22}>
        <polygon points="22,1 43,11 22,21 1,11" fill="#c2410c" stroke="#7c2d12" strokeWidth={1.5} />
      </svg>
    ),
  },
];

interface Props {
  onAddBlock: (type: FlowNodeType, label: string, data?: Record<string, any>) => void;
}

export default function BlockPalette({ onAddBlock }: Props) {
  return (
    <div style={{
      width: 176, flexShrink: 0,
      background: '#0d0d1a',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
          Blocks
        </p>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, margin: '2px 0 0' }}>คลิกเพื่อเพิ่ม</p>
      </div>

      {/* Block buttons */}
      <div style={{ padding: '6px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {BLOCKS.map((block, i) => (
          <button
            key={i}
            onClick={() => onAddBlock(block.type, block.label, block.data)}
            title={block.description}
            style={{
              width: '100%', textAlign: 'left', borderRadius: 7, padding: '6px 8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = block.color + '60';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                backgroundColor: block.color,
              }} />
              <span style={{ fontSize: 12 }}>{block.icon}</span>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{block.label}</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '2px 0 0 14px' }}>{block.description}</p>
          </button>
        ))}
      </div>

      {/* Legend — สัญลักษณ์ */}
      <div style={{
        marginTop: 'auto',
        padding: '8px 10px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          สัญลักษณ์
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {LEGEND.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flexShrink: 0, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.shape}
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, margin: 0 }}>{item.label}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, margin: '0 0 2px' }}>Del = ลบ node</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, margin: '0 0 2px' }}>ลากปุ่มสีบน node → เชื่อมเส้น</p>
          <p style={{ color: '#4ade80', fontSize: 9, margin: '0 0 2px', opacity: 0.7 }}>● YES &nbsp; <span style={{ color: '#f87171' }}>● NO</span></p>
          <p style={{ color: '#fb923c', fontSize: 9, margin: 0, opacity: 0.7 }}>● LOOP &nbsp; <span style={{ color: '#60a5fa' }}>● NEXT</span></p>
        </div>
      </div>
    </div>
  );
}
