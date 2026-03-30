/**
 * researchService.ts
 * CRUD สำหรับ Pretest / Posttest และแบบสอบถามความพึงพอใจ
 *
 * Collections:
 *   research_tests/{uid}   — { pretest?: ResearchTestResult, posttest?: ResearchTestResult }
 *   research_surveys/{uid} — ResearchSurveyResult
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseService';
import type {
  ResearchTestResult,
  ResearchTests,
  ResearchSurveyResult,
} from '../types/game.types';

// ──────────────────────────────────────────────
// Pretest / Posttest
// ──────────────────────────────────────────────

/** โหลดผลสอบของ user (ทั้ง pre และ post ถ้ามี) */
export async function getResearchTests(uid: string): Promise<ResearchTests> {
  const snap = await getDoc(doc(db, 'research_tests', uid));
  if (!snap.exists()) return {};
  return snap.data() as ResearchTests;
}

/** บันทึกผล pretest (เขียนครั้งเดียว — ถ้ามีแล้วจะ reject) */
export async function savePretest(uid: string, result: ResearchTestResult): Promise<void> {
  const snap = await getDoc(doc(db, 'research_tests', uid));
  if (snap.exists() && snap.data().pretest) {
    throw new Error('pretest ถูกบันทึกแล้ว ไม่สามารถทำซ้ำได้');
  }
  await setDoc(doc(db, 'research_tests', uid), { pretest: result }, { merge: true });
}

/** บันทึกผล posttest (เขียนครั้งเดียว — ถ้ามีแล้วจะ reject) */
export async function savePosttest(uid: string, result: ResearchTestResult): Promise<void> {
  const snap = await getDoc(doc(db, 'research_tests', uid));
  if (snap.exists() && snap.data().posttest) {
    throw new Error('posttest ถูกบันทึกแล้ว ไม่สามารถทำซ้ำได้');
  }
  await setDoc(doc(db, 'research_tests', uid), { posttest: result }, { merge: true });
}

// ──────────────────────────────────────────────
// แบบสอบถามความพึงพอใจ
// ──────────────────────────────────────────────

/** โหลดผล survey ของ user */
export async function getResearchSurvey(uid: string): Promise<ResearchSurveyResult | null> {
  const snap = await getDoc(doc(db, 'research_surveys', uid));
  if (!snap.exists()) return null;
  return snap.data() as ResearchSurveyResult;
}

/** บันทึกผล survey (เขียนครั้งเดียว — ถ้ามีแล้วจะ reject) */
export async function saveResearchSurvey(uid: string, result: ResearchSurveyResult): Promise<void> {
  const snap = await getDoc(doc(db, 'research_surveys', uid));
  if (snap.exists()) {
    throw new Error('แบบสอบถามถูกบันทึกแล้ว ไม่สามารถทำซ้ำได้');
  }
  await setDoc(doc(db, 'research_surveys', uid), result);
}

// ──────────────────────────────────────────────
// Helper — คำนวณคะแนนจาก answers
// ──────────────────────────────────────────────

import { RESEARCH_QUESTIONS } from '../utils/researchQuestions';
import { SURVEY_QUESTIONS } from '../utils/surveyQuestions';

/** คำนวณคะแนน MCQ จาก answers map → ResearchTestResult (ไม่รวม timestamps/classroomCode) */
export function scoreTestAnswers(
  answers: Record<string, 'a' | 'b' | 'c' | 'd'>,
  classroomCode?: string,
): ResearchTestResult {
  let sequence = 0, decision = 0, loop = 0;
  for (const q of RESEARCH_QUESTIONS) {
    if (answers[q.id] === q.answer) {
      if (q.category === 'sequence') sequence++;
      else if (q.category === 'decision') decision++;
      else loop++;
    }
  }
  return {
    answers,
    score: sequence + decision + loop,
    scoreByCategory: { sequence, decision, loop },
    completedAt: Date.now(),
    classroomCode,
  };
}

/** คำนวณ dimension scores จาก Likert responses map → SurveyDimensionScores */
export function scoreSurveyResponses(
  responses: Record<string, 1 | 2 | 3 | 4 | 5>,
  classroomCode?: string,
): ResearchSurveyResult {
  const dimSums: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const dimCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const q of SURVEY_QUESTIONS) {
    const val = responses[q.id];
    if (val !== undefined) {
      dimSums[q.dimension] += val;
      dimCounts[q.dimension]++;
    }
  }

  const mean = (d: number) =>
    dimCounts[d] > 0 ? Math.round((dimSums[d] / dimCounts[d]) * 100) / 100 : 0;

  const dim1 = mean(1), dim2 = mean(2), dim3 = mean(3), dim4 = mean(4), dim5 = mean(5);
  const overall = Math.round(((dim1 + dim2 + dim3 + dim4 + dim5) / 5) * 100) / 100;

  return {
    responses,
    scores: { dim1, dim2, dim3, dim4, dim5, overall },
    completedAt: Date.now(),
    classroomCode,
  };
}
