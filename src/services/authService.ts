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
