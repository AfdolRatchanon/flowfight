import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacterStore, CLASS_BASE_STATS } from '../../stores/characterStore';
import { useGameStore } from '../../stores/gameStore';
import { useShopStore } from '../../stores/shopStore';
import type { CharacterClass, EquipmentItem } from '../../types/game.types';
import { WEAPONS, ARMORS, HELMETS, ACCESSORIES } from '../../utils/constants';
import { levelProgressPct, xpToNextLevel, MAX_LEVEL, CLASS_STAT_GAIN } from '../../utils/levelSystem';
import { saveCharacterProgress, saveShopData, saveEquippedItems } from '../../services/authService';
import { useTheme } from '../../contexts/ThemeContext';
import { soundManager } from '../../services/soundManager';

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

// Equipment slot icons & labels
const SLOT_META = {
  weapon:    { icon: '⚔️', label: 'Weapon' },
  armor:     { icon: '🛡️', label: 'Armor' },
  head:      { icon: '⛑️', label: 'Helmet' },
  accessory: { icon: '💍', label: 'Accessory' },
};

type Tab = 'class' | 'equipment' | 'shop' | 'stats';

export default function CharacterCustomizer() {
  const [tab, setTab] = useState<Tab>('class');
  const navigate = useNavigate();
  const store = useCharacterStore();
  const { character, player, setCharacter, setPlayer } = useGameStore();
  const { colors } = useTheme();
  const stats = store.getCalculatedStats();
  const CARD: React.CSSProperties = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 16,
  };

  const classInfo = CLASS_INFO[store.selectedClass];

  // โหลด level/XP ของ class ที่กำลังเลือกอยู่ (แยกต่อ class)
  const classProgress = player?.characterProgress?.[store.selectedClass];
  // ถ้า class ที่เลือกตรงกับ character ปัจจุบัน ใช้ character (ข้อมูลล่าสุด) แทน classProgress ที่อาจ stale
  const isCurrentClass = character?.class === store.selectedClass;
  const displayLevel = (isCurrentClass ? character?.level : classProgress?.level) ?? 1;
  const displayXP    = (isCurrentClass ? character?.experience : classProgress?.experience) ?? 0;
  const xpPct  = levelProgressPct(displayLevel, displayXP);
  const xpLeft = xpToNextLevel(displayLevel, displayXP);

  const handleSave = () => {
    // Build Character object — level/XP มาจาก progress ของ class นั้นๆ
    const now = Date.now();
    const cls = store.selectedClass;
    const cp  = player?.characterProgress?.[cls];
    const isCurrent = character?.class === cls;
    const savedLevel = (isCurrent ? character?.level : cp?.level) ?? 1;
    const savedXP    = (isCurrent ? character?.experience : cp?.experience) ?? 0;

    // Apply level bonus on top of base+equipment stats
    const gain = CLASS_STAT_GAIN[cls];
    const levelsAboveBase = savedLevel - 1;
    const finalStats = {
      maxHP:     stats.maxHP     + levelsAboveBase * gain.maxHP,
      currentHP: stats.maxHP     + levelsAboveBase * gain.maxHP,
      attack:    stats.attack    + levelsAboveBase * gain.attack,
      defense:   stats.defense   + levelsAboveBase * gain.defense,
      speed:     stats.speed     + levelsAboveBase * gain.speed,
    };

    const newChar = {
      id: `char_${player?.id ?? now}_${cls}`,
      playerId: player?.id ?? 'local',
      name: store.characterName || 'Hero',
      class: cls,
      level: savedLevel,
      experience: savedXP,
      stats: finalStats,
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
    // sync player.characterProgress ใน store ทันที (ป้องกัน stale เมื่อสลับ class)
    if (player) {
      setPlayer({
        ...player,
        characterProgress: {
          ...player.characterProgress,
          [cls]: {
            level: newChar.level, experience: newChar.experience,
            maxHP: newChar.stats.maxHP, attack: newChar.stats.attack,
            defense: newChar.stats.defense, speed: newChar.stats.speed,
            class: cls, name: newChar.name,
          },
        },
        lastPlayedClass: cls,
      });
      saveCharacterProgress(player.id, newChar).catch(() => {});
    }
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgGrad, padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button onClick={() => navigate('/')} style={{ background: colors.bgSurface, border: 'none', color: colors.text, width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: colors.text, fontWeight: 800, fontSize: 24, margin: 0 }}>Character</h1>
            <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>เลือก class · จัดอุปกรณ์</p>
          </div>
          {/* Current level badge (if exists) */}
          <div style={{ textAlign: 'center', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '8px 14px' }}>
            <div style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, fontSize: 22 }}>
              Lv.{displayLevel}
            </div>
            <div style={{ width: 60, height: 4, background: colors.bgSurface, borderRadius: 2, overflow: 'hidden', margin: '4px auto 2px' }}>
              <div style={{ width: xpPct + '%', height: '100%', background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 2 }} />
            </div>
            <div style={{ color: colors.textMuted, fontSize: 9 }}>
              {displayLevel >= MAX_LEVEL ? 'MAX' : `${xpLeft} XP`}
            </div>
          </div>
        </div>

        {/* Preview + Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>

          {/* Character preview */}
          <div style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 150, padding: 20 }}>
            {/* Class image with glow */}
            <div style={{
              width: 96, height: 96, marginBottom: 8,
              filter: `drop-shadow(0 0 16px ${classInfo.tagColor}88)`,
            }}>
              <img src={`/characters/${store.selectedClass}.png`} alt={store.selectedClass} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
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
            <p style={{ color: colors.text, fontWeight: 700, fontSize: 14, margin: '0 0 2px', textAlign: 'center' }}>
              {store.characterName || 'Hero'}
            </p>
            <p style={{ color: colors.textMuted, fontSize: 12, margin: 0, textTransform: 'capitalize' }}>
              {store.selectedClass}
            </p>
          </div>

          {/* Stats + name input */}
          <div style={{ ...CARD, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 2, margin: 0 }}>STATS</p>
              {classProgress && (
                <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>+Lv bonus applied</span>
              )}
            </div>
            <StatBar icon="❤️" label="HP"  value={stats.maxHP   + (displayLevel - 1) * CLASS_STAT_GAIN[store.selectedClass].maxHP}   max={250} color="#4ade80" />
            <StatBar icon="⚔️" label="ATK" value={stats.attack  + (displayLevel - 1) * CLASS_STAT_GAIN[store.selectedClass].attack}  max={55}  color="#f87171" />
            <StatBar icon="🛡️" label="DEF" value={stats.defense + (displayLevel - 1) * CLASS_STAT_GAIN[store.selectedClass].defense} max={35}  color="#60a5fa" />
            <StatBar icon="⚡" label="SPD" value={stats.speed   + (displayLevel - 1) * CLASS_STAT_GAIN[store.selectedClass].speed}   max={35}  color="#fbbf24" />

            <div style={{ marginTop: 12, padding: '8px 10px', background: colors.bgSurface, borderRadius: 8, border: `1px solid ${colors.borderSubtle}` }}>
              <p style={{ color: colors.textMuted, fontSize: 10, margin: '0 0 3px' }}>💡 {classInfo.playstyle}</p>
            </div>

            <input
              type="text"
              value={store.characterName}
              onChange={(e) => store.setCharacterName(e.target.value)}
              maxLength={20}
              placeholder="ชื่อตัวละคร"
              style={{
                width: '100%', marginTop: 10, background: colors.bgSurface,
                border: `1px solid ${colors.border}`, color: colors.text,
                borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 14, background: colors.bgSurface, borderRadius: 10, padding: 4 }}>
          {([
            { id: 'class',     label: '🎭 Class' },
            { id: 'equipment', label: '⚔️ Equip' },
            { id: 'shop',      label: '🧪 Items' },
            { id: 'stats',     label: '📊 Stats' },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '9px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 12, transition: 'all 0.2s',
              background: tab === t.id ? 'linear-gradient(135deg, #e94560, #7c3aed)' : 'transparent',
              color: tab === t.id ? 'white' : colors.textSub,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={CARD}>
          {tab === 'class'     && <ClassTab />}
          {tab === 'equipment' && <EquipmentTab selectedClass={store.selectedClass} displayLevel={displayLevel} />}
          {tab === 'shop'      && <EquipmentShopTab selectedClass={store.selectedClass} displayLevel={displayLevel} />}
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
  const { colors } = useTheme();
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ color: colors.textSub, fontSize: 12, width: 28 }}>{label}</span>
        <div style={{ flex: 1, height: 6, background: colors.bgSurface, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ color, fontWeight: 700, fontSize: 12, width: 28, textAlign: 'right' }}>{value}</span>
      </div>
    </div>
  );
}

