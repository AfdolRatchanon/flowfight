import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseService';
import type { Player, Character } from '../types/game.types';
import { LEVELS } from '../utils/constants';

export interface LevelBattleStats {
  levelId: string;
  levelNumber: number;
  damageDealt: number;
  damageTaken: number;
  timeMs: number;
  heroHPRemaining: number;
  heroMaxHP: number;
}

const googleProvider = new GoogleAuthProvider();

export async function registerWithEmail(email: string, password: string, username: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: username });
  await createPlayerProfile(userCredential.user, { username, email });
  return userCredential.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const isNew = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
  if (isNew) {
    await createPlayerProfile(result.user, {
      username: result.user.displayName ?? 'Player',
      email: result.user.email ?? '',
    });
  }
  return result.user;
}

export async function loginAnonymous(firstName: string, surname: string): Promise<User> {
  const fn = firstName.trim();
  const sn = surname.trim();
  if (!fn || fn.length > 50) throw new Error('ชื่อต้องมี 1-50 ตัวอักษร');
  if (!sn || sn.length > 50) throw new Error('นามสกุลต้องมี 1-50 ตัวอักษร');
  const result = await signInAnonymously(auth);
  const displayName = `${fn} ${sn}`;
  await updateProfile(result.user, { displayName });
  await createPlayerProfile(result.user, { username: displayName, firstName: fn, surname: sn, email: '', isAnonymous: true });
  return result.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

interface ProfileFields {
  username: string;
  firstName?: string;
  surname?: string;
  email?: string;
  isAnonymous?: boolean;
}

export async function ensurePlayerProfile(user: User, fields: ProfileFields): Promise<void> {
  return createPlayerProfile(user, fields);
}

async function createPlayerProfile(user: User, fields: ProfileFields): Promise<void> {
  const playerRef = doc(db, 'users', user.uid);
  const existing = await getDoc(playerRef);
  if (existing.exists()) return;

  const player: Omit<Player, 'id'> = {
    username: fields.username,
    firstName: fields.firstName,
    surname: fields.surname,
    email: fields.email ?? user.email ?? '',
    isAnonymous: fields.isAnonymous ?? false,
    levelsCompleted: [],
    gold: 150,
    purchasedEquipment: [],
    createdAt: Date.now(),
    lastActive: Date.now(),
    stats: { totalKills: 0, totalDefeats: 0, levelReached: 1, totalPlayTime: 0 },
    preferences: { difficulty: 'normal', soundEnabled: true, musicVolume: 0.7, sfxVolume: 0.8 },
  };
  await setDoc(playerRef, { ...player, createdAt: serverTimestamp() });
}

export async function getPlayerProfile(uid: string): Promise<Player | null> {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, levelsCompleted: [], ...snap.data() } as unknown as Player;
  }
  return null;
}

export async function savePlayerProgress(uid: string, levelId: string, won: boolean, username?: string, score?: number): Promise<Player | null> {
  // Validate levelId against known levels to prevent arbitrary data injection
  const isKnownLevel = LEVELS.some((l) => l.id === levelId) || levelId === 'endless';
  if (!isKnownLevel) throw new Error(`Invalid levelId: ${levelId}`);

  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  // ถ้า doc ยังไม่มีใน Firestore ให้ upsert แทนที่จะ return null
  const data: Partial<Player> = snap.exists() ? (snap.data() as Player) : {};
  const levelsCompleted: string[] = [...((data.levelsCompleted ?? []) as string[])];
  if (won && !levelsCompleted.includes(levelId)) levelsCompleted.push(levelId);

  // Increment clear count per level (ใช้สำหรับ diminishing returns)
  const levelClearCounts: Record<string, number> = { ...((data.levelClearCounts ?? {}) as Record<string, number>) };
  if (won) levelClearCounts[levelId] = (levelClearCounts[levelId] ?? 0) + 1;

  const levelNumber = parseInt(levelId.replace('level_', '')) || 1;
  const prevStats = data.stats ?? { totalKills: 0, totalDefeats: 0, levelReached: 1, totalPlayTime: 0 };
  const newStats = {
    totalKills: (prevStats.totalKills ?? 0) + (won ? 1 : 0),
    totalDefeats: (prevStats.totalDefeats ?? 0) + (won ? 0 : 1),
    levelReached: Math.max(prevStats.levelReached ?? 1, levelNumber + (won ? 1 : 0)),
    totalPlayTime: prevStats.totalPlayTime ?? 0,
  };

  // Auto-grading: เก็บ best score ต่อด่าน (ไม่ overwrite ถ้า score ใหม่ต่ำกว่าเดิม)
  const prevScores: Record<string, number> = { ...((data.levelScores ?? {}) as Record<string, number>) };
  if (won && score !== undefined) {
    prevScores[levelId] = Math.max(prevScores[levelId] ?? 0, score);
  }

  const payload: Record<string, unknown> = { levelsCompleted, levelClearCounts, stats: newStats, levelScores: prevScores, lastActive: Date.now() };
  if (username) payload.username = username;

  await setDoc(ref, payload, { merge: true });

  return { ...data, id: uid, levelsCompleted, levelClearCounts, stats: newStats, levelScores: prevScores } as Player;
}

