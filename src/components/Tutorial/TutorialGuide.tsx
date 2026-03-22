import { useState, useEffect, useRef, useCallback } from 'react';

export type TutorialTarget = 'canvas' | 'run-btn' | null;

interface GuidedStep {
  text: string;
  target: TutorialTarget;
}

const GUIDED_STEPS: Record<string, GuidedStep[]> = {
  // ── PHASE 1: SEQUENCE ────────────────────────────────────────────────────
  level_1: [
    { text: '① คลิกใน Canvas ด้านล่าง → Process → Combat → Attack เพื่อเพิ่ม block โจมตี', target: 'canvas' },
    { text: '② ลากปลายลูกศรจาก Start → Attack → End เพื่อเชื่อมต่อ block ให้ครบ', target: 'canvas' },
    { text: '③ กด ▶ Run เพื่อรัน Flowchart — Slime HP น้อย Attack ครั้งเดียวก็จบ!', target: 'run-btn' },
  ],
  level_2: [
    { text: '① Process แบ่งเป็น 2 หมวด: Combat (โจมตี) และ Support (ช่วยตัวเอง) — วาง Attack ก่อน', target: 'canvas' },
    { text: '② วาง Heal จาก Process → Support → Heal แล้วต่อใน Sequence: Attack → Heal → Attack', target: 'canvas' },
    { text: '③ กด ▶ Run — Heal จะฟื้น HP ให้ เมื่อถึงตำแหน่งนั้นใน Flowchart!', target: 'run-btn' },
  ],
  level_3: [
    { text: '① Dodge อยู่ที่ Process → Support → Dodge — วางไว้ระหว่าง Attack เพื่อหลบ', target: 'canvas' },
    { text: '② ต่อ: Start → Attack → Dodge → Attack → End — Dodge หลบดาเมจ 1 ครั้ง', target: 'canvas' },
    { text: '③ กด ▶ Run แล้วดู HP ที่หายไป — น้อยกว่าไม่ใช้ Dodge ไหม?', target: 'run-btn' },
  ],

  // ── PHASE 2: DECISION HP ─────────────────────────────────────────────────
  level_4: [
    { text: '① วาง Decision node: คลิก Canvas → Decision → HP → HP < N? เลือก "HP < 50?"', target: 'canvas' },
    { text: '② ต่อ: YES (สีเขียว) → Heal | NO (สีแดง) → Attack — นี่คือ If/Else!', target: 'canvas' },
    { text: '③ กด ▶ Run — Flowchart จะ Heal เมื่อ HP < 50 และ Attack เมื่อ HP ≥ 50!', target: 'run-btn' },
  ],
  level_5: [
    { text: '① ซ้อน Decision: วาง HP < 60? ก่อน YES → วาง HP < 30? อีกอัน', target: 'canvas' },
    { text: '② HP < 30? YES → Dodge | NO ออกมาต่อ | HP < 60? YES → Heal | NO → Attack', target: 'canvas' },
    { text: '③ กด ▶ Run — Flowchart ตรวจ HP 2 ระดับ เหมือน if-elif-else ในโปรแกรม!', target: 'run-btn' },
  ],
  level_6: [
    { text: '① วาง Decision → HP → HP > N? เลือก "HP > 50?" — ตรวจ HP "มากกว่า"', target: 'canvas' },
    { text: '② YES → Cast Spell (Process → Combat → Cast Spell) | NO → Attack', target: 'canvas' },
    { text: '③ กด ▶ Run — Spell ทะลุเกราะ Wraith ได้ดีกว่า Attack เมื่อ HP พอ!', target: 'run-btn' },
  ],

  // ── PHASE 3: DECISION AILMENT ────────────────────────────────────────────
  level_7: [
    { text: '① Orc ทำให้ Poisoned! วาง Decision → Ailment → Hero Poisoned? เพื่อตรวจ', target: 'canvas' },
    { text: '② YES (Poisoned) → Heal (หยุด Poison) | NO → Attack — Ailment คือ boolean flag!', target: 'canvas' },
    { text: '③ กด ▶ Run — ถ้าไม่ตรวจ Poison จะ damage ทุกรอบจนตาย!', target: 'run-btn' },
  ],
  level_8: [
    { text: '① Kobold ทำให้ Frozen! วาง Decision → Ailment → Hero Frozen? เพื่อตรวจ', target: 'canvas' },
    { text: '② YES (Frozen) → Dodge (หลบก่อน action miss!) | NO → Power Strike', target: 'canvas' },
    { text: '③ กด ▶ Run — Frozen ทำให้ action miss ดังนั้นต้อง Dodge ก่อนใช้ท่า!', target: 'run-btn' },
  ],

  // ── PHASE 4: DECISION COUNTER ────────────────────────────────────────────
  level_9: [
    { text: '① วาง Decision → Counter → Turn ≥ N? — Counter นับรอบเหมือน for-loop!', target: 'canvas' },
    { text: '② กด ±1 บน node เพื่อปรับ threshold: Turn ≥ 3 เหมาะ | YES → Power Strike | NO → Attack', target: 'canvas' },
    { text: '③ กด ▶ Run — 2 รอบแรก Attack, รอบที่ 3+ Power Strike ทะลุ armor!', target: 'run-btn' },
  ],
  level_10: [
    { text: '① วาง Decision HP < 40? → YES: Dodge (หลบ Troll Enrage) | NO ต่อ', target: 'canvas' },
    { text: '② วาง Decision Turn ≥ 5? → YES: Power Strike | NO: Attack — ปรับ Turn ±1 หา timing', target: 'canvas' },
    { text: '③ กด ▶ Run — Counter + HP พร้อมกัน: burst เมื่อครบรอบ แต่ Dodge ก่อนเมื่อ HP ต่ำ!', target: 'run-btn' },
  ],

  // ── PHASE 5: LOOP ────────────────────────────────────────────────────────
  level_11: [
    { text: '① วาง Decision → Enemy → Enemy Alive? — นี่คือ condition สำหรับ While Loop!', target: 'canvas' },
    { text: '② YES → Attack → ลากลูกศรวนกลับไปที่ Enemy Alive? | NO → End', target: 'canvas' },
    { text: '③ กด ▶ Run — While Loop วนซ้ำ Attack จนศัตรูตาย เหมือน while(alive) attack();', target: 'run-btn' },
  ],
  level_12: [
    { text: '① สร้าง While Loop (Enemy Alive?) ก่อน', target: 'canvas' },
    { text: '② ใน YES branch: วาง HP < 50? → YES: Heal | NO: Cast Spell — If/Else ใน Loop!', target: 'canvas' },
    { text: '③ กด ▶ Run — ทุกรอบที่วน: ตรวจ HP ก่อน ถ้าต่ำ Heal ถ้าปกติ Cast Spell!', target: 'run-btn' },
  ],
  level_13: [
    { text: '① สร้าง While Loop (Enemy Alive?) ก่อน', target: 'canvas' },
    { text: '② ใน YES branch: วาง Turn ≥ 3? → YES: Power Strike | NO: Attack → วนกลับ Loop', target: 'canvas' },
    { text: '③ กด ▶ Run — Counter ใน Loop: burst ทุก N รอบ เหมือน if (turn % N == 0) burst();', target: 'run-btn' },
  ],
  level_14: [
    { text: '① สร้าง While Loop (Enemy Alive?) ก่อน', target: 'canvas' },
    { text: '② ใน YES branch ซ้อน: Poisoned?→Heal / HP<50?→Dodge / Turn≥4?→Power Strike / else→Cast Spell', target: 'canvas' },
    { text: '③ กด ▶ Run — Loop ที่ครบ: ตรวจ Ailment + HP + Counter ทุกรอบ ไม่พลาดสักอย่าง!', target: 'run-btn' },
  ],

  // ── PHASE 6: COMBINE ─────────────────────────────────────────────────────
  level_15: [
    { text: '① สร้าง While Loop แล้วซ้อนทุกอย่างใน YES branch: Ailment + HP + Counter', target: 'canvas' },
    { text: '② Poisoned?→Heal / HP<40?→Dodge / Turn≥4?→Power Strike / else→Cast Spell → วนกลับ', target: 'canvas' },
    { text: '③ กด ▶ Run — Full Algorithm: ผสม Sequence + Decision + Loop ทุก concept!', target: 'run-btn' },
  ],

  // ── PHASE 7: ADVANCED ────────────────────────────────────────────────────
  level_16: [
    { text: '① Vampire ดูด HP ทุกรอบ! ใช้ Class Skill ของ Class ตัวเองใน Loop', target: 'canvas' },
    { text: '② ตรวจ Poisoned? → Heal, ตรวจ HP → สลับ Class Skill กับ Attack อย่างชาญฉลาด', target: 'canvas' },
    { text: '③ กด ▶ Run — Class Skill ดีกว่า Attack มาก ใช้ให้ถูกจังหวะ!', target: 'run-btn' },
  ],
  level_17: [
    { text: '① Frost Titan แข็งมาก! วาง Frozen? → Dodge ก่อนเสมอ Frozen ทำให้ miss', target: 'canvas' },
    { text: '② วาง Turn ≥ N? แล้วกด ±1 ปรับ threshold ทีละ 1 หา timing ที่แม่นยำที่สุด', target: 'canvas' },
    { text: '③ กด ▶ Run หลายรอบ ทดสอบ threshold ต่างกัน แล้วเลือกที่ดีที่สุด!', target: 'run-btn' },
  ],

  // ── PHASE 8: MASTERY (ไม่มี step-by-step — hint แค่เดียว) ───────────────
  level_18: [
    { text: 'Mastery: ไม่มีคำแนะนำ! ออกแบบ Flowchart ด้วยตัวเองจากทุกที่เรียนมา', target: 'canvas' },
    { text: 'Dark Commander ใช้ทุกท่า — ต้องการ Loop + Ailment + HP + Counter ที่ครบ', target: 'canvas' },
    { text: 'กด ▶ Run แล้วดูผล ถ้าแพ้ให้ปรับ Flowchart แล้วลองใหม่!', target: 'run-btn' },
  ],
  level_19: [
    { text: 'Sub-Boss: Lich Lord ไม่มีจุดอ่อน — ใช้ทุกที่เรียนมาให้สมบูรณ์แบบ', target: 'canvas' },
    { text: 'Loop ที่ครบ + ตรวจ Ailment ทุกประเภท + Counter precision + Class Skill', target: 'canvas' },
    { text: 'กด ▶ Run — พิสูจน์ว่าคุณเข้าใจ Flowchart ทุก concept แล้ว!', target: 'run-btn' },
  ],
  level_20: [
    { text: 'Final Boss: Dark Overlord — บทพิสูจน์ขั้นสุดท้าย ไม่มีคำแนะนำ!', target: 'canvas' },
    { text: 'ออกแบบ Flowchart ที่สมบูรณ์แบบที่สุด ผสมทุก concept ทุก skill', target: 'canvas' },
    { text: 'กด ▶ Run — ถ้าชนะ Dark Overlord คุณคือ Master of Flowchart!', target: 'run-btn' },
  ],
};

