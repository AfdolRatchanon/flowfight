/**
 * ResearchTestPage.tsx
 * หน้าทำแบบทดสอบ MCQ 20 ข้อ (Pretest / Posttest)
 * ใช้ร่วมกัน — แยกด้วย prop `mode`
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import { RESEARCH_QUESTIONS } from '../../utils/researchQuestions';
import { savePretest, savePosttest, getResearchTests, scoreTestAnswers } from '../../services/researchService';

const ACCENT = '#3b82f6';          // blue — สีเลือกคำตอบ
const ACCENT_BG = 'rgba(59,130,246,0.15)';
const ACCENT_BORDER = 'rgba(59,130,246,0.7)';

interface Props {
  mode: 'pretest' | 'posttest';
}

export default function ResearchTestPage({ mode }: Props) {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const { colors } = useTheme();

  const [answers, setAnswers] = useState<Record<string, 'a' | 'b' | 'c' | 'd'>>({});
  const [submitted, setSubmitted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ score: number; seq: number; dec: number; loop: number } | null>(null);
  const [error, setError] = useState('');
  const [showMissing, setShowMissing] = useState(false);

  const label = mode === 'pretest' ? 'แบบทดสอบก่อนเรียน (Pretest)' : 'แบบทดสอบหลังเรียน (Posttest)';
  const totalQ = RESEARCH_QUESTIONS.length;
  const answered = Object.keys(answers).length;

  useEffect(() => {
    if (!player) return;
    getResearchTests(player.id).then((tests) => {
      if (tests[mode]) setAlreadyDone(true);
    }).catch(() => {});
  }, [player, mode]);

  const handleSelect = (qId: string, key: 'a' | 'b' | 'c' | 'd') => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: key }));
  };

  const handleSubmit = async () => {
    if (answered < totalQ) {
      // หาข้อแรกที่ยังไม่ตอบ แล้ว scroll ไป
      setShowMissing(true);
      const firstMissing = RESEARCH_QUESTIONS.find((q) => !answers[q.id]);
      if (firstMissing) {
        const el = document.getElementById(`q-${firstMissing.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setError(`กรุณาตอบให้ครบทุกข้อ (ยังขาดอีก ${totalQ - answered} ข้อ)`);
      return;
    }
    if (!player) return;
    setSaving(true);
    setError('');
    try {
      const res = scoreTestAnswers(answers, player.classroomCode);
      if (mode === 'pretest') await savePretest(player.id, res);
      else await savePosttest(player.id, res);
      setResult({ score: res.score, seq: res.scoreByCategory.sequence, dec: res.scoreByCategory.decision, loop: res.scoreByCategory.loop });
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  // ─── Already done ─────────────────────────────────────────────
  if (alreadyDone && !submitted) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 40, maxWidth: 480, textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>✓</p>
          <h2 style={{ color: colors.text, marginBottom: 8 }}>ท่านทำ{label}เรียบร้อยแล้ว</h2>
          <p style={{ color: colors.textMuted, marginBottom: 24 }}>ไม่สามารถทำซ้ำได้</p>
          <button onClick={() => navigate('/')}
            style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 16, cursor: 'pointer' }}>
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // ─── Result screen ────────────────────────────────────────────
  if (submitted && result) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 40, maxWidth: 480, textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🎉</p>
          <h2 style={{ color: colors.text, marginBottom: 16 }}>บันทึกเรียบร้อย!</h2>
          <div style={{ background: colors.bgSurface, borderRadius: 12, padding: '20px 32px', marginBottom: 24 }}>
            <p style={{ color: ACCENT, fontSize: 36, fontWeight: 800, marginBottom: 4 }}>{result.score}<span style={{ fontSize: 18, color: colors.textMuted }}> / {totalQ}</span></p>
            <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16 }}>คะแนนรวม</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Sequence', val: result.seq, max: 5,  color: '#60a5fa' },
                { label: 'Decision', val: result.dec, max: 8,  color: '#34d399' },
                { label: 'Loop',     val: result.loop, max: 7, color: '#a78bfa' },
              ].map((c) => (
                <div key={c.label} style={{ background: colors.bgCard, borderRadius: 8, padding: '10px 4px' }}>
                  <p style={{ color: c.color, fontSize: 20, fontWeight: 800 }}>{c.val}<span style={{ fontSize: 12, color: colors.textMuted }}>/{c.max}</span></p>
                  <p style={{ color: colors.textMuted, fontSize: 11 }}>{c.label}</p>
                </div>
              ))}
            </div>
          </div>
          {mode === 'pretest' ? (
            <button onClick={() => navigate('/')}
              style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 16, cursor: 'pointer' }}>
              เริ่มเล่นเกม
            </button>
          ) : (
            <button onClick={() => navigate('/survey')}
              style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 16, cursor: 'pointer' }}>
              ทำแบบสอบถามความพึงพอใจ →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Test form ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: colors.bgGrad, padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ maxWidth: 760, margin: '0 auto 24px' }}>
        <h1 style={{ color: colors.text, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{label}</h1>
        <p style={{ color: colors.textMuted, fontSize: 14 }}>
          ตอบทุกข้อให้ครบ ({answered}/{totalQ}) — ระบบจะบันทึกโดยอัตโนมัติเมื่อส่ง
        </p>
        {/* Progress bar */}
        <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: colors.border }}>
          <div style={{ height: 6, borderRadius: 3, background: ACCENT, width: `${(answered / totalQ) * 100}%`, transition: 'width 0.2s' }} />
        </div>
      </div>

      {/* Questions */}
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {RESEARCH_QUESTIONS.map((q, idx) => {
          const chosen = answers[q.id];
          const isMissing = showMissing && !chosen;
          return (
            <div id={`q-${q.id}`} key={q.id} style={{
              background: colors.bgCard,
              border: `1px solid ${isMissing ? '#ef4444' : chosen ? ACCENT_BORDER : colors.border}`,
              borderRadius: 14, padding: '20px 24px',
              boxShadow: isMissing ? '0 0 0 1px #ef444455' : chosen ? `0 0 0 1px ${ACCENT_BORDER}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <p style={{ color: colors.textMuted, fontSize: 12, margin: 0 }}>ข้อ {idx + 1} · {q.category}</p>
                {isMissing && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700 }}>ยังไม่ตอบ</span>}
              </div>
              <p style={{ color: colors.text, fontSize: 15, whiteSpace: 'pre-wrap', marginBottom: 16, lineHeight: 1.6 }}>{q.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt) => {
                  const isChosen = chosen === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelect(q.id, opt.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        background: isChosen ? ACCENT_BG : 'transparent',
                        border: `2px solid ${isChosen ? ACCENT : colors.border}`,
                        color: isChosen ? '#fff' : colors.text,
                        fontSize: 14, transition: 'all 0.15s',
                      }}
                    >
                      {/* Key badge */}
                      <span style={{
                        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isChosen ? ACCENT : colors.bgSurface,
                        border: `1px solid ${isChosen ? ACCENT : colors.border}`,
                        color: isChosen ? '#fff' : colors.textSub,
                        fontWeight: 800, fontSize: 13,
                      }}>
                        {opt.key.toUpperCase()}
                      </span>
                      <span style={{ color: isChosen ? colors.text : colors.text }}>{opt.text}</span>
                      {isChosen && <span style={{ marginLeft: 'auto', color: ACCENT, fontSize: 18, flexShrink: 0 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 760, margin: '24px auto 48px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        {error && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: ACCENT,
            color: '#fff',
            border: `2px solid ${ACCENT}`,
            borderRadius: 12, padding: '14px 40px', fontSize: 16,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'กำลังบันทึก...' : answered < totalQ ? `ส่งคำตอบ (ตอบแล้ว ${answered}/${totalQ})` : `ส่งคำตอบ ✓`}
        </button>
      </div>
    </div>
  );
}