export async function saveCharacterProgress(uid: string, character: Character): Promise<void> {
  const ref = doc(db, 'users', uid);
  // ใช้ setDoc + merge:true เพื่อสร้าง document ถ้าไม่มี และ merge ถ้ามีแล้ว
  // (updateDoc จะ throw ถ้า document ยังไม่ถูกสร้าง → ทำให้ character ไม่ถูก save)
  await setDoc(ref, {
    characterProgress: {
      [character.class]: {
        level: character.level,
        experience: character.experience,
        maxHP: character.stats.maxHP,
        attack: character.stats.attack,
        defense: character.stats.defense,
        speed: character.stats.speed,
        class: character.class,
        name: character.name,
      },
    },
    lastPlayedClass: character.class,
  }, { merge: true });
}

export async function saveEndlessProgress(uid: string, score: number, wave: number): Promise<{ highScore: number; highWave: number }> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? (snap.data() as Partial<Player>) : {};
  const prevScore = data.endlessHighScore ?? 0;
  const prevWave  = data.endlessHighWave  ?? 0;
  const highScore = Math.max(prevScore, score);
  const highWave  = Math.max(prevWave,  wave);
  if (highScore > prevScore || highWave > prevWave) {
    await setDoc(ref, { endlessHighScore: highScore, endlessHighWave: highWave }, { merge: true });
  }
  return { highScore, highWave };
}

export async function saveShopData(
  uid: string,
  gold: number,
  purchasedEquipment: string[],
  lastRestockTime?: number,
  potions?: number,
  antidotes?: number,
  attackBonus?: number,
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const payload: Record<string, unknown> = { gold, purchasedEquipment };
  if (lastRestockTime !== undefined) payload.lastRestockTime = lastRestockTime;
  if (potions         !== undefined) payload.potions         = potions;
  if (antidotes       !== undefined) payload.antidotes       = antidotes;
  if (attackBonus     !== undefined) payload.attackBonus     = attackBonus;
  await setDoc(ref, payload, { merge: true });
}

export async function saveEquippedItems(
  uid: string,
  cls: string,
  items: { weapon: string | null; armor: string | null; head: string | null; accessory: string | null },
): Promise<void> {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    characterProgress: {
      [cls]: { equippedItems: items },
    },
  }, { merge: true });
}

