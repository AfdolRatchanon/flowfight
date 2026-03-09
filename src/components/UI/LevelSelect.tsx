import { useNavigate } from 'react-router-dom';
import { LEVELS } from '../../utils/constants';
import { useGameStore } from '../../stores/gameStore';
import { levelProgressPct, MAX_LEVEL } from '../../utils/levelSystem';

const DIFFICULTY_COLORS = ['#4ade80','#4ade80','#facc15','#facc15','#fb923c','#fb923c','#f87171','#f87171','#e94560','#e94560','#a855f7','#a855f7','#ec4899','#ec4899','#ffffff'];
const ENEMY_ICONS: Record<string,string> = {
  slime:'🟢', goblin:'👺', goblin_knight:'👺', kobold:'🦎',
  orc:'👹', orc_warlord:'👹', ghost:'👻', troll:'🪨',
  spider:'🕷️', ice_giant:'🧊', dragon:'🐉', fire_elemental:'🔥',
  lich:'💀', shadow_demon:'😈', overlord:'👑', boss:'💀',
};


export default function LevelSelect() {
  const navigate = useNavigate();
  const { player, character } = useGameStore();
  const completed = player?.levelsCompleted ?? [];

  // level_1 เปิดเสมอ, level_N เปิดเมื่อผ่าน level_{N-1}
  function isUnlocked(_levelId: string, idx: number) {
    if (idx === 0) return true;
    return completed.includes(LEVELS[idx - 1].id);
  }

  return (
    <div className="page-outer">
      <div className="page-container">
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
          <button onClick={()=>navigate('/')} style={{ background:'rgba(255,255,255,0.06)', border:'none', color:'white', width:40, height:40, borderRadius:10, cursor:'pointer', fontSize:18 }}>←</button>
          <div style={{ flex:1 }}>
            <h1 style={{ color:'white', fontWeight:800, fontSize:26, margin:0 }}>Select Level</h1>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, margin:0 }}>
              ผ่านแล้ว {completed.length}/{LEVELS.length} ด่าน
            </p>
          </div>
          {/* Character mini-badge */}
          {character && (
            <div style={{
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12, padding:'8px 12px', display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:72,
            }}>
              <img src={`/characters/${character.class}.png`} alt={character.class} style={{ width:36, height:36, objectFit:'contain', imageRendering:'pixelated' }} />
              <span style={{
                background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                color:'#1c1917', fontSize:9, fontWeight:900, padding:'1px 6px', borderRadius:4,
              }}>Lv.{character.level}</span>
              {/* mini XP bar */}
              <div style={{ width:52, height:3, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden' }}>
                <div style={{
                  width: levelProgressPct(character.level, character.experience) + '%',
                  height:'100%', background:'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius:2,
                }} />
              </div>
              <span style={{ color:'rgba(255,255,255,0.3)', fontSize:8 }}>
                {character.level >= MAX_LEVEL ? 'MAX' : `${character.experience} XP`}
              </span>
            </div>
          )}
        </div>
        <div className="level-grid">
          {LEVELS.map((level, i) => {
            const done    = completed.includes(level.id);
            const unlocked = isUnlocked(level.id, i);
            const accentColor = DIFFICULTY_COLORS[i] ?? '#e94560';
            return (
              <div key={level.id}
                onClick={() => unlocked && navigate('/battle/' + level.id)}
                style={{
                  background: done ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.04)',
                  border: done ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius:16, padding:'20px 24px',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  transition:'all 0.2s', position:'relative', overflow:'hidden',
                  opacity: unlocked ? 1 : 0.45,
                }}
                onMouseEnter={(e) => {
                  if (!unlocked) return;
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.background = done ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.08)';
                  d.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.background = done ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.04)';
                  d.style.transform = 'none';
                }}
              >
                {/* ขีดสีด้านซ้าย */}
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background: done ? '#4ade80' : accentColor, borderRadius:'16px 0 0 16px' }} />

                <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                  {/* ไอคอน */}
                  <div style={{ fontSize:40, width:52, textAlign:'center', filter: unlocked ? undefined : 'grayscale(1)' }}>
                    {unlocked ? (ENEMY_ICONS[level.enemy.id] ?? '👾') : '🔒'}
                  </div>

                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ background:accentColor+'33', color:accentColor, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, border:'1px solid '+accentColor+'66' }}>
                        LV {level.number}
                      </span>
                      <span style={{ color:'#f59e0b', fontSize:12 }}>{'★'.repeat(level.difficultyEstimate)}</span>
                      {done && <span style={{ background:'rgba(74,222,128,0.2)', color:'#4ade80', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:6 }}>✓ CLEARED</span>}
                    </div>
                    <h3 style={{ color:'white', fontWeight:700, fontSize:17, margin:'0 0 4px' }}>{level.name}</h3>
                    <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, margin:0 }}>{level.description}</p>
                    <p style={{ color:'#7c3aed', fontSize:12, marginTop:4 }}>📚 {level.concept}</p>
                  </div>

                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ color:'#f87171', fontSize:13, fontWeight:600, margin:'0 0 2px' }}>❤️ {level.enemy.stats.maxHP}</p>
                    <p style={{ color:'#4ade80', fontSize:13, fontWeight:600, margin:0 }}>+{level.rewards.experience} XP</p>
                  </div>
                </div>

                {!unlocked && (
                  <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, margin:'10px 0 0 52px' }}>
                    ผ่านด่านที่ {i} ก่อนเพื่อปลดล็อก
                  </p>
                )}
                {level.tutorialText && unlocked && (
                  <div style={{ marginTop:12, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, padding:'8px 12px' }}>
                    <p style={{ color:'#fbbf24', fontSize:12, margin:0 }}>💡 {level.tutorialText}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}