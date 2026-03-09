import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacterStore, CLASS_BASE_STATS } from '../../stores/characterStore';
import { useGameStore } from '../../stores/gameStore';
import type { CharacterClass, EquipmentItem } from '../../types/game.types';
import { COLOR_PALETTE, WEAPONS, ARMORS, HELMETS, ACCESSORIES } from '../../utils/constants';
import { levelProgressPct, xpToNextLevel, MAX_LEVEL } from '../../utils/levelSystem';
import { saveCharacterProgress } from '../../services/authService';

// ===== Class definitions =====
const CLASS_INFO: Record<CharacterClass, {
  icon: string; label: string; tag: string; tagColor: string;
  lore: string; strength: string; weakness: string; playstyle: string;
}> = {
  knight: {
    icon: '🛡️', label: 'Knight', tag: 'TANK', tagColor: '#60a5fa',
    lore: 'แนวหน้าผู้ไม่ย่อท้อ HP และ DEF สูงสุด สามารถสู้ได้นาน',
    strength: '❤️ HP สูง + 🛡️ DEF สูง', weakness: '⚡ SPD ต่ำ',
    playstyle: 'ฮีลเมื่อ HP ต่ำ โจมตีซ้ำๆ ใช้ความทนทานเอาชนะ',
  },
  mage: {
    icon: '🔮', label: 'Mage', tag: 'GLASS CANNON', tagColor: '#c084fc',
    lore: 'พลังเวทมนตร์มหาศาล ดาเมจสูงสุด แต่บอบบาง',
    strength: '⚔️ ATK สูงสุด + ⚡ SPD สูง', weakness: '🛡️ DEF ต่ำมาก',
    playstyle: 'ใช้ Cast Spell สร้างดาเมจมหาศาล หลีกเลี่ยงการโดนตี',
  },
  rogue: {
    icon: '🗡️', label: 'Rogue', tag: 'SPEEDSTER', tagColor: '#4ade80',
    lore: 'เร็วและแม่นยำ โจมตีก่อนศัตรูจะตั้งตัวได้',
    strength: '⚡ SPD สูงสุด + ⚔️ ATK ดี', weakness: '🛡️ DEF ปานกลาง',
    playstyle: 'Dodge หลบโจมตี ใช้ความเร็วโจมตีซ้ำๆ',
  },
  barbarian: {
    icon: '⚔️', label: 'Barbarian', tag: 'BERSERKER', tagColor: '#f87171',
    lore: 'พละกำลังดิบล้วน HP และ ATK สูง เหมาะกับการสู้แบบตรงๆ',
    strength: '❤️ HP สูงสุด + ⚔️ ATK สูง', weakness: '⚡ SPD ต่ำ',
    playstyle: 'โจมตีไม่หยุด ใช้ HP สูงทนดาเมจ',
  },
};

// Equipment recommended per class
const CLASS_RECOMMENDED: Record<CharacterClass, string[]> = {
  knight:    ['iron_sword', 'plate_armor', 'iron_helmet', 'ring_health'],
  mage:      ['magic_staff', 'leather_armor', 'crown_wisdom', 'amulet_speed'],
  rogue:     ['axe_fury', 'leather_armor', 'boots_swift', 'amulet_speed'],
  barbarian: ['axe_fury', 'leather_armor', 'iron_helmet', 'ring_health'],
};

// Equipment slot icons & labels
const SLOT_META = {
  weapon:    { icon: '⚔️', label: 'Weapon' },
  armor:     { icon: '🛡️', label: 'Armor' },
  head:      { icon: '⛑️', label: 'Helmet' },
  accessory: { icon: '💍', label: 'Accessory' },
};

type Tab = 'class' | 'equipment' | 'colors' | 'stats';

const CARD: React.CSSProperties = {
  background: 'rgba(26,26,62,0.8)',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: 16,
  padding: 16,
};

