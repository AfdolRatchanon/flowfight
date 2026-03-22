import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useFlowchartStore } from '../../stores/flowchartStore';
import FlowchartEditor from '../FlowchartEditor/FlowchartEditor';
import VolumeButton from './VolumeButton';

export default function SandboxMode() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { clearToStartEnd } = useFlowchartStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleClear() {
    clearToStartEnd();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: colors.bgGrad }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        background: colors.bgSurface, borderBottom: `1px solid ${colors.borderSubtle}`,
        flexShrink: 0,
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'transparent', border: `1px solid ${colors.borderSubtle}`,
          color: colors.text, width: 36, height: 36, borderRadius: 8,
          cursor: 'pointer', fontSize: 16, flexShrink: 0,
        }}>←</button>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Cinzel', serif", color: '#FBBF24', fontSize: 16, margin: 0, letterSpacing: 1 }}>
            Sandbox Mode
          </h1>
          <p style={{ color: colors.textMuted, fontSize: 11, margin: 0 }}>
            วาด Flowchart อิสระ — ฝึก Logic โดยไม่มีศัตรู
          </p>
        </div>

        <button onClick={handleClear} style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)', color: '#f87171',
        }}>Reset</button>

        <VolumeButton variant="header" />
      </div>

      {/* Tip banner */}
      <div style={{
        background: 'rgba(251,191,36,0.06)', borderBottom: `1px solid rgba(251,191,36,0.15)`,
        padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ color: '#FBBF24', fontSize: 12 }}>Sandbox:</span>
        <span style={{ color: colors.textMuted, fontSize: 11 }}>
          {isMobile
            ? 'แตะบน canvas เพื่อเพิ่ม block · ลากเส้นเชื่อม node · ไม่มีการสู้รบ ฝึกได้อิสระ'
            : 'คลิกบน canvas เพื่อเพิ่ม block · ลากเส้นเชื่อม node · Ctrl+Z = Undo · ไม่มีการสู้รบ ฝึกได้อิสระ'
          }
        </span>
      </div>

      {/* FlowchartEditor — ใช้ dummy levelId ที่ไม่มีจริง */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <FlowchartEditor levelId="sandbox" isExecuting={false} />
      </div>
    </div>
  );
}
