import { useState, useEffect } from 'react';

export type TutorialTarget = 'canvas' | 'run-btn' | null;

interface GuidedStep {
  text: string;
  target: TutorialTarget;
}

const GUIDED_STEPS: Record<string, GuidedStep[]> = {
  level_1: [
    { text: '① คลิกใน Canvas ด้านล่าง → Process → Attack เพื่อเพิ่ม block โจมตี', target: 'canvas' },
    { text: '② ลากปลายลูกศรจาก Start → Attack → End เพื่อเชื่อมต่อ block', target: 'canvas' },
    { text: '③ กด ▶ Play เพื่อรัน Flowchart แล้วดูผลการต่อสู้!', target: 'run-btn' },
  ],
  level_2: [
    { text: '① คลิกใน Canvas → Process → Attack วางหลายตัวต่อกัน', target: 'canvas' },
    { text: '② เชื่อม Start → Attack → Attack → Attack → End (Sequence ยาวขึ้น)', target: 'canvas' },
    { text: '③ กด ▶ Play — ยิ่งวาง Attack มาก ยิ่งโจมตีได้มากครั้ง!', target: 'run-btn' },
  ],
  level_3: [
    { text: '① คลิก → Decision → Enemy Alive? แล้ววางใน Canvas', target: 'canvas' },
    { text: '② YES → Attack → ลูกศรวนกลับไป Enemy Alive? (สร้าง Loop!)', target: 'canvas' },
    { text: '③ NO → End แล้วกด ▶ Play — นี่คือ While Loop!', target: 'run-btn' },
  ],
  level_4: [
    { text: '① สร้าง While Loop ก่อน: Enemy Alive? → YES branch', target: 'canvas' },
    { text: '② ใน YES: วาง Decision → HP < 50? → YES: Heal / NO: Attack', target: 'canvas' },
    { text: '③ กด ▶ Play — ฮีลเมื่อ HP ต่ำ โจมตีเมื่อ HP ปกติ!', target: 'run-btn' },
  ],
  level_5: [
    { text: '① สร้าง While Loop แล้ววาง HP < 30? ใน YES branch', target: 'canvas' },
    { text: '② YES→Dodge, NO→ต่อวาง HP < 60?→YES: Heal, NO: Attack (Condition ซ้อนกัน)', target: 'canvas' },
    { text: '③ กด ▶ Play — Nested If ตรวจหลายระดับ!', target: 'run-btn' },
  ],
  level_6: [
    { text: '① สร้าง While Loop (Enemy Alive?) ก่อน', target: 'canvas' },
    { text: '② ใน YES branch วาง Turn ≥ 4? → YES: Power Strike / NO: Attack', target: 'canvas' },
    { text: '③ กด ▶ Play — Counter Loop นับรอบ แล้วใช้ท่าพิเศษ!', target: 'run-btn' },
  ],
  level_7: [
    { text: '① สร้าง While Loop (Enemy Alive?) ก่อน', target: 'canvas' },
    { text: '② ใน YES branch วาง HP > 50? → YES: Cast Spell / NO: Attack', target: 'canvas' },
    { text: '③ กด ▶ Play — ตรวจสถานะก่อนใช้ท่าแรง!', target: 'run-btn' },
  ],
  level_8: [
    { text: '① สร้าง While Loop แล้ววาง HP > 50? ใน YES branch', target: 'canvas' },
    { text: '② YES: Power Strike (ดาเมจ 2x ผ่านเกราะ) / NO: Heal หรือ Attack', target: 'canvas' },
    { text: '③ กด ▶ Play — Goblin Knight เกราะหนา Power Strike ดีกว่า Attack!', target: 'run-btn' },
  ],
  level_9: [
    { text: '① สร้าง While Loop แล้ววาง "ฉัน Poisoned?" ใน YES branch', target: 'canvas' },
    { text: '② YES (Poisoned) → Heal / NO → Attack', target: 'canvas' },
    { text: '③ กด ▶ Play — State Condition ตรวจสถานะเหมือน boolean flag!', target: 'run-btn' },
  ],
  level_10: [
    { text: '① สร้าง While Loop แล้ววาง HP < 40? ใน YES branch', target: 'canvas' },
    { text: '② YES→Dodge, NO→วาง HP < 65?→YES: Heal / NO: Attack (Condition ซ้อน)', target: 'canvas' },
    { text: '③ กด ▶ Play — Dodge หลบ Enrage, Heal ฟื้น HP, Attack ตามปกติ!', target: 'run-btn' },
  ],
  level_11: [
    { text: '① สร้าง While Loop แล้วซ้อน Condition หลายชั้นใน YES branch', target: 'canvas' },
    { text: '② ฉัน Poisoned?→Heal / HP<50?→Heal / else→Attack (ตรวจลำดับสำคัญ!)', target: 'canvas' },
    { text: '③ กด ▶ Play — Decision Tree ตัดสินใจหลายทาง!', target: 'run-btn' },
  ],
  level_12: [
    { text: '① สร้าง While Loop แล้วผสม State + Counter ใน YES branch', target: 'canvas' },
    { text: '② Frozen?→Attack / HP<40?→Heal / Turn≥4?→Power Strike / else→Cast Spell', target: 'canvas' },
    { text: '③ กด ▶ Play — ผสม Counter + Resource Condition!', target: 'run-btn' },
  ],
  level_13: [
    { text: '① สร้าง Algorithm ที่ครอบคลุม: While Loop + Ailment + HP + Counter', target: 'canvas' },
    { text: '② ตรวจ Ailment ก่อน → HP → Counter → โจมตีหนัก (ลำดับสำคัญมาก!)', target: 'canvas' },
    { text: '③ กด ▶ Play — Algorithm ต้องรับมือทุกสถานการณ์ได้!', target: 'run-btn' },
  ],
  level_14: [
    { text: '① สร้าง Flowchart ที่มีประสิทธิภาพสูง: Condition น้อยแต่ครอบคลุม', target: 'canvas' },
    { text: '② ใช้ Cast Spell + Power Strike อย่างชาญฉลาดตาม HP และ Turn', target: 'canvas' },
    { text: '③ กด ▶ Play — Optimize คือใช้ Condition น้อยที่สุดแต่ได้ผลดีที่สุด!', target: 'run-btn' },
  ],
  level_15: [
    { text: '① รวมทุกทักษะ: While Loop + Ailment + HP + Counter + Power Strike/Spell', target: 'canvas' },
    { text: '② สร้าง Master Algorithm ที่ครอบคลุมทุกกรณีที่อาจเกิดขึ้น', target: 'canvas' },
    { text: '③ ตรวจ Ailment → HP วิกฤต → Counter → โจมตีหนัก — ลำดับต้องถูกต้อง!', target: 'canvas' },
    { text: '④ กด ▶ Play — นี่คือ Master Algorithm บูรณาการทุกอย่างจาก 14 ด่าน!', target: 'run-btn' },
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

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 1000,
      width: 300,
      background: 'rgba(10,10,30,0.97)',
      border: '1.5px solid rgba(251,191,36,0.6)',
      borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.1)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,191,36,0.05))',
        borderBottom: '1px solid rgba(251,191,36,0.25)',
        padding: '8px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>📖</span>
          <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>
            คู่มือ — {step + 1}/{steps.length}
          </span>
        </div>
        <button
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
          {current.target === 'canvas' ? 'ดูที่ Flowchart Canvas ด้านล่าง' : 'ดูที่ปุ่ม ▶ Play ด้านบน'}
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
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 16 : 6, height: 6, borderRadius: 3,
              background: i === step ? '#fbbf24' : 'rgba(255,255,255,0.18)',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>

        {/* Buttons */}
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
