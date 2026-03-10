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
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseService';
import type { Player, Character } from '../types/game.types';

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
  const result = await signInAnonymously(auth);
  const displayName = `${firstName} ${surname}`.trim();
  await updateProfile(result.user, { displayName });
  await createPlayerProfile(result.user, { username: displayName, firstName, surname, email: '', isAnonymous: true });
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

export async function savePlayerProgress(uid: string, levelId: string, won: boolean): Promise<Player | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as Player;
  const levelsCompleted: string[] = [...(data.levelsCompleted ?? [])];
  if (won && !levelsCompleted.includes(levelId)) levelsCompleted.push(levelId);

  const levelNumber = parseInt(levelId.replace('level_', '')) || 1;
  const updates = {
    levelsCompleted,
    'stats.totalKills': (data.stats?.totalKills ?? 0) + (won ? 1 : 0),
    'stats.totalDefeats': (data.stats?.totalDefeats ?? 0) + (won ? 0 : 1),
    'stats.levelReached': Math.max(data.stats?.levelReached ?? 1, levelNumber + (won ? 1 : 0)),
    lastActive: Date.now(),
  };
  await updateDoc(ref, updates);

  return { ...data, id: uid, levelsCompleted, stats: { ...data.stats, totalKills: updates['stats.totalKills'], totalDefeats: updates['stats.totalDefeats'], levelReached: updates['stats.levelReached'] } };
}

export async function saveCharacterProgress(uid: string, character: Character): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    characterProgress: {
      level: character.level,
      experience: character.experience,
      maxHP: character.stats.maxHP,
      attack: character.stats.attack,
      defense: character.stats.defense,
      speed: character.stats.speed,
      class: character.class,
      name: character.name,
    },
  });
}

export async function saveLeaderboardEntry(
  player: Player,
  character: Character,
  battleStats?: LevelBattleStats,
): Promise<void> {
  const ref = doc(db, 'leaderboards', player.id);

  // อ่านค่าเดิมก่อน เพื่อสะสม totalDamage/totalTime
  let prevDealt = 0, prevTaken = 0, prevTime = 0;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      prevDealt = snap.data().totalDamageDealt ?? 0;
      prevTaken = snap.data().totalDamageTaken ?? 0;
      prevTime  = snap.data().totalPlayTime    ?? 0;
    }
  } catch { /* ถ้าอ่านไม่ได้ให้ใช้ 0 */ }

  await setDoc(ref, {
    playerId: player.id,
    playerName: player.username,
    characterName: character.name,
    characterClass: character.class,
    characterLevel: character.level,
    experience: character.experience,
    levelReached: player.stats?.levelReached ?? 1,
    levelsCompleted: (player.levelsCompleted ?? []).length,
    totalKills: player.stats?.totalKills ?? 0,
    totalPlayTime:    prevTime  + (battleStats?.timeMs        ?? 0),
    totalDamageDealt: prevDealt + (battleStats?.damageDealt   ?? 0),
    totalDamageTaken: prevTaken + (battleStats?.damageTaken   ?? 0),
    gameMode: 'normal',
    lastUpdated: Date.now(),
  });
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
      const newTaken   = Math.min(stats.damageTaken, prev.damageTaken ?? Infinity);
      const newDealt   = Math.max(stats.damageDealt, prev.damageDealt ?? 0);
      const newTime    = Math.min(stats.timeMs,      prev.timeMs      ?? Infinity);
      const newHPPct   = Math.max(
        Math.round((stats.heroHPRemaining / stats.heroMaxHP) * 100),
        prev.heroHPPercent ?? 0,
      );
      await setDoc(ref, {
        ...prev,
        damageTaken:    newTaken,
        damageDealt:    newDealt,
        timeMs:         newTime,
        heroHPRemaining: stats.heroHPRemaining,
        heroHPPercent:  newHPPct,
        characterLevel: character.level,
        timestamp: Date.now(),
      });
      return;
    }
  } catch { /* ถ้าอ่านไม่ได้ให้ overwrite */ }

  await setDoc(ref, {
    playerId:       player.id,
    playerName:     player.username,
    characterName:  character.name,
    characterClass: character.class,
    characterLevel: character.level,
    levelId:        stats.levelId,
    levelNumber:    stats.levelNumber,
    damageDealt:    stats.damageDealt,
    damageTaken:    stats.damageTaken,
    timeMs:         stats.timeMs,
    heroHPRemaining: stats.heroHPRemaining,
    heroHPPercent:  Math.round((stats.heroHPRemaining / stats.heroMaxHP) * 100),
    timestamp:      Date.now(),
  });
}