export default function CharacterCustomizer() {
  const [tab, setTab] = useState<Tab>('class');
  const navigate = useNavigate();
  const store = useCharacterStore();
  const { character, player, setCharacter } = useGameStore();
  const stats = store.getCalculatedStats();

  const classInfo = CLASS_INFO[store.selectedClass];
  const xpPct  = character ? levelProgressPct(character.level, character.experience) : 0;
  const xpLeft = character ? xpToNextLevel(character.level, character.experience) : 0;

  const handleSave = () => {
    // Build Character object, preserving existing level/XP if already leveled
    const now = Date.now();
    const newChar = {
      id: character?.id ?? `char_${player?.id ?? now}`,
      playerId: player?.id ?? 'local',
      name: store.characterName || 'Hero',
      class: store.selectedClass,
      level: character?.level ?? 1,
      experience: character?.experience ?? 0,
      stats: { ...stats, currentHP: stats.maxHP },
      appearance: {
        skinId: `${store.selectedClass}_blue`,
        colors: store.colors,
      },
      equipment: store.equipment,
      gameMode: 'normal' as const,
      isAlive: true,
      currentLevel: 1,
      createdAt: character?.createdAt ?? now,
      lastModified: now,
    };
    setCharacter(newChar);
    if (player) saveCharacterProgress(player.id, newChar).catch(() => {});
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a2e 100%)', padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: 'white', fontWeight: 800, fontSize: 24, margin: 0 }}>Character</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>เลือก class · จัดอุปกรณ์ · ปรับแต่ง</p>
          </div>
          {/* Current level badge (if exists) */}
          {character && (
            <div style={{ textAlign: 'center', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '8px 14px' }}>
              <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, fontSize: 22 }}>
                Lv.{character.level}
              </div>
              <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', margin: '4px auto 2px' }}>
                <div style={{ width: xpPct + '%', height: '100%', background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 2 }} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>
                {character.level >= MAX_LEVEL ? 'MAX' : `${xpLeft} XP`}
              </div>
            </div>
          )}
        </div>

        {/* Preview + Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>

          {/* Character preview */}
          <div style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 150, padding: 20 }}>
            {/* Class icon with glow */}
            <div style={{
              fontSize: 64, marginBottom: 8, lineHeight: 1,
              filter: `drop-shadow(0 0 16px ${classInfo.tagColor}88)`,
            }}>
              {classInfo.icon}
            </div>
            {/* Tag badge */}
            <div style={{
              background: classInfo.tagColor + '22',
              border: `1px solid ${classInfo.tagColor}55`,
              color: classInfo.tagColor,
              fontSize: 9, fontWeight: 900, padding: '3px 10px',
              borderRadius: 20, letterSpacing: 1, marginBottom: 8,
            }}>{classInfo.tag}</div>
            {/* Name */}
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: '0 0 2px', textAlign: 'center' }}>
              {store.characterName || 'Hero'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0, textTransform: 'capitalize' }}>
              {store.selectedClass}
            </p>
            {/* Color swatch */}
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {(['primary', 'secondary', 'accent'] as const).map(k => (
                <div key={k} style={{ width: 14, height: 14, borderRadius: '50%', background: store.colors[k], border: '2px solid rgba(255,255,255,0.2)' }} />
              ))}
            </div>
          </div>

          {/* Stats + name input */}
          <div style={{ ...CARD, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, margin: 0 }}>STATS</p>
              {character && (
                <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>+Lv bonus applied</span>
              )}
            </div>
            <StatBar icon="❤️" label="HP"  value={stats.maxHP}   max={200} color="#4ade80" />
            <StatBar icon="⚔️" label="ATK" value={stats.attack}  max={50}  color="#f87171" />
            <StatBar icon="🛡️" label="DEF" value={stats.defense} max={30}  color="#60a5fa" />
            <StatBar icon="⚡" label="SPD" value={stats.speed}   max={20}  color="#fbbf24" />

            <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '0 0 3px' }}>💡 {classInfo.playstyle}</p>
            </div>

            <input
              type="text"
              value={store.characterName}
              onChange={(e) => store.setCharacterName(e.target.value)}
              maxLength={20}
              placeholder="ชื่อตัวละคร"
              style={{
                width: '100%', marginTop: 10, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)', color: 'white',
                borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 14, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 }}>
          {([
            { id: 'class',     label: '🎭 Class' },
            { id: 'equipment', label: '⚔️ Equip' },
            { id: 'colors',    label: '🎨 Colors' },
            { id: 'stats',     label: '📊 Stats' },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '9px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 12, transition: 'all 0.2s',
              background: tab === t.id ? 'linear-gradient(135deg, #e94560, #7c3aed)' : 'transparent',
              color: tab === t.id ? 'white' : 'rgba(255,255,255,0.4)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={CARD}>
          {tab === 'class'     && <ClassTab />}
          {tab === 'equipment' && <EquipmentTab selectedClass={store.selectedClass} />}
          {tab === 'colors'    && <ColorsTab />}
          {tab === 'stats'     && <StatsTab />}
        </div>

        {/* Save & Play */}
        <button onClick={handleSave} style={{
          width: '100%', marginTop: 16, padding: '14px',
          background: 'linear-gradient(135deg, #e94560, #7c3aed)',
          border: 'none', color: 'white', fontWeight: 700, fontSize: 15,
          borderRadius: 12, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(233,69,96,0.3)',
        }}>
          {character ? '💾 บันทึกและกลับ →' : '✨ สร้างตัวละครและเริ่มเกม →'}
        </button>
      </div>
    </div>
  );
}

// ===== Sub-components =====

function StatBar({ icon, label, value, max, color }: { icon: string; label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, width: 28 }}>{label}</span>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ color, fontWeight: 700, fontSize: 12, width: 28, textAlign: 'right' }}>{value}</span>
      </div>
    </div>
  );
}

