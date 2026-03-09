import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebaseService';
import type { Character } from '../types/game.types';

export async function saveCharacter(character: Character): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');
  const docRef = doc(db, 'characters', character.id);
  await setDoc(docRef, { ...character, lastModified: serverTimestamp() });
}

export async function loadCharacter(characterId: string): Promise<Character | null> {
  const docRef = doc(db, 'characters', characterId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Character;
  }
  return null;
}

export async function loadPlayerCharacters(playerId: string): Promise<Character[]> {
  const q = query(collection(db, 'characters'), where('playerId', '==', playerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Character));
}
