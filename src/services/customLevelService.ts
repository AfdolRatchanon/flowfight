import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where,
} from 'firebase/firestore';
import { db } from './firebaseService';
import type { CustomLevel, CustomLevelFormData } from '../types/game.types';

const COL = 'customLevels';

export async function createCustomLevel(
  classroomCode: string,
  teacherUid: string,
  form: CustomLevelFormData,
): Promise<string> {
  const data = formToDoc(classroomCode, teacherUid, form);
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await updateDoc(ref, { id: ref.id });
  return ref.id;
}

export async function updateCustomLevel(levelId: string, form: CustomLevelFormData): Promise<void> {
  const ref = doc(db, COL, levelId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Level not found');
  const existing = snap.data() as CustomLevel;
  await updateDoc(ref, {
    ...formToDoc(existing.classroomCode, existing.createdBy, form),
    updatedAt: Date.now(),
  });
}

export async function deleteCustomLevel(levelId: string): Promise<void> {
  await deleteDoc(doc(db, COL, levelId));
}

export async function getClassroomCustomLevels(classroomCode: string): Promise<CustomLevel[]> {
  const q = query(collection(db, COL), where('classroomCode', '==', classroomCode));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CustomLevel);
}

export async function getCustomLevel(levelId: string): Promise<CustomLevel | null> {
  const snap = await getDoc(doc(db, COL, levelId));
  return snap.exists() ? (snap.data() as CustomLevel) : null;
}

export async function publishCustomLevel(levelId: string, published: boolean): Promise<void> {
  await updateDoc(doc(db, COL, levelId), { published, updatedAt: Date.now() });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formToDoc(classroomCode: string, createdBy: string, form: CustomLevelFormData) {
  return {
    classroomCode,
    createdBy,
    name: form.name.trim(),
    description: form.description.trim(),
    concept: form.concept.trim(),
    difficulty: form.difficulty,
    enemy: {
      name: form.enemy.name.trim(),
      hp: Number(form.enemy.hp),
      atk: Number(form.enemy.atk),
      def: Number(form.enemy.def),
      behaviors: form.enemy.behaviors,
      budgetPerTurn: Number(form.enemy.budgetPerTurn),
      shield: form.enemy.shield ?? false,
    },
    allowedBlocks: form.allowedBlocks.length > 0 ? form.allowedBlocks : null,
    requiredBlocks: form.requiredBlocks.length > 0 ? form.requiredBlocks : [],
    nodeLimit: form.nodeLimit !== '' ? Number(form.nodeLimit) : null,
    objectives: form.objectives.split('\n').map((s) => s.trim()).filter(Boolean),
    bonusObjective: form.bonusObjective.trim() || null,
    published: form.published,
  };
}
