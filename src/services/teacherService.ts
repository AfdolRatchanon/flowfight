import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, collection,
  query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebaseService';
import type { Classroom, StudentProgress } from '../types/game.types';

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
  // 1. validate code
  const valid = await validateTeacherCode(inviteCode);
  if (!valid) throw new Error('รหัสเชิญไม่ถูกต้องหรือถูกใช้แล้ว');

  // 2. create auth account
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // 3. create user doc with role=teacher
  await setDoc(doc(db, 'users', uid), {
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

  // 4. mark invite code as used
  await updateDoc(doc(db, 'teacher_codes', inviteCode.toUpperCase()), {
    usedBy: uid,
    usedAt: serverTimestamp(),
  });
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
