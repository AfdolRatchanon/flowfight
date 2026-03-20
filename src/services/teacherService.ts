import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, collection,
  query, where, getDocs, serverTimestamp, deleteDoc, runTransaction,
} from 'firebase/firestore';
import { auth, db } from './firebaseService';
import type { Classroom, StudentProgress } from '../types/game.types';

// ─── Admin: Manage teacher invite codes ──────────────────────────────────────

export interface TeacherCodeDoc {
  code: string;
  usedBy: string | null;
  usedAt?: number;
  createdAt: number;
}

export async function getTeacherCodes(): Promise<TeacherCodeDoc[]> {
  const snap = await getDocs(collection(db, 'teacher_codes'));
  return snap.docs.map((d) => ({ code: d.id, ...d.data() } as TeacherCodeDoc));
}

export async function createTeacherCode(code: string): Promise<void> {
  const upper = code.toUpperCase().trim();
  if (!upper) throw new Error('รหัสต้องไม่ว่าง');
  await setDoc(doc(db, 'teacher_codes', upper), {
    usedBy: null,
    createdAt: Date.now(),
  });
}

export async function deleteTeacherCode(code: string): Promise<void> {
  await deleteDoc(doc(db, 'teacher_codes', code.toUpperCase()));
}

// ─── Generate 6-digit room code ──────────────────────────────────────────────
function genRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Validate teacher invite code ────────────────────────────────────────────
export async function validateTeacherCode(code: string): Promise<boolean> {
  const ref = doc(db, 'teacher_codes', code.toUpperCase());
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data();
  return !data.usedBy; // null = available
}

// ─── Register teacher ─────────────────────────────────────────────────────────
export async function registerTeacher(
  email: string,
  password: string,
  teacherName: string,
  inviteCode: string,
): Promise<void> {
  const upper = inviteCode.toUpperCase().trim();

  // 1. pre-check ก่อนสร้าง auth (fast fail)
  const preCheck = await validateTeacherCode(upper);
  if (!preCheck) throw new Error('รหัสเชิญไม่ถูกต้องหรือถูกใช้แล้ว');

  // 2. create auth account
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  try {
    // 3. transaction: atomic check + create user doc + mark code used
    // ป้องกัน race condition — ถ้ามีคนอื่น claim code พร้อมกัน transaction จะ fail
    await runTransaction(db, async (t) => {
      const codeRef = doc(db, 'teacher_codes', upper);
      const codeSnap = await t.get(codeRef);
      if (!codeSnap.exists() || codeSnap.data().usedBy) {
        throw new Error('รหัสเชิญไม่ถูกต้องหรือถูกใช้แล้ว');
      }
      t.set(doc(db, 'users', uid), {
        id: uid,
        username: teacherName,
        email,
        role: 'teacher',
        levelsCompleted: [],
        createdAt: Date.now(),
        lastActive: Date.now(),
        stats: { totalKills: 0, totalDefeats: 0, levelReached: 0, totalPlayTime: 0 },
        preferences: { difficulty: 'normal', soundEnabled: true, musicVolume: 0.7, sfxVolume: 0.8 },
      });
      t.update(codeRef, { usedBy: uid, usedAt: serverTimestamp() });
    });
  } catch (err) {
    // ถ้า transaction fail ให้ลบ auth user ที่สร้างไว้ ไม่ให้ค้างเป็น dangling account
    await cred.user.delete().catch(() => {});
    throw err;
  }
}

// ─── Create classroom ─────────────────────────────────────────────────────────
export async function createClassroom(
  teacherId: string,
  teacherName: string,
  className: string,
): Promise<string> {
  let roomCode = genRoomCode();
  // ensure unique
  let snap = await getDoc(doc(db, 'classrooms', roomCode));
  while (snap.exists()) {
    roomCode = genRoomCode();
    snap = await getDoc(doc(db, 'classrooms', roomCode));
  }

  await setDoc(doc(db, 'classrooms', roomCode), {
    roomCode,
    teacherId,
    teacherName,
    className,
    students: [],
    createdAt: Date.now(),
  } satisfies Classroom);

  return roomCode;
}

// ─── Student join classroom ───────────────────────────────────────────────────
export async function joinClassroom(uid: string, roomCode: string): Promise<string> {
  const ref = doc(db, 'classrooms', roomCode);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('ไม่พบห้องเรียนรหัส ' + roomCode);

  const classroom = snap.data() as Classroom;

  // add student to classroom
  await updateDoc(ref, { students: arrayUnion(uid) });

  // save classroomCode on student's user doc
  await updateDoc(doc(db, 'users', uid), { classroomCode: roomCode });

  return classroom.className;
}

// ─── Get teacher's classrooms ─────────────────────────────────────────────────
export async function getTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
  const q = query(collection(db, 'classrooms'), where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Classroom);
}

// ─── Upgrade existing student account to teacher ─────────────────────────────
export async function upgradeToTeacher(uid: string, inviteCode: string): Promise<void> {
  const upper = inviteCode.toUpperCase().trim();
  // transaction: atomic check + claim code + update role
  await runTransaction(db, async (t) => {
    const codeRef = doc(db, 'teacher_codes', upper);
    const codeSnap = await t.get(codeRef);
    if (!codeSnap.exists() || codeSnap.data().usedBy) {
      throw new Error('รหัสเชิญไม่ถูกต้องหรือถูกใช้แล้ว');
    }
    t.update(doc(db, 'users', uid), { role: 'teacher' });
    t.update(codeRef, { usedBy: uid, usedAt: serverTimestamp() });
  });
}

// ─── Get students in classroom ────────────────────────────────────────────────
export async function getClassroomStudents(roomCode: string): Promise<StudentProgress[]> {
  const classSnap = await getDoc(doc(db, 'classrooms', roomCode));
  if (!classSnap.exists()) return [];

  const { students } = classSnap.data() as Classroom;
  if (students.length === 0) return [];

  const results: StudentProgress[] = [];
  for (const uid of students) {
    const uSnap = await getDoc(doc(db, 'users', uid));
    if (uSnap.exists()) {
      const u = uSnap.data();
      results.push({
        uid,
        username: u.username ?? uid,
        levelsCompleted: u.levelsCompleted ?? [],
        lastActive: u.lastActive ?? 0,
        classroomCode: u.classroomCode,
      });
    }
  }
  return results;
}