function ClassTab() {
  const store = useCharacterStore();
  const ORDER: CharacterClass[] = ['knight', 'mage', 'rogue', 'barbarian'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {ORDER.map((cls) => {
        const info = CLASS_INFO[cls];
        const base = CLASS_BASE_STATS[cls];
        const selected = store.selectedClass === cls;
        return (
          <button key={cls} onClick={() => store.setClass(cls)} style={{
            padding: 14, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
            background: selected ? `${info.tagColor}18` : 'rgba(255,255,255,0.03)',
            border: selected ? `2px solid ${info.tagColor}` : '2px solid rgba(255,255,255,0.07)',
            transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {/* Icon + tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 28 }}>{info.icon}</span>
              <div>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: 0 }}>{info.label}</p>
                <span style={{
                  background: info.tagColor + '30', color: info.tagColor,
                  fontSize: 8, fontWeight: 900, padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5,
                }}>{info.tag}</span>
              </div>
            </div>

            {/* Mini stat bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <MiniStatBar label="HP"  value={base.maxHP}  max={150} color="#4ade80" />
              <MiniStatBar label="ATK" value={base.attack} max={20}  color="#f87171" />
              <MiniStatBar label="DEF" value={base.defense}max={12}  color="#60a5fa" />
              <MiniStatBar label="SPD" value={base.speed}  max={12}  color="#fbbf24" />
            </div>

            {/* Lore */}
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '4px 0 0', lineHeight: 1.4 }}>
              {info.lore}
            </p>

            {/* Strength / Weakness */}
            <div style={{ marginTop: 2 }}>
              <p style={{ color: '#4ade80', fontSize: 9, margin: '0 0 1px' }}>✓ {info.strength}</p>
              <p style={{ color: '#f87171', fontSize: 9, margin: 0 }}>✗ {info.weakness}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MiniStatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, width: 22 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: Math.min((value / max) * 100, 100) + '%', height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ color, fontSize: 8, fontWeight: 700, width: 16, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function EquipmentTab({ selectedClass }: { selectedClass: CharacterClass }) {
  const store = useCharacterStore();
  const recommended = CLASS_RECOMMENDED[selectedClass];

  const ALL_BY_SLOT = {
    weapon:    WEAPONS,
    armor:     ARMORS,
    head:      HELMETS,
    accessory: ACCESSORIES,
  } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 340, overflowY: 'auto' }}>
      {(Object.entries(ALL_BY_SLOT) as [keyof typeof ALL_BY_SLOT, EquipmentItem[]][]).map(([slot, items]) => {
        const meta = SLOT_META[slot];
        // Sort: recommended first
        const sorted = [...items].sort((a, b) => {
          const aRec = recommended.includes(a.id) ? 0 : 1;
          const bRec = recommended.includes(b.id) ? 0 : 1;
          return aRec - bRec;
        });

        return (
          <div key={slot}>
            {/* Slot header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{meta.icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 12 }}>{meta.label}</span>
              {store.equipment[slot] && (
                <span style={{ marginLeft: 'auto', color: '#e94560', fontSize: 10, cursor: 'pointer' }}
                  onClick={() => store.unequipItem(slot)}>✕ ถอด</span>
              )}
            </div>

            {/* Items in slot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {sorted.map((item) => {
                const isEquipped = store.equipment[slot]?.id === item.id;
                const isRec = recommended.includes(item.id);
                return (
                  <div key={item.id}
                    onClick={() => isEquipped ? store.unequipItem(slot) : store.equipItem(item as EquipmentItem)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      background: isEquipped ? 'rgba(233,69,96,0.12)' : isRec ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
                      border: isEquipped ? '1px solid rgba(233,69,96,0.5)' : isRec ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    }}>

                    {/* Rec badge */}
                    <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                      {isEquipped
                        ? <span style={{ color: '#e94560', fontSize: 14 }}>✓</span>
                        : isRec
                        ? <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 900 }}>★</span>
                        : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>○</span>
                      }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                        {isRec && !isEquipped && (
                          <span style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>REC</span>
                        )}
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0, textTransform: 'capitalize' }}>
                        {item.rarity}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, fontSize: 11 }}>
                      {item.stats.attackBonus  > 0 && <span style={{ color: '#f87171' }}>+{item.stats.attackBonus}⚔️</span>}
                      {item.stats.defenseBonus > 0 && <span style={{ color: '#60a5fa' }}>+{item.stats.defenseBonus}🛡️</span>}
                      {item.stats.hpBonus      > 0 && <span style={{ color: '#4ade80' }}>+{item.stats.hpBonus}❤️</span>}
                      {item.stats.speedBonus   > 0 && <span style={{ color: '#fbbf24' }}>+{item.stats.speedBonus}⚡</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ColorsTab() {
  const store = useCharacterStore();
  const COLOR_META = {
    primary:   { label: 'Primary Color', desc: 'สีหลักของตัวละคร' },
    secondary: { label: 'Secondary Color', desc: 'สีรอง' },
    accent:    { label: 'Accent Color', desc: 'สีไฮไลท์' },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {(['primary', 'secondary', 'accent'] as const).map((key) => (
        <div key={key}>
          <div style={{ marginBottom: 10 }}>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>{COLOR_META[key].label}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>{COLOR_META[key].desc}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COLOR_PALETTE.map((color) => (
              <button key={color} onClick={() => store.setColors({ [key]: color })} title={color}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  border: store.colors[key] === color ? '3px solid white' : '3px solid transparent',
                  backgroundColor: color, cursor: 'pointer', transition: 'transform 0.15s',
                  boxShadow: store.colors[key] === color ? `0 0 12px ${color}` : 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.18)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsTab() {
  const store = useCharacterStore();
  const { character } = useGameStore();
  const stats = store.getCalculatedStats();
  const base = CLASS_BASE_STATS[store.selectedClass];

  const rows = [
    { icon: '❤️', label: 'Max HP',  base: base.maxHP,   final: stats.maxHP,   max: 200, color: '#4ade80' },
    { icon: '⚔️', label: 'Attack',  base: base.attack,  final: stats.attack,  max: 50,  color: '#f87171' },
    { icon: '🛡️', label: 'Defense', base: base.defense, final: stats.defense, max: 30,  color: '#60a5fa' },
    { icon: '⚡', label: 'Speed',   base: base.speed,   final: stats.speed,   max: 20,  color: '#fbbf24' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Base → Equipment bonus → Final</span>
        {character && (
          <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>Lv.{character.level}</span>
        )}
      </div>
      {rows.map((r) => {
        const eqBonus = r.final - r.base;
        return (
          <div key={r.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{r.icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{r.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{r.base}</span>
                {eqBonus > 0 && <span style={{ color: r.color, fontSize: 11 }}>+{eqBonus}</span>}
                <span style={{ color: r.color, fontWeight: 800, fontSize: 14 }}>{r.final}</span>
              </div>
            </div>
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              {/* Base bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.min((r.base / r.max) * 100, 100) + '%', background: r.color + '55', borderRadius: 4 }} />
              {/* Full bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.min((r.final / r.max) * 100, 100) + '%', background: r.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        );
      })}

      {/* Equipment summary */}
      <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 6px', letterSpacing: 1 }}>EQUIPPED</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.entries(SLOT_META) as [keyof typeof SLOT_META, typeof SLOT_META[keyof typeof SLOT_META]][]).map(([slot, meta]) => {
            const eq = store.equipment[slot];
            return (
              <div key={slot} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 11,
                background: eq ? 'rgba(233,69,96,0.12)' : 'rgba(255,255,255,0.04)',
                border: eq ? '1px solid rgba(233,69,96,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: eq ? 'white' : 'rgba(255,255,255,0.25)',
              }}>
                {meta.icon} {eq ? eq.name : `No ${meta.label}`}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
