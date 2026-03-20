import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { soundManager } from '../../services/soundManager';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  variant?: 'icon' | 'menu' | 'header';
}

export default function VolumeButton({ variant = 'icon' }: Props) {
  const { colors } = useTheme();
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted());
  const [showPanel, setShowPanel] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const [bgmVol, setBgmVol] = useState(() => soundManager.getBGMVolume());
  const [sfxVol, setSfxVol] = useState(() => soundManager.getSFXVolume());
  const btnRef = useRef<HTMLButtonElement>(null);

  const togglePanel = () => {
    if (!showPanel && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setShowPanel((v) => !v);
  };

  const panel = showPanel ? createPortal(
    <>
      <div onClick={() => setShowPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
      <div style={{
        position: 'fixed', top: panelPos.top, right: panelPos.right, zIndex: 9999,
        background: 'rgba(15,15,30,0.96)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
        padding: '12px 16px', minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <button
          onClick={() => { const next = !isMuted; soundManager.setMuted(next); setIsMuted(next); }}
          style={{
            background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.15)',
            border: `1px solid ${isMuted ? 'rgba(239,68,68,0.4)' : 'rgba(74,222,128,0.3)'}`,
            borderRadius: 8, color: isMuted ? '#f87171' : '#4ade80',
            fontSize: 12, fontWeight: 700, padding: '5px 10px', cursor: 'pointer',
          }}>
          {isMuted ? '🔇 ปิดเสียง' : '🔊 เปิดเสียง'}
        </button>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>BGM</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{Math.round(bgmVol * 100)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={bgmVol}
            onChange={(e) => { const v = parseFloat(e.target.value); setBgmVol(v); soundManager.setBGMVolume(v); }}
            style={{ width: '100%', accentColor: '#a78bfa' }} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>SFX</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{Math.round(sfxVol * 100)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={sfxVol}
            onChange={(e) => { const v = parseFloat(e.target.value); setSfxVol(v); soundManager.setSFXVolume(v); }}
            style={{ width: '100%', accentColor: '#a78bfa' }} />
        </div>
      </div>
    </>,
    document.body
  ) : null;

  if (variant === 'menu') {
    return (
      <>
        {panel}
        <button
          ref={btnRef}
          onClick={togglePanel}
          style={{
            width: '100%', padding: 12, borderRadius: 12,
            border: `1px solid ${colors.borderSubtle}`,
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            color: colors.textMuted, fontSize: 13,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = colors.text; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = colors.textMuted; }}
        >
          <span style={{ fontSize: 16 }}>{isMuted ? '🔇' : '🔊'}</span>
          <span>Sound</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }}>
            BGM {Math.round(bgmVol * 100)}%
          </span>
        </button>
      </>
    );
  }

  if (variant === 'header') {
    return (
      <>
        {panel}
        <button
          ref={btnRef}
          onClick={togglePanel}
          title="ตั้งค่าเสียง"
          style={{
            background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
            color: colors.text, width: 40, height: 40,
            borderRadius: 10, cursor: 'pointer', fontSize: 18,
          }}
        >{isMuted ? '🔇' : '🔊'}</button>
      </>
    );
  }

  return (
    <>
      {panel}
      <button
        ref={btnRef}
        onClick={togglePanel}
        title="ตั้งค่าเสียง"
        style={{
          background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.9)',
          padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 16, lineHeight: 1,
        }}
      >{isMuted ? '🔇' : '🔊'}</button>
    </>
  );
}