export async function saveLeaderboardEntry(
  player: Player,
  character: Character,
  battleStats?: LevelBattleStats,
  isFirstClear = false,
): Promise<void> {
  const ref = doc(db, 'leaderboards', player.id);
  const totalCampaignLevels = LEVELS.length;

  const firstLevelId = LEVELS[0].id;
  const lastLevelId  = LEVELS[LEVELS.length - 1].id;
  const now = Date.now();

  // อ่านค่าเดิมก่อน เพื่อสะสม totalDamage/totalTime และ speedrun timestamps
  let prevDealt = 0, prevTaken = 0, prevTime = 0;
  let prevCampaignStartedAt: number | undefined;
  let prevCampaignClearedAt: number | undefined;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      prevDealt = snap.data().totalDamageDealt ?? 0;
      prevTaken = snap.data().totalDamageTaken ?? 0;
      prevTime  = snap.data().totalPlayTime ?? 0;
      prevCampaignStartedAt = snap.data().campaignStartedAt;
      prevCampaignClearedAt = snap.data().campaignClearedAt;
    }
  } catch { /* ถ้าอ่านไม่ได้ให้ใช้ 0 */ }

  // จับเวลาจริง: เริ่มนับตอน first clear level_1, หยุดนับตอน first clear level สุดท้าย
  const isFirstLevel = battleStats?.levelId === firstLevelId;
  const isLastLevel  = battleStats?.levelId === lastLevelId;

  const campaignStartedAt = (!prevCampaignStartedAt && isFirstClear && isFirstLevel)
    ? now
    : prevCampaignStartedAt;

  const newLevelsCompleted = (player.levelsCompleted ?? []).length;
  const justFinishedCampaign = isFirstClear && isLastLevel
    && newLevelsCompleted >= totalCampaignLevels
    && !prevCampaignClearedAt;

  const campaignClearedAt  = justFinishedCampaign ? now : prevCampaignClearedAt;
  // เวลาจริง = campaignClearedAt - campaignStartedAt (ms)
  const campaignTotalTimeMs = (campaignClearedAt && campaignStartedAt)
    ? campaignClearedAt - campaignStartedAt
    : undefined;

  const payload: Record<string, unknown> = {
    playerId: player.id,
    playerName: player.username ?? player.email ?? 'Unknown',
    characterName: character.name ?? 'Unknown',
    characterClass: character.class ?? 'knight',
    characterLevel: character.level ?? 1,
    experience: character.experience ?? 0,
    levelReached: player.stats?.levelReached ?? 1,
    levelsCompleted: newLevelsCompleted,
    totalKills: player.stats?.totalKills ?? 0,
    totalPlayTime: prevTime + (battleStats?.timeMs ?? 0),
    totalDamageDealt: prevDealt + (battleStats?.damageDealt ?? 0),
    totalDamageTaken: prevTaken + (battleStats?.damageTaken ?? 0),
    gameMode: 'normal',
    lastUpdated: now,
  };
  if (campaignStartedAt)   payload.campaignStartedAt   = campaignStartedAt;
  if (campaignClearedAt)   payload.campaignClearedAt   = campaignClearedAt;
  if (campaignTotalTimeMs) payload.campaignTotalTimeMs = campaignTotalTimeMs;

  await setDoc(ref, payload);
}

export async function saveLevelLeaderboardEntry(
  player: Player,
  character: Character,
  stats: LevelBattleStats,
): Promise<void> {
  // key = levelId_playerId (1 record ต่อ player ต่อด่าน — เก็บแค่สถิติดีสุดล่าสุด)
  const docId = `${stats.levelId}_${player.id}`;
  const ref = doc(db, 'levelboards', docId);

  // เช็คว่ามีของเก่าไหม ถ้ามีให้เก็บแค่ค่าที่ดีกว่า
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const prev = snap.data();
      // เก็บ damageTaken น้อยสุด, damageDealt มากสุด, timeMs น้อยสุด, heroHPPercent มากสุด
      const newTaken = Math.min(stats.damageTaken, prev.damageTaken ?? Infinity);
      const newDealt = Math.max(stats.damageDealt, prev.damageDealt ?? 0);
      const newTime = Math.min(stats.timeMs, prev.timeMs ?? Infinity);
      const newHPPct = Math.max(
        Math.round((stats.heroHPRemaining / stats.heroMaxHP) * 100),
        prev.heroHPPercent ?? 0,
      );
      await setDoc(ref, {
        ...prev,
        playerId: player.id,
        won: true,
        playerName: player.username ?? player.email ?? prev.playerName ?? 'Unknown',
        characterName: character.name ?? prev.characterName ?? 'Unknown',
        damageTaken: newTaken,
        damageDealt: newDealt,
        timeMs: newTime,
        heroHPRemaining: stats.heroHPRemaining,
        heroHPPercent: newHPPct,
        characterLevel: character.level,
        timestamp: Date.now(),
      });
      return;
    }
  } catch { /* ถ้าอ่านไม่ได้ให้ overwrite */ }

  await setDoc(ref, {
    playerId: player.id,
    won: true,
    playerName: player.username ?? player.email ?? 'Unknown',
    characterName: character.name ?? 'Unknown',
    characterClass: character.class,
    characterLevel: character.level,
    levelId: stats.levelId,
    levelNumber: stats.levelNumber,
    damageDealt: stats.damageDealt,
    damageTaken: stats.damageTaken,
    timeMs: stats.timeMs,
    heroHPRemaining: stats.heroHPRemaining,
    heroHPPercent: Math.round((stats.heroHPRemaining / stats.heroMaxHP) * 100),
    timestamp: Date.now(),
  });
}

