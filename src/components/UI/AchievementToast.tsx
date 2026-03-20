import { useEffect, useState } from 'react';
import type { Achievement } from '../../utils/achievements';

interface Props {
  achievements: Achievement[];
  onDone: () => void;
}

/**
 * แสดง popup เมื่อปลดล็อค achievement ใหม่
 * แสดงทีละอัน ทุก 3 วินาที
 */
export default function AchievementToast({ achievements, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (achievements.length === 0) { onDone(); return; }
    const timer = setTimeout(() => {
      if (idx < achievements.length - 1) {
        setVisible(false);
        setTimeout(() => { setIdx((i) => i + 1); setVisible(true); }, 300);
      } else {
        setVisible(false);
        setTimeout(onDone, 300);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [idx, achievements.length]);

  if (achievements.length === 0) return null;
  const ach = achievements[idx];

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-12px)',
      transition: 'opacity 0.3s, transform 0.3s',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.95), rgba(245,158,11,0.95))',
        border: '2px solid rgba(251,191,36,0.8)',
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 4px 24px rgba(251,191,36,0.4)',
        minWidth: 240, maxWidth: 320,
      }}>
        <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{ach.icon}</span>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(0,0,0,0.5)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Achievement ปลดล็อค!
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1c1400' }}>{ach.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', marginTop: 1 }}>{ach.description}</div>
        </div>
      </div>
    </div>
  );
}