function ClassTab() {
  const store = useCharacterStore();
  const { colors } = useTheme();
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
            background: selected ? `${info.tagColor}18` : colors.bgSurface,
            border: selected ? `2px solid ${info.tagColor}` : `2px solid ${colors.borderSubtle}`,
            transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {/* Icon + tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 28 }}>{info.icon}</span>
              <div>
                <p style={{ color: colors.text, fontWeight: 800, fontSize: 14, margin: 0 }}>{info.label}</p>
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
            <p style={{ color: colors.textMuted, fontSize: 10, margin: '4px 0 0', lineHeight: 1.4 }}>
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
  const { colors } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: colors.textMuted, fontSize: 8, width: 22 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: colors.bgSurface, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: Math.min((value / max) * 100, 100) + '%', height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ color, fontSize: 8, fontWeight: 700, width: 16, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

const RARITY_COLOR: Record<string, string> = {
  common: '#94a3b8', uncommon: '#4ade80', rare: '#60a5fa', epic: '#a78bfa', legendary: '#fbbf24',
};

function EquipmentTab({ selectedClass, displayLevel }: { selectedClass: CharacterClass; displayLevel: number }) {
  const store = useCharacterStore();
  const shopStore = useShopStore();
  const { player } = useGameStore();
  const { colors } = useTheme();
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null);

  function showFlash(msg: string, ok: boolean) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 1800);
  }

  function buyItem(item: EquipmentItem) {
    if (item.requiredLevel > displayLevel) { showFlash(`ต้องเป็น Lv.${item.requiredLevel} ก่อน`, false); return; }
    const ok = shopStore.buyEquipment(item.id, item.cost);
    if (ok) {
      showFlash(`ซื้อ ${item.name} สำเร็จ!`, true);
      if (player) {
        const { gold, purchasedEquipment, lastRestockTime, potions, antidotes, attackBonus } = useShopStore.getState();
        saveShopData(player.id, gold, purchasedEquipment, lastRestockTime, potions, antidotes, attackBonus).catch(() => {});
      }
    } else {
      showFlash(`เงินไม่พอ! ต้องการ ${item.cost}g (มี ${shopStore.gold}g)`, false);
    }
  }

  const ALL_BY_SLOT = {
    weapon: WEAPONS, armor: ARMORS, head: HELMETS, accessory: ACCESSORIES,
  } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 430, overflowY: 'auto' }}>
      {/* Gold sticky bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '7px 12px', background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10,
        position: 'sticky', top: 0, zIndex: 1,
      }}>
        <span style={{ color: colors.textMuted, fontSize: 10 }}>ซื้อและใส่อุปกรณ์ได้ในที่เดียว</span>
        <span style={{ color: '#fbbf24', fontSize: 15, fontWeight: 900 }}>💰 {shopStore.gold}g</span>
      </div>

      {flash && (
        <div style={{
          background: flash.ok ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${flash.ok ? '#16a34a' : '#ef4444'}88`,
          borderRadius: 8, padding: '7px 14px',
          color: flash.ok ? '#4ade80' : '#fca5a5', fontSize: 12, fontWeight: 600, textAlign: 'center',
        }}>{flash.ok ? '✅ ' : '❌ '}{flash.msg}</div>
      )}

      {(Object.entries(ALL_BY_SLOT) as [keyof typeof ALL_BY_SLOT, EquipmentItem[]][]).map(([slot, items]) => {
        const meta = SLOT_META[slot];
        const classItems = (items as EquipmentItem[]).filter(
          (i) => i.allowedClasses.length === 0 || (i.allowedClasses as string[]).includes(selectedClass)
        );

        // All items for this slot — owned (purchased) ones first, then by level
        const sorted = [...classItems].sort((a, b) => {
          const aOwned = shopStore.hasEquipment(a.id) ? 0 : 1;
          const bOwned = shopStore.hasEquipment(b.id) ? 0 : 1;
          if (aOwned !== bOwned) return aOwned - bOwned;
          return a.requiredLevel - b.requiredLevel;
        });

        // Best equippable = highest-level owned item that is unlocked
        const ownedUnlocked = classItems.filter((i) => shopStore.hasEquipment(i.id) && i.requiredLevel <= displayLevel);
        const bestId = ownedUnlocked.length > 0
          ? ownedUnlocked.reduce((b, i) => i.requiredLevel > b.requiredLevel ? i : b).id
          : null;

        return (
          <div key={slot}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{meta.icon}</span>
              <span style={{ color: colors.textSub, fontWeight: 700, fontSize: 12 }}>{meta.label}</span>
              {store.equipment[slot] && (
                <span style={{ marginLeft: 'auto', color: '#e94560', fontSize: 10, cursor: 'pointer' }}
                  onClick={() => {
                    store.unequipItem(slot);
                    if (player) {
                      const eq = useCharacterStore.getState().equipment;
                      saveEquippedItems(player.id, store.selectedClass, {
                        weapon:    eq.weapon?.id    ?? null,
                        armor:     eq.armor?.id     ?? null,
                        head:      eq.head?.id      ?? null,
                        accessory: eq.accessory?.id ?? null,
                        [slot]: null,
                      }).catch(() => {});
                    }
                  }}>✕ ถอด</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {sorted.map((item) => {
                const isPurchased = shopStore.hasEquipment(item.id);
                const isEquipped  = store.equipment[slot]?.id === item.id;
                const isLevelLock = item.requiredLevel > displayLevel;
                const isRec       = item.id === bestId && !isEquipped;
                const canAfford   = shopStore.gold >= item.cost;

                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 8,
                    opacity: isLevelLock ? 0.4 : 1,
                    background: isEquipped
                      ? 'rgba(233,69,96,0.12)'
                      : isRec ? 'rgba(251,191,36,0.05)'
                      : colors.bgSurface,
                    border: isEquipped
                      ? '1px solid rgba(233,69,96,0.4)'
                      : isRec ? '1px solid rgba(251,191,36,0.2)'
                      : `1px solid ${colors.borderSubtle}`,
                  }}>
                    {/* Status icon */}
                    <div style={{ width: 24, textAlign: 'center', flexShrink: 0 }}>
                      {isLevelLock  ? <span style={{ fontSize: 12 }}>🔒</span>
                        : isEquipped ? <span style={{ color: '#e94560', fontSize: 14 }}>✓</span>
                        : isRec      ? <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 900 }}>★</span>
                        : isPurchased ? <span style={{ color: colors.textMuted, fontSize: 11 }}>○</span>
                        :               <span style={{ color: colors.textMuted, fontSize: 11 }}>·</span>}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ color: colors.text, fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                        <span style={{ color: RARITY_COLOR[item.rarity] ?? '#94a3b8', fontSize: 8, fontWeight: 800, textTransform: 'uppercase' }}>{item.rarity}</span>
                        {isLevelLock && <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>Lv.{item.requiredLevel}</span>}
                        {!isLevelLock && isRec && <span style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>REC</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                        {item.stats.attackBonus  > 0 && <span style={{ color: '#f87171', fontSize: 10 }}>+{item.stats.attackBonus}⚔️</span>}
                        {item.stats.defenseBonus > 0 && <span style={{ color: '#60a5fa', fontSize: 10 }}>+{item.stats.defenseBonus}🛡️</span>}
                        {item.stats.hpBonus      > 0 && <span style={{ color: '#4ade80', fontSize: 10 }}>+{item.stats.hpBonus}❤️</span>}
                        {item.stats.speedBonus   > 0 && <span style={{ color: '#fbbf24', fontSize: 10 }}>+{item.stats.speedBonus}⚡</span>}
                      </div>
                    </div>

                    {/* Action button */}
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      {!isPurchased && !isLevelLock && (
                        <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 800 }}>
                          {item.cost}g
                        </span>
                      )}
                      {!isPurchased ? (
                        <button
                          onClick={() => buyItem(item)}
                          disabled={isLevelLock || !canAfford}
                          style={{
                            padding: '6px 12px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 700,
                            whiteSpace: 'nowrap', cursor: isLevelLock ? 'default' : 'pointer',
                            background: isLevelLock ? 'rgba(255,255,255,0.04)'
                              : canAfford ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                              : 'rgba(239,68,68,0.12)',
                            color: isLevelLock ? 'rgba(255,255,255,0.2)'
                              : canAfford ? 'white'
                              : '#fca5a5',
                          }}
                        >
                          {isLevelLock ? `🔒 Lv.${item.requiredLevel}` : canAfford ? 'ซื้อ' : 'ไม่พอ'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (isLevelLock) return;
                            if (isEquipped) {
                              store.unequipItem(slot);
                              if (player) {
                                const eq = useCharacterStore.getState().equipment;
                                saveEquippedItems(player.id, store.selectedClass, {
                                  weapon:    eq.weapon?.id    ?? null,
                                  armor:     eq.armor?.id     ?? null,
                                  head:      eq.head?.id      ?? null,
                                  accessory: eq.accessory?.id ?? null,
                                  [slot]: null,
                                }).catch(() => {});
                              }
                            } else {
                              soundManager.playSFX('equip');
                              store.equipItem(item as EquipmentItem);
                              if (player) {
                                const eq = useCharacterStore.getState().equipment;
                                saveEquippedItems(player.id, store.selectedClass, {
                                  weapon:    eq.weapon?.id    ?? null,
                                  armor:     eq.armor?.id     ?? null,
                                  head:      eq.head?.id      ?? null,
                                  accessory: eq.accessory?.id ?? null,
                                  [item.type]: item.id,
                                }).catch(() => {});
                              }
                            }
                          }}
                          disabled={isLevelLock}
                          style={{
                            padding: '6px 12px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 700,
                            whiteSpace: 'nowrap', cursor: isLevelLock ? 'default' : 'pointer',
                            background: isEquipped ? 'rgba(233,69,96,0.2)'
                              : isLevelLock ? 'rgba(255,255,255,0.04)'
                              : 'rgba(124,58,237,0.2)',
                            color: isEquipped ? '#f87171'
                              : isLevelLock ? 'rgba(255,255,255,0.2)'
                              : '#a78bfa',
                          }}
                        >
                          {isLevelLock ? `🔒 Lv.${item.requiredLevel}` : isEquipped ? 'ถอด' : 'ใส่'}
                        </button>
                      )}
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