// ===== Research: Attempt Tracking =====

/**
 * บันทึกจำนวน attempt ต่อด่าน (รวมทั้งที่แพ้)
 * เรียกทุกครั้งที่ผู้เล่น Execute flowchart ครั้งแรกของ battle
 */
export async function saveLevelAttempt(uid: string, levelId: string): Promise<void> {
  const isKnownLevel = LEVELS.some((l) => l.id === levelId) || levelId === 'endless';
  if (!isKnownLevel) return;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const data: Partial<Player> = snap.exists() ? (snap.data() as Player) : {};
  const prev: Record<string, number> = { ...((data.levelAttempts ?? {}) as Record<string, number>) };
  prev[levelId] = (prev[levelId] ?? 0) + 1;
  await setDoc(ref, { levelAttempts: prev }, { merge: true });
}

// ===== Daily Farm System =====

function getThaiDate(): string {
  const now = new Date();
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return utc7.toISOString().slice(0, 10);
}

export function getMsUntilMidnightThai(): number {
  const now = new Date();
  const utc7ms = now.getTime() + 7 * 60 * 60 * 1000;
  const utc7 = new Date(utc7ms);
  const midnight = new Date(Date.UTC(utc7.getUTCFullYear(), utc7.getUTCMonth(), utc7.getUTCDate() + 1));
  return midnight.getTime() - now.getTime();
}

export async function getDailyFarmPlays(uid: string): Promise<Record<string, number>> {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return {};
    const data = snap.data();
    const dailyFarm = data.dailyFarm as { date: string; plays: Record<string, number> } | undefined;
    if (!dailyFarm) return {};
    const today = getThaiDate();
    if (dailyFarm.date !== today) return {};
    return dailyFarm.plays ?? {};
  } catch { return {}; }
}

/** บันทึกการชนะด่าน level รายวัน → คืนค่า plays วันนี้หลังนับแล้ว */
export async function recordDailyLevelWin(uid: string, levelId: string): Promise<number> {
  if (!LEVELS.some((l) => l.id === levelId)) throw new Error(`Invalid levelId: ${levelId}`);
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const today = getThaiDate();
  const stored = data.dailyFarm as { date: string; plays: Record<string, number> } | undefined;
  const plays: Record<string, number> = (stored?.date === today) ? { ...stored.plays } : {};
  plays[levelId] = (plays[levelId] ?? 0) + 1;
  await setDoc(ref, { dailyFarm: { date: today, plays } }, { merge: true });
  return plays[levelId];
}

// ===== Endless Mode Leaderboard =====
export interface EndlessBattleStats {
  score: number;
  wavesCleared: number;
  damageDealt: number;
  damageTaken: number;
}

export async function saveEndlessLeaderboardEntry(
  player: Player,
  character: Character,
  stats: EndlessBattleStats,
): Promise<void> {
  const ref = doc(db, 'endlessboards', player.id);

  // อ่านค่าเดิม — เก็บ best score, best wave, สะสม damage
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const prev = snap.data();
      await setDoc(ref, {
        playerId: player.id,
        playerName: player.username ?? player.email ?? prev.playerName ?? 'Unknown',
        characterName: character.name ?? prev.characterName ?? 'Unknown',
        characterClass: character.class,
        characterLevel: character.level,
        score: Math.max(stats.score, prev.score ?? 0),
        wavesCleared: Math.max(stats.wavesCleared, prev.wavesCleared ?? 0),
        totalDamageDealt: (prev.totalDamageDealt ?? 0) + stats.damageDealt,
        totalDamageTaken: (prev.totalDamageTaken ?? 0) + stats.damageTaken,
        timestamp: Date.now(),
      });
      return;
    }
  } catch { /* ถ้าอ่านไม่ได้ให้ overwrite */ }

  await setDoc(ref, {
    playerId: player.id,
    playerName: player.username ?? player.email ?? 'Unknown',
    characterName: character.name ?? 'Unknown',
    characterClass: character.class,
    characterLevel: character.level,
    score: stats.score,
    wavesCleared: stats.wavesCleared,
    totalDamageDealt: stats.damageDealt,
    totalDamageTaken: stats.damageTaken,
    timestamp: Date.now(),
  });
}

