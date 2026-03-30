/**
 * ConfirmModal — modal ยืนยันกลางหน้าจอ ใช้ร่วมกันทุกที่
 *
 * Props:
 *   title      — หัวข้อ
 *   message    — ข้อความรายละเอียด (optional)
 *   confirmLabel — ข้อความปุ่มยืนยัน (default "ยืนยัน")
 *   cancelLabel  — ข้อความปุ่มยกเลิก (default "ยกเลิก")
 *   danger     — ปุ่มยืนยันเป็นสีแดง (default false)
 *   onConfirm  — callback เมื่อกดยืนยัน
 *   onCancel   — callback เมื่อกดยกเลิก / คลิก backdrop
 */

import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();

  const btnColor   = danger ? '#ef4444' : '#FBBF24';
  const btnBg      = danger ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.12)';
  const btnBorder  = danger ? 'rgba(239,68,68,0.5)'  : 'rgba(251,191,36,0.4)';

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.bgCard,
          border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : colors.border}`,
          borderRadius: 18,
          padding: '28px 28px 24px',
          width: '100%', maxWidth: 360,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <p style={{ fontSize: 40, margin: '0 0 12px' }}>
          {danger ? '⚠️' : '❓'}
        </p>

        {/* Title */}
        <h3 style={{
          color: colors.text, fontSize: 18, fontWeight: 700,
          margin: '0 0 8px', lineHeight: 1.4,
        }}>
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p style={{
            color: colors.textMuted, fontSize: 14,
            margin: '0 0 24px', lineHeight: 1.6,
          }}>
            {message}
          </p>
        )}
        {!message && <div style={{ marginBottom: 24 }} />}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${colors.borderSubtle}`, background: 'transparent',
              color: colors.textMuted, fontSize: 14, fontWeight: 600,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
              border: `1px solid ${btnBorder}`,
              background: btnBg,
              color: btnColor, fontSize: 14, fontWeight: 700,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