interface TutorialGuideProps {
  levelId: string;
  onClose: () => void;
  onTargetChange: (target: TutorialTarget) => void;
}

export default function TutorialGuide({ levelId, onClose, onTargetChange }: TutorialGuideProps) {
  const steps = GUIDED_STEPS[levelId];
  const [step, setStep] = useState(0);

  // Draggable state
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragAnchor = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const onDragMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    setPos({
      x: dragAnchor.current.px + (e.clientX - dragAnchor.current.mx),
      y: dragAnchor.current.py + (e.clientY - dragAnchor.current.my),
    });
  }, []);

  const onDragEnd = useCallback(() => {
    dragging.current = false;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
  }, [onDragMove]);

  function onDragStart(e: React.MouseEvent) {
    e.preventDefault();
    const rect = panelRef.current!.getBoundingClientRect();
    dragging.current = true;
    dragAnchor.current = { mx: e.clientX, my: e.clientY, px: rect.left, py: rect.top };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }

  useEffect(() => {
    if (steps) onTargetChange(steps[step]?.target ?? null);
  }, [step, steps]);

  useEffect(() => {
    return () => onTargetChange(null);
  }, []);

  if (!steps) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  function next() {
    if (isLast) { onTargetChange(null); onClose(); }
    else setStep(s => s + 1);
  }

  const isMobile = window.innerWidth < 640;
  const posStyle: React.CSSProperties = pos
    ? { position: 'fixed', left: pos.x, top: pos.y }
    : isMobile
      ? { position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', width: 'calc(100vw - 32px)', maxWidth: 360 }
      : { position: 'fixed', bottom: 24, right: 24 };

  return (
    <div
      ref={panelRef}
      style={{
        ...posStyle,
        zIndex: 1000,
        width: 300,
        background: 'rgba(10,10,30,0.97)',
        border: '1.5px solid rgba(251,191,36,0.6)',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header — drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{
          background: 'linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05))',
          borderBottom: '1px solid rgba(251,191,36,0.25)',
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>📖</span>
          <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>
            คู่มือ — {step + 1}/{steps.length}
          </span>
          <span style={{ color: 'rgba(251,191,36,0.4)', fontSize: 9 }}>⠿ลาก</span>
        </div>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => { onTargetChange(null); onClose(); }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
        >✕</button>
      </div>

      {/* Target indicator */}
      <div style={{
        padding: '6px 12px',
        background: current.target === 'canvas' ? 'rgba(59,130,246,0.12)' : 'rgba(74,222,128,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 13 }}>{current.target === 'canvas' ? '↙' : '↑'}</span>
        <span style={{ color: current.target === 'canvas' ? '#93c5fd' : '#4ade80', fontSize: 10, fontWeight: 700 }}>
          {current.target === 'canvas' ? 'ดูที่ Flowchart Canvas ด้านล่าง' : 'ดูที่ปุ่ม ▶ Run ด้านบน'}
        </span>
      </div>

      {/* Step text */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ color: '#fde68a', fontSize: 13, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
          {current.text}
        </p>
      </div>

      {/* Dots + buttons */}
      <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 16 : 6, height: 6, borderRadius: 3,
              background: i === step ? '#fbbf24' : 'rgba(255,255,255,0.18)',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#cbd5e1', fontSize: 11, padding: '6px 0',
                borderRadius: 8, cursor: 'pointer',
              }}
            >← ก่อนหน้า</button>
          )}
          <button
            onClick={next}
            style={{
              flex: 2,
              background: isLast
                ? 'linear-gradient(135deg,#16a34a,#15803d)'
                : 'linear-gradient(135deg,#d97706,#b45309)',
              border: 'none', color: 'white',
              fontSize: 11, padding: '6px 0', borderRadius: 8,
              cursor: 'pointer', fontWeight: 700,
            }}
          >
            {isLast ? 'เข้าใจแล้ว เล่นเลย! ✓' : 'ถัดไป →'}
          </button>
        </div>
      </div>
    </div>
  );
}