// ===== Flowchart Save/Load =====

import type { FlowNode, FlowEdge } from '../types/game.types';

/**
 * บันทึก flowchart (nodes + edges) ของ user ต่อด่าน
 * เก็บใน users/{uid}/flowcharts/{levelId}
 * ลบ execution state และ virus node ออกก่อน save
 */
export async function saveFlowchart(
  uid: string,
  levelId: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
): Promise<void> {
  // กรอง virus node และ execution state ออกก่อน save
  const cleanNodes = nodes
    .filter((n) => !n.data.isVirus)
    .map((n) => ({
      id: n.id, type: n.type,
      position: n.position,
      data: {
        label: n.data.label,
        actionType: n.data.actionType,
        conditionType: n.data.conditionType,
        threshold: n.data.threshold,
        // ไม่ save isActive, isVirus, glow state
      },
    }));

  const cleanEdges = edges
    .filter((e) => !e.id.includes('virus'))
    .map((e) => ({
      id: e.id, source: e.source, target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      label: e.label ?? null,
    }));

  const ref = doc(db, 'users', uid, 'flowcharts', levelId);
  await setDoc(ref, {
    nodes: cleanNodes,
    edges: cleanEdges,
    savedAt: Date.now(),
  });
}

/**
 * โหลด flowchart ที่เคย save ไว้
 * คืน null ถ้าไม่เคย save
 */
export async function loadFlowchart(
  uid: string,
  levelId: string,
): Promise<{ nodes: FlowNode[]; edges: FlowEdge[] } | null> {
  const ref = doc(db, 'users', uid, 'flowcharts', levelId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    nodes: (data.nodes ?? []) as FlowNode[],
    edges: (data.edges ?? []) as FlowEdge[],
  };
}

// ===== Achievement System =====

/**
 * บันทึก achievements ที่ปลดล็อคใหม่ไปยัง Firestore
 * merge เข้ากับ achievements ที่มีอยู่แล้ว ไม่ overwrite
 */
export async function saveAchievements(uid: string, newIds: string[]): Promise<void> {
  if (newIds.length === 0) return;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const existing: string[] = snap.exists() ? (snap.data().achievements ?? []) : [];
  const merged = Array.from(new Set([...existing, ...newIds]));
  await setDoc(ref, { achievements: merged }, { merge: true });
}

// ===== Classroom Leaderboard =====

export interface ClassroomBoardEntry {
  uid: string;
  name: string;
  levelsCompleted: number;
  avgScore: number;
  totalXP: number;
  classroomCode: string;
  updatedAt: number;
}

/**
 * บันทึก / อัปเดต entry ของ student ใน classroom leaderboard
 * เก็บใน classroomBoards/{roomCode}/members/{uid}
 */
export async function saveClassroomBoardEntry(
  player: Player,
  character: Character,
): Promise<void> {
  if (!player.classroomCode) return;
  const scores = Object.values(player.levelScores ?? {}) as number[];
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const ref = doc(db, 'classroomBoards', player.classroomCode, 'members', player.id);
  await setDoc(ref, {
    uid: player.id,
    name: player.username ?? player.email ?? 'Unknown',
    levelsCompleted: (player.levelsCompleted ?? []).length,
    avgScore,
    totalXP: character.experience ?? 0,
    classroomCode: player.classroomCode,
    updatedAt: Date.now(),
  });
}

/**
 * โหลด classroom leaderboard ทั้งหมดในห้อง
 */
export async function getClassroomBoard(roomCode: string): Promise<ClassroomBoardEntry[]> {
  const snap = await getDocs(collection(db, 'classroomBoards', roomCode, 'members'));
  return snap.docs.map((d) => d.data() as ClassroomBoardEntry);
}
