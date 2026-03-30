/**
 * researchQuestions.ts
 * แบบทดสอบวัดผลสัมฤทธิ์ (Pre-test / Post-test)
 * 20 ข้อ MCQ 4 ตัวเลือก
 *
 * โครงสร้างตามงานวิจัย:
 *   - Sequence  : ข้อ 1–5   (5 ข้อ)
 *   - Decision  : ข้อ 6–13  (8 ข้อ)
 *   - Loop/While: ข้อ 14–20 (7 ข้อ)
 *
 * ที่มา: ภาคผนวก ก แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน
 * ผ่านการตรวจสอบความตรงเชิงเนื้อหา IOC = 0.67–1.00, Cronbach's α = 0.81
 */

import type { MCQQuestion } from '../types/game.types';

export const RESEARCH_QUESTIONS: MCQQuestion[] = [
  // ─── Sequence (ข้อ 1–5) ───────────────────────────────────────────────
  {
    id: 'q1',
    category: 'sequence',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  HP = 100\n  HP = HP - 20\n  แสดงผล HP\nค่า HP ที่แสดงผลคืออะไร?',
    options: [
      { key: 'a', text: '20' },
      { key: 'b', text: '80' },
      { key: 'c', text: '100' },
      { key: 'd', text: '120' },
    ],
    answer: 'b',
  },
  {
    id: 'q2',
    category: 'sequence',
    question:
      'นักเรียนต้องการให้ Hero ทำตามลำดับ: โจมตีก่อน แล้วจึงฟื้นพลังชีวิต\nFlowchart ใดแสดงลำดับที่ถูกต้อง?',
    options: [
      { key: 'a', text: 'Heal → Attack' },
      { key: 'b', text: 'Attack → Heal' },
      { key: 'c', text: 'Dodge → Attack' },
      { key: 'd', text: 'Attack → Dodge' },
    ],
    answer: 'b',
  },
  {
    id: 'q3',
    category: 'sequence',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  HP = 50\n  HP = HP + 20\n  HP = HP - 10\n  แสดงผล HP\nค่า HP สุดท้ายคืออะไร?',
    options: [
      { key: 'a', text: '50' },
      { key: 'b', text: '60' },
      { key: 'c', text: '70' },
      { key: 'd', text: '40' },
    ],
    answer: 'b',
  },
  {
    id: 'q4',
    category: 'sequence',
    question:
      'นักเรียนต้องการให้ Hero โจมตี 3 ครั้งติดต่อกันโดยไม่มีเงื่อนไขใดๆ\nควรใช้บล็อกคำสั่งประเภทใดในการออกแบบ Flowchart?',
    options: [
      { key: 'a', text: 'Condition Block (If/Else)' },
      { key: 'b', text: 'While Loop Block' },
      { key: 'c', text: 'Action Block (Attack) วางเรียงต่อกัน 3 บล็อก' },
      { key: 'd', text: 'Counter Block' },
    ],
    answer: 'c',
  },
  {
    id: 'q5',
    category: 'sequence',
    question:
      'Flowchart มีลำดับดังนี้\n  Start → Attack → Heal → Dodge → End\nHero จะทำกิจกรรมใดเป็นลำดับที่ 2?',
    options: [
      { key: 'a', text: 'Attack' },
      { key: 'b', text: 'Heal' },
      { key: 'c', text: 'Dodge' },
      { key: 'd', text: 'End' },
    ],
    answer: 'b',
  },

  // ─── Decision / If-Else (ข้อ 6–13) ───────────────────────────────────
  {
    id: 'q6',
    category: 'decision',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  ถ้า HP < 50:\n    Heal\n  มิฉะนั้น:\n    Attack\nถ้า HP = 30 Hero จะทำอะไร?',
    options: [
      { key: 'a', text: 'Attack' },
      { key: 'b', text: 'Heal' },
      { key: 'c', text: 'Dodge' },
      { key: 'd', text: 'ไม่ทำอะไร' },
    ],
    answer: 'b',
  },
  {
    id: 'q7',
    category: 'decision',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  ถ้า HP < 50:\n    Heal\n  มิฉะนั้น:\n    Attack\nถ้า HP = 70 Hero จะทำอะไร?',
    options: [
      { key: 'a', text: 'Heal' },
      { key: 'b', text: 'Dodge' },
      { key: 'c', text: 'Attack' },
      { key: 'd', text: 'ไม่ทำอะไร' },
    ],
    answer: 'c',
  },
  {
    id: 'q8',
    category: 'decision',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  ถ้า HP > 50:\n    Attack\n  มิฉะนั้น:\n    Heal\nถ้า HP = 50 Hero จะทำอะไร?\n(หมายเหตุ: 50 > 50 เป็นเท็จ)',
    options: [
      { key: 'a', text: 'Attack' },
      { key: 'b', text: 'Heal' },
      { key: 'c', text: 'ทั้ง Attack และ Heal' },
      { key: 'd', text: 'ไม่ทำอะไร' },
    ],
    answer: 'b',
  },
  {
    id: 'q9',
    category: 'decision',
    question:
      'นักเรียนต้องการให้ Hero "Heal ถ้า HP ต่ำกว่า 30 ไม่เช่นนั้นให้ Attack"\nบล็อกหลักที่ต้องใช้ในการออกแบบ Flowchart คือบล็อกใด?',
    options: [
      { key: 'a', text: 'While Loop Block' },
      { key: 'b', text: 'Action Block (Sequence) เท่านั้น' },
      { key: 'c', text: 'Condition Block (If/Else)' },
      { key: 'd', text: 'Counter Block' },
    ],
    answer: 'c',
  },
  {
    id: 'q10',
    category: 'decision',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  ถ้า HP < 50:\n    ถ้า HP < 20:\n      Heal\n    มิฉะนั้น:\n      Dodge\n  มิฉะนั้น:\n    Attack\nถ้า HP = 15 Hero จะทำอะไร?',
    options: [
      { key: 'a', text: 'Attack' },
      { key: 'b', text: 'Dodge' },
      { key: 'c', text: 'Heal' },
      { key: 'd', text: 'ไม่ทำอะไร' },
    ],
    answer: 'c',
  },
  {
    id: 'q11',
    category: 'decision',
    question:
      'พิจารณา Pseudocode เดิมจากข้อ 10\n  ถ้า HP < 50:\n    ถ้า HP < 20:\n      Heal\n    มิฉะนั้น:\n      Dodge\n  มิฉะนั้น:\n    Attack\nถ้า HP = 35 Hero จะทำอะไร?',
    options: [
      { key: 'a', text: 'Attack' },
      { key: 'b', text: 'Dodge' },
      { key: 'c', text: 'Heal' },
      { key: 'd', text: 'ไม่ทำอะไร' },
    ],
    answer: 'b',
  },
  {
    id: 'q12',
    category: 'decision',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  ถ้า Hero ถูกสถานะ Poison:\n    ใช้ Antidote\n  มิฉะนั้น:\n    Attack\nถ้า Hero ไม่ได้รับสถานะ Poison Hero จะทำอะไร?',
    options: [
      { key: 'a', text: 'ใช้ Antidote' },
      { key: 'b', text: 'Heal' },
      { key: 'c', text: 'Attack' },
      { key: 'd', text: 'Dodge' },
    ],
    answer: 'c',
  },
  {
    id: 'q13',
    category: 'decision',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  ถ้า Turn >= 3:\n    Power Strike\n  มิฉะนั้น:\n    Attack\nใน Turn ที่ 2 Hero จะทำอะไร?',
    options: [
      { key: 'a', text: 'Power Strike' },
      { key: 'b', text: 'Heal' },
      { key: 'c', text: 'Attack' },
      { key: 'd', text: 'ไม่ทำอะไร' },
    ],
    answer: 'c',
  },

  // ─── Loop / While (ข้อ 14–20) ─────────────────────────────────────────
  {
    id: 'q14',
    category: 'loop',
    question: 'While Loop จะหยุดทำงานเมื่อใด?',
    options: [
      { key: 'a', text: 'เมื่อวนซ้ำครบ 10 รอบ' },
      { key: 'b', text: 'เมื่อเงื่อนไขเป็นเท็จ (False)' },
      { key: 'c', text: 'เมื่อวนซ้ำครบ 1 รอบ' },
      { key: 'd', text: 'Loop หยุดได้เองโดยอัตโนมัติเสมอ' },
    ],
    answer: 'b',
  },
  {
    id: 'q15',
    category: 'loop',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  i = 1\n  ขณะที่ i <= 3:\n    Attack\n    i = i + 1\nHero จะโจมตีกี่ครั้ง?',
    options: [
      { key: 'a', text: '2 ครั้ง' },
      { key: 'b', text: '3 ครั้ง' },
      { key: 'c', text: '4 ครั้ง' },
      { key: 'd', text: '1 ครั้ง' },
    ],
    answer: 'b',
  },
  {
    id: 'q16',
    category: 'loop',
    question:
      'นักเรียนต้องการให้ Hero "โจมตีซ้ำไปเรื่อยๆ จนกว่าศัตรูจะตาย"\nควรใช้บล็อกคำสั่งใด?',
    options: [
      { key: 'a', text: 'Condition Block เพียงอย่างเดียว' },
      { key: 'b', text: 'Action Block (Attack) วางเรียงกัน 5 บล็อก' },
      { key: 'c', text: 'While Loop Block' },
      { key: 'd', text: 'Sequence Block เท่านั้น' },
    ],
    answer: 'c',
  },
  {
    id: 'q17',
    category: 'loop',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  HP = 100\n  ขณะที่ HP > 40:\n    HP = HP - 25\nLoop วนซ้ำกี่รอบ?\n(100 → 75 → 50 → 25 หยุดเพราะ 25 ≤ 40)',
    options: [
      { key: 'a', text: '2 รอบ' },
      { key: 'b', text: '3 รอบ' },
      { key: 'c', text: '4 รอบ' },
      { key: 'd', text: 'วนซ้ำไม่มีที่สิ้นสุด' },
    ],
    answer: 'b',
  },
  {
    id: 'q18',
    category: 'loop',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  turn = 1\n  ขณะที่ turn <= 4:\n    Attack\n    turn = turn + 1\nHero จะโจมตีกี่ครั้ง?',
    options: [
      { key: 'a', text: '3 ครั้ง' },
      { key: 'b', text: '4 ครั้ง' },
      { key: 'c', text: '5 ครั้ง' },
      { key: 'd', text: 'วนซ้ำไม่มีที่สิ้นสุด' },
    ],
    answer: 'b',
  },
  {
    id: 'q19',
    category: 'loop',
    question:
      'Flowchart มีเงื่อนไข "ทำซ้ำตราบที่ศัตรูยังมีชีวิต" แต่ภายใน Loop ไม่มีการโจมตีศัตรูเลย\nจะเกิดอะไรขึ้น?',
    options: [
      { key: 'a', text: 'Hero ชนะทันที' },
      { key: 'b', text: 'Loop ทำงานแค่ 1 ครั้งแล้วหยุด' },
      { key: 'c', text: 'Loop วนซ้ำไม่มีที่สิ้นสุด (Infinite Loop)' },
      { key: 'd', text: 'Flowchart ออกไปที่ End ทันที' },
    ],
    answer: 'c',
  },
  {
    id: 'q20',
    category: 'loop',
    question:
      'พิจารณา Pseudocode ต่อไปนี้\n  ขณะที่ Enemy ยังมีชีวิต:\n    ถ้า HP < 30:\n      Heal\n    มิฉะนั้น:\n      Attack\nถ้า HP = 20 และ Enemy ยังมีชีวิต Hero จะทำอะไรใน รอบแรก?',
    options: [
      { key: 'a', text: 'Attack' },
      { key: 'b', text: 'Dodge' },
      { key: 'c', text: 'Heal' },
      { key: 'd', text: 'ออกจาก Loop ทันที' },
    ],
    answer: 'c',
  },
];

/** หมวดหมู่คำถามตามงานวิจัย */
export const QUESTION_CATEGORIES = {
  sequence: RESEARCH_QUESTIONS.filter(q => q.category === 'sequence'),
  decision: RESEARCH_QUESTIONS.filter(q => q.category === 'decision'),
  loop: RESEARCH_QUESTIONS.filter(q => q.category === 'loop'),
} as const;