// Consumable catalog (same data as ShopPage but defined locally)
const CONSUMABLES = [
  { id: 'potion',   icon: '🧪', label: 'Health Potion', desc: 'ฟื้นฟู 30 HP ระหว่างการสู้รบ', price: 30, max: 5, color: '#16a34a' },
  { id: 'antidote', icon: '💊', label: 'Antidote',       desc: 'รักษาสถานะ Burn/Poison/Freeze', price: 20, max: 5, color: '#059669' },
  { id: 'scroll',   icon: '📜', label: 'Attack Scroll',  desc: '+5 ATK สำหรับการสู้รบถัดไป',    price: 50, max: 3, color: '#c2410c' },
];

// ===== Items Tab (Consumables only) =====
function EquipmentShopTab({ selectedClass: _selectedClass, displayLevel: _displayLevel }: { selectedClass: CharacterClass; displayLevel: number }) {
  const shopStore = useShopStore();
  const { colors } = useTheme();
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null);

  function showFlash(msg: string, ok: boolean) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 1800);
  }

  function getOwned(id: string) {
    if (id === 'potion') return shopStore.potions;
    if (id === 'antidote') return shopStore.antidotes;
    if (id === 'scroll') return Math.round(shopStore.attackBonus / 5);
    return 0;
  }

  function buyCon(c: typeof CONSUMABLES[0]) {
    const owned = getOwned(c.id);
    if (owned >= c.max) { showFlash(`ถือได้สูงสุด ${c.max} ชิ้น`, false); return; }
    if (shopStore.gold < c.price) { showFlash(`เงินไม่พอ! ต้องการ ${c.price}g`, false); return; }
    shopStore.spendGold(c.price);
    if (c.id === 'potion')   shopStore.setPotions(shopStore.potions + 1);
    if (c.id === 'antidote') shopStore.setAntidotes(shopStore.antidotes + 1);
    if (c.id === 'scroll')   shopStore.setAttackBonus(shopStore.attackBonus + 5);
    showFlash(`ซื้อ ${c.label} สำเร็จ!`, true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Gold bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px', background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10,
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>🧪 {shopStore.potions}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>💊 {shopStore.antidotes}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>📜 +{shopStore.attackBonus}ATK</span>
        </div>
        <span style={{ color: '#fbbf24', fontSize: 15, fontWeight: 900 }}>💰 {shopStore.gold}g</span>
      </div>

      {flash && (
        <div style={{
          background: flash.ok ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${flash.ok ? '#16a34a' : '#ef4444'}88`,
          borderRadius: 8, padding: '7px 14px',
          color: flash.ok ? '#4ade80' : '#fca5a5', fontSize: 12, fontWeight: 600, textAlign: 'center',
        }}>{flash.ok ? '✅ ' : '❌ '}{flash.msg}</div>
      )}

      {CONSUMABLES.map((c) => {
        const owned = getOwned(c.id);
        const full = owned >= c.max;
        const poor = shopStore.gold < c.price;
        const canBuy = !full && !poor;
        return (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 10,
            background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: `${c.color}22`, border: `1px solid ${c.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: colors.text, fontSize: 14, fontWeight: 700 }}>{c.label}</span>
                <span style={{ color: '#fbbf24', fontSize: 12, fontWeight: 800 }}>{c.price}g</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ color: colors.textMuted, fontSize: 11 }}>{c.desc}</span>
              </div>
              {/* Stock dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                {Array.from({ length: c.max }).map((_, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: 2, background: i < owned ? c.color : 'rgba(255,255,255,0.1)' }} />
                ))}
                <span style={{ color: colors.textMuted, fontSize: 10, marginLeft: 4 }}>{owned}/{c.max}</span>
              </div>
            </div>
            <button onClick={() => buyCon(c)} disabled={!canBuy} style={{
              padding: '8px 18px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700,
              whiteSpace: 'nowrap', cursor: canBuy ? 'pointer' : 'not-allowed',
              background: canBuy ? `linear-gradient(135deg,${c.color},${c.color}cc)` : 'rgba(255,255,255,0.05)',
              color: canBuy ? 'white' : 'rgba(255,255,255,0.25)',
            }}>
              {full ? 'เต็มแล้ว' : poor ? 'ไม่พอ' : 'ซื้อ'}
            </button>
          </div>
        );
      })}

      <div style={{ padding: '8px 12px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 8 }}>
        <p style={{ color: 'rgba(96,165,250,0.7)', fontSize: 10, margin: 0 }}>
          💡 ของใช้สิ้นเปลืองจะพกติดตัวเข้าสู้รบ ใช้ได้จาก Flowchart ด้วย block <b>use_potion</b> / <b>use_antidote</b>
        </p>
      </div>
    </div>
  );
}


function StatsTab() {
  const store = useCharacterStore();
  const { character, player } = useGameStore();
  const { colors } = useTheme();
  const stats = store.getCalculatedStats();
  const base = CLASS_BASE_STATS[store.selectedClass];
  const cls = store.selectedClass;
  const gain = CLASS_STAT_GAIN[cls];

  // Determine display level for selected class
  const cp = player?.characterProgress?.[cls];
  const isCurrentClass = character?.class === cls;
  const displayLevel = (isCurrentClass ? character?.level : cp?.level) ?? 1;
  const levelsAboveBase = displayLevel - 1;

  const rows = [
    { icon: '❤️', label: 'Max HP',  base: base.maxHP,   eq: stats.maxHP,   final: stats.maxHP   + levelsAboveBase * gain.maxHP,   max: 250, color: '#4ade80', gainPer: gain.maxHP   },
    { icon: '⚔️', label: 'Attack',  base: base.attack,  eq: stats.attack,  final: stats.attack  + levelsAboveBase * gain.attack,  max: 55,  color: '#f87171', gainPer: gain.attack  },
    { icon: '🛡️', label: 'Defense', base: base.defense, eq: stats.defense, final: stats.defense + levelsAboveBase * gain.defense, max: 35,  color: '#60a5fa', gainPer: gain.defense },
    { icon: '⚡', label: 'Speed',   base: base.speed,   eq: stats.speed,   final: stats.speed   + levelsAboveBase * gain.speed,   max: 35,  color: '#fbbf24', gainPer: gain.speed   },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ color: colors.textMuted, fontSize: 11 }}>Base → Equip → Level → Final</span>
        <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>Lv.{displayLevel}</span>
      </div>
      {rows.map((r) => {
        const eqBonus  = r.eq - r.base;
        const lvBonus  = levelsAboveBase * r.gainPer;
        return (
          <div key={r.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{r.icon}</span>
                <span style={{ color: colors.textSub, fontSize: 13 }}>{r.label}</span>
                {r.gainPer > 0 && (
                  <span style={{ color: colors.textMuted, fontSize: 9 }}>+{r.gainPer}/Lv</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: colors.textMuted, fontSize: 11 }}>{r.base}</span>
                {eqBonus > 0 && <span style={{ color: r.color + 'aa', fontSize: 11 }}>+{eqBonus}⚔️</span>}
                {lvBonus > 0 && <span style={{ color: '#fbbf24', fontSize: 11 }}>+{lvBonus}★</span>}
                <span style={{ color: r.color, fontWeight: 800, fontSize: 14 }}>{r.final}</span>
              </div>
            </div>
            <div style={{ width: '100%', height: 8, background: colors.bgSurface, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              {/* Base bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.min((r.base / r.max) * 100, 100) + '%', background: r.color + '33', borderRadius: 4 }} />
              {/* Base + equipment bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.min((r.eq / r.max) * 100, 100) + '%', background: r.color + '66', borderRadius: 4 }} />
              {/* Full bar (base + equip + level) */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.min((r.final / r.max) * 100, 100) + '%', background: r.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        );
      })}

      {/* Per-level growth note */}
      <div style={{ marginTop: 4, marginBottom: 12, padding: '8px 10px', background: 'rgba(251,191,36,0.06)', borderRadius: 8, border: '1px solid rgba(251,191,36,0.15)' }}>
        <p style={{ color: 'rgba(251,191,36,0.7)', fontSize: 10, margin: 0, fontWeight: 600 }}>
          ★ Level Growth ({cls.charAt(0).toUpperCase() + cls.slice(1)}):
          {gain.maxHP > 0 ? ` +${gain.maxHP}HP` : ''}
          {gain.attack > 0 ? ` +${gain.attack}ATK` : ''}
          {gain.defense > 0 ? ` +${gain.defense}DEF` : ''}
          {gain.speed > 0 ? ` +${gain.speed}SPD` : ''}
          {' '}per level
        </p>
      </div>

      {/* Equipment summary */}
      <div style={{ marginTop: 16, padding: '10px 12px', background: colors.bgSurface, borderRadius: 10, border: `1px solid ${colors.borderSubtle}` }}>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: '0 0 6px', letterSpacing: 1 }}>EQUIPPED</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.entries(SLOT_META) as [keyof typeof SLOT_META, typeof SLOT_META[keyof typeof SLOT_META]][]).map(([slot, meta]) => {
            const eq = store.equipment[slot];
            return (
              <div key={slot} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 11,
                background: eq ? 'rgba(233,69,96,0.12)' : colors.bgSurface,
                border: eq ? '1px solid rgba(233,69,96,0.3)' : `1px solid ${colors.borderSubtle}`,
                color: eq ? colors.text : colors.textMuted,
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
