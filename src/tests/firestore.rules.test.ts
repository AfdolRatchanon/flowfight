/**
 * Firestore Security Rules Tests
 *
 * ต้องรัน Firebase Emulator ก่อน:
 *   firebase emulators:start --only firestore
 *
 * แล้วรัน test:
 *   npm run test:rules
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { describe, it, beforeAll, afterAll, afterEach } from 'vitest';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const RULES = readFileSync('firestore.rules', 'utf8');

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'flowfight-test',
    firestore: { rules: RULES, host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ===== ตัวอย่าง payload ที่ถูกต้อง =====
const validLevelboardPayload = {
  levelId: 'level_1', levelNumber: 1,
  playerId: 'user-a', won: true,
  playerName: 'TestUser', characterName: 'Hero',
  characterClass: 'knight', characterLevel: 5,
  timeMs: 30000, damageDealt: 100, damageTaken: 20,
  heroHPRemaining: 80, heroHPPercent: 80,
  timestamp: Date.now(),
};

// ===== Users collection =====
describe('users/{userId}', () => {
  it('เจ้าของอ่านข้อมูลตัวเองได้', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    // seed data ก่อน
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/user-a'), { id: 'user-a', username: 'A' });
    });
    await assertSucceeds(getDoc(doc(db, 'users/user-a')));
  });

  it('user อื่นอ่านไม่ได้เมื่อ unauthenticated', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/user-a')));
  });

  it('user เขียนข้อมูลตัวเองได้', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users/user-a'), {
        id: 'user-a', username: 'A', email: 'a@test.com',
        levelsCompleted: [], levelClearCounts: {},
        gold: 150, stats: {}, lastActive: Date.now(), createdAt: Date.now(),
        dailyFarm: {},
      })
    );
  });

  it('user เขียนข้อมูลคนอื่นไม่ได้', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertFails(
      setDoc(doc(db, 'users/user-b'), { id: 'user-b', username: 'B' })
    );
  });
});

// ===== levelboards collection =====
describe('levelboards/{docId}', () => {
  it('เขียน record ของตัวเองได้', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'levelboards/level_1_user-a'), validLevelboardPayload)
    );
  });

  it('เขียน record แทนคนอื่นไม่ได้ (playerId ≠ uid)', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertFails(
      setDoc(doc(db, 'levelboards/level_1_user-b'), {
        ...validLevelboardPayload,
        playerId: 'user-b', // UID คนอื่น
      })
    );
  });

  it('เขียน won: false ไม่ได้ (rules บังคับ won == true)', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertFails(
      setDoc(doc(db, 'levelboards/level_1_user-a'), {
        ...validLevelboardPayload,
        won: false,
      })
    );
  });

  it('เขียน timeMs เกิน 1 ชั่วโมงไม่ได้', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertFails(
      setDoc(doc(db, 'levelboards/level_1_user-a'), {
        ...validLevelboardPayload,
        timeMs: 9999999, // เกิน 3,600,000 ms
      })
    );
  });

  it('เขียน characterLevel เกิน 10 ไม่ได้', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertFails(
      setDoc(doc(db, 'levelboards/level_1_user-a'), {
        ...validLevelboardPayload,
        characterLevel: 99,
      })
    );
  });

  it('unauthenticated เขียนไม่ได้', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, 'levelboards/level_1_user-a'), validLevelboardPayload)
    );
  });
});

// ===== leaderboards collection =====
describe('leaderboards/{playerId}', () => {
  it('เขียน leaderboard ตัวเองได้', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'leaderboards/user-a'), {
        playerId: 'user-a', username: 'A',
        characterName: 'Hero', characterClass: 'knight', characterLevel: 5,
        totalWins: 10, totalDamage: 500, totalBattleTime: 12000,
        levelsCompleted: ['level_1'],
        endlessHighScore: 100, endlessHighWave: 5,
        lastUpdated: Date.now(),
      })
    );
  });

  it('endlessHighScore เกิน 999999 ไม่ได้', async () => {
    const db = testEnv.authenticatedContext('user-a').firestore();
    await assertFails(
      setDoc(doc(db, 'leaderboards/user-a'), {
        playerId: 'user-a', username: 'A',
        characterName: 'Hero', characterClass: 'knight', characterLevel: 5,
        totalWins: 10, totalDamage: 500, totalBattleTime: 12000,
        levelsCompleted: [],
        endlessHighScore: 9999999, // โกง!
        endlessHighWave: 5,
        lastUpdated: Date.now(),
      })
    );
  });
});
