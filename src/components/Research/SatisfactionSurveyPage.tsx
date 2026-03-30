/**
 * SatisfactionSurveyPage.tsx
 * แบบสอบถามความพึงพอใจ Likert-5 จำนวน 20 ข้อ (5 มิติ × 4 ข้อ)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import { SURVEY_QUESTIONS, DIMENSION_LABELS, LIKERT_LABELS } from '../../utils/surveyQuestions';
import { getResearchSurvey, saveResearchSurvey, scoreSurveyResponses } from '../../services/researchService';

const LIKERT_KEYS: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

// สีต่อระดับ Likert — ไล่จากแดง → เหลือง → เขียว
const LIKERT_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#f87171',  // red-400
  2: '#fb923c',  // orange-400
  3: '#facc15',  // yellow-400
  4: '#4ade80',  // green-400
  5: '#34d399',  // emerald-400
};
const LIKERT_BG: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'rgba(248,113,113,0.18)',
  2: 'rgba(251,146,60,0.18)',
  3: 'rgba(250,204,21,0.18)',
  4: 'rgba(74,222,128,0.18)',
  5: 'rgba(52,211,153,0.18)',
};

const DIM_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#60a5fa',
  2: '#34d399',
  3: '#f59e0b',
  4: '#a78bfa',
  5: '#f472b6',
};

export default function SatisfactionSurveyPage() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const { colors } = useTheme();

  const [responses, setResponses] = useState<Record<string, 1 | 2 | 3 | 4 | 5>>({});
  const [submitted, setSubmitted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [overallScore, setOverallScore] = useState(0);
  const [showMissing, setShowMissing] = useState(false);

  const totalQ = SURVEY_QUESTIONS.length;
  const answered = Object.keys(responses).length;

  useEffect(() => {
    if (!player) return;
    getResearchSurvey(player.id).then((s) => {
      if (s) setAlreadyDone(true);
    }).catch(() => {});
  }, [player]);

  const handleSelect = (qId: string, val: 1 | 2 | 3 | 4 | 5) => {
    if (submitted) return;
    setResponses((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (answered < totalQ) {
      setShowMissing(true);
      const firstMissing = SURVEY_QUESTIONS.find((q) => responses[q.id] === undefined);
      if (firstMissing) {
        const el = document.getElementById(`sq-${firstMissing.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setError(`กรุณาตอบให้ครบทุกข้อ (ยังขาดอีก ${totalQ - answered} ข้อ)`);
      return;
    }
    if (!player) return;
    setSaving(true);
    setError('');
    try {
      const result = scoreSurveyResponses(responses, player.classroomCode);
      await saveResearchSurvey(player.id, result);
      setOverallScore(result.scores.overall);
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
          <h2 style={{ color: colors.text, marginBottom: 8 }}>ท่านทำแบบสอบถามเรียบร้อยแล้ว</h2>
          <p style={{ color: colors.textMuted, marginBottom: 24 }}>ขอบคุณสำหรับความคิดเห็น</p>
          <button onClick={() => navigate('/')}
            style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 16, cursor: 'pointer' }}>
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // ─── Result screen ────────────────────────────────────────────
  if (submitted) {
    const scoreColor = overallScore >= 4.51 ? '#34d399' : overallScore >= 3.51 ? '#4ade80' : overallScore >= 2.51 ? '#facc15' : '#fb923c';
    return (
      <div style={{ minHeight: '100vh', background: colors.bgGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 40, maxWidth: 480, textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>🙏</p>
          <h2 style={{ color: colors.text, marginBottom: 8 }}>ขอบคุณสำหรับความคิดเห็น!</h2>
          <p style={{ color: colors.textMuted, marginBottom: 12 }}>คะแนนความพึงพอใจเฉลี่ย</p>
          <p style={{ color: scoreColor, fontSize: 48, fontWeight: 800, marginBottom: 4, lineHeight: 1 }}>
            {overallScore.toFixed(2)}
          </p>
          <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 24 }}>จาก 5.00</p>
          <button onClick={() => navigate('/')}
            style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 16, cursor: 'pointer' }}>
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // ─── Survey form ──────────────────────────────────────────────
  const dimensions = [1, 2, 3, 4, 5] as const;

  return (
    <div style={{ minHeight: '100vh', background: colors.bgGrad, padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ maxWidth: 820, margin: '0 auto 20px' }}>
        <h1 style={{ color: colors.text, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          แบบสอบถามความพึงพอใจ
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 10 }}>
          {answered}/{totalQ} ข้อ — เลือกระดับ 1 (น้อยที่สุด) ถึง 5 (มากที่สุด)
        </p>
        <div style={{ height: 6, borderRadius: 3, background: colors.border }}>
          <div style={{ height: 6, borderRadius: 3, background: '#7c3aed', width: `${(answered / totalQ) * 100}%`, transition: 'width 0.2s' }} />
        </div>
      </div>

      {/* Likert scale legend */}
      <div style={{ maxWidth: 820, margin: '0 auto 16px', display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {LIKERT_KEYS.map((k) => (
          <div key={k} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6,
            background: LIKERT_BG[k], border: `1px solid ${LIKERT_COLORS[k]}44`,
          }}>
            <span style={{ color: LIKERT_COLORS[k], fontWeight: 800, fontSize: 13 }}>{k}</span>
            <span style={{ color: colors.textMuted, fontSize: 10 }}>{LIKERT_LABELS[k]}</span>
          </div>
        ))}
      </div>

      {/* Questions by dimension */}
      <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {dimensions.map((dim) => {
          const dimQs = SURVEY_QUESTIONS.filter((q) => q.dimension === dim);
          const dimColor = DIM_COLORS[dim];
          const dimAnswered = dimQs.filter((q) => responses[q.id] !== undefined).length;
          return (
            <div key={dim}>
              {/* Dimension header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 4, height: 20, borderRadius: 2, background: dimColor, flexShrink: 0 }} />
                <h3 style={{ color: dimColor, fontSize: 14, fontWeight: 700, margin: 0 }}>
                  มิติที่ {dim} — {DIMENSION_LABELS[dim]}
                </h3>
                <span style={{ color: colors.textMuted, fontSize: 11, marginLeft: 'auto' }}>{dimAnswered}/{dimQs.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dimQs.map((q, idx) => {
                  const chosen = responses[q.id];
                  const isMissing = showMissing && chosen === undefined;
                  return (
                    <div id={`sq-${q.id}`} key={q.id} style={{
                      background: colors.bgCard,
                      border: `1px solid ${isMissing ? '#ef4444' : chosen !== undefined ? LIKERT_COLORS[chosen] + '66' : colors.border}`,
                      borderRadius: 12, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      boxShadow: isMissing ? '0 0 0 1px #ef444455' : chosen !== undefined ? `0 0 0 1px ${LIKERT_COLORS[chosen]}33` : 'none',
                    }}>
                      {/* Question text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: colors.textMuted, fontSize: 11, marginRight: 6 }}>
                          {(dim - 1) * 4 + idx + 1}.
                        </span>
                        <span style={{ color: colors.text, fontSize: 14 }}>{q.text}</span>
                        {isMissing && <span style={{ marginLeft: 8, fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700 }}>ยังไม่ตอบ</span>}
                      </div>

                      {/* Likert buttons */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {LIKERT_KEYS.map((k) => {
                          const isChosen = chosen === k;
                          return (
                            <button
                              key={k}
                              onClick={() => handleSelect(q.id, k)}
                              title={LIKERT_LABELS[k]}
                              style={{
                                width: 46, height: 46, borderRadius: 10,
                                border: isChosen
                                  ? `2px solid ${LIKERT_COLORS[k]}`
                                  : `1px solid ${colors.border}`,
                                background: isChosen ? LIKERT_BG[k] : 'transparent',
                                color: isChosen ? LIKERT_COLORS[k] : colors.textMuted,
                                fontSize: 17, fontWeight: 800, cursor: 'pointer',
                                transition: 'all 0.12s',
                                transform: isChosen ? 'scale(1.12)' : 'scale(1)',
                                boxShadow: isChosen ? `0 0 8px ${LIKERT_COLORS[k]}55` : 'none',
                              }}
                            >
                              {k}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 820, margin: '24px auto 48px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        {error && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: '#7c3aed',
            color: '#fff',
            border: '2px solid #7c3aed',
            borderRadius: 12, padding: '14px 40px', fontSize: 16,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'กำลังบันทึก...' : answered < totalQ ? `ส่งแบบสอบถาม (ตอบแล้ว ${answered}/${totalQ})` : `ส่งแบบสอบถาม ✓`}
        </button>
      </div>
    </div>
  );
}
