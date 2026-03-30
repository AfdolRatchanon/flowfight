/**
 * seed-test-accounts.mjs
 * สร้าง test accounts ใน Firebase สำหรับทดสอบทุก role
 *
 * วิธีใช้:
 *   node scripts/seed-test-accounts.mjs
 *
 * ต้องการ: .env ที่ root (มี VITE_FIREBASE_API_KEY และ VITE_FIREBASE_PROJECT_ID)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// === อ่าน .env ===
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

let envContent;
try {
  envContent = readFileSync(envPath, 'utf8');
} catch {
  console.error('ไม่พบไฟล์ .env ที่ root — copy .env.example แล้วใส่ค่าก่อน');
  process.exit(1);
}

const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
}

const API_KEY    = env.VITE_FIREBASE_API_KEY;
const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID;

if (!API_KEY || !PROJECT_ID) {
  console.error('ไม่พบ VITE_FIREBASE_API_KEY หรือ VITE_FIREBASE_PROJECT_ID ใน .env');
  process.exit(1);
}

// === Test Accounts ===
const ACCOUNTS = [
  // Admin (1 account)
  { email: 'admin@flowfight.test',    password: 'Admin@Test123',   username: 'Admin Test',    role: 'admin'   },
  // Teacher (2 accounts)
  { email: 'teacher1@flowfight.test', password: 'Teacher@Test123', username: 'Teacher One',   role: 'teacher' },
  { email: 'teacher2@flowfight.test', password: 'Teacher@Test123', username: 'Teacher Two',   role: 'teacher' },
  // Student (5 accounts) — ไม่มี role field = default 'student'
  { email: 'student1@flowfight.test', password: 'Student@Test123', username: 'Student One'   },
  { email: 'student2@flowfight.test', password: 'Student@Test123', username: 'Student Two'   },
  { email: 'student3@flowfight.test', password: 'Student@Test123', username: 'Student Three' },
  { email: 'student4@flowfight.test', password: 'Student@Test123', username: 'Student Four'  },
  { email: 'student5@flowfight.test', password: 'Student@Test123', username: 'Student Five'  },
];

// === Firebase Auth REST API ===
async function signUp(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'sign up failed');
  return { uid: data.localId, idToken: data.idToken };
}

// === Firestore REST API ===
function toFirestoreField(value) {
  if (typeof value === 'string')  return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number' && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (Array.isArray(value))       return { arrayValue: { values: value.map(toFirestoreField) } };
  if (value && typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) fields[k] = toFirestoreField(v);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

async function createFirestoreProfile(uid, idToken, account) {
  const now = Date.now();

  const profile = {
    username:           account.username,
    email:              account.email,
    isAnonymous:        false,
    levelsCompleted:    [],
    gold:               150,
    purchasedEquipment: [],
    createdAt:          now,
    lastActive:         now,
    stats: {
      totalKills:    0,
      totalDefeats:  0,
      levelReached:  1,
      totalPlayTime: 0,
    },
    preferences: {
      difficulty:   'normal',
      soundEnabled: true,
      musicVolume:  0.7,
      sfxVolume:    0.8,
    },
  };

  // role field — ใส่เฉพาะ admin/teacher (student ไม่ใส่ = default)
  if (account.role) profile.role = account.role;

  // แปลงเป็น Firestore fields format
  const fields = {};
  for (const [k, v] of Object.entries(profile)) fields[k] = toFirestoreField(v);

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data.error) ?? 'Firestore write failed');
}

// === Main ===
async function main() {
  console.log('FlowFight — สร้าง Test Accounts\n');

  const results = [];

  for (const account of ACCOUNTS) {
    const role = account.role ?? 'student';
    process.stdout.write(`[${role.padEnd(7)}] ${account.email} ... `);
    try {
      const { uid, idToken } = await signUp(account.email, account.password);
      await createFirestoreProfile(uid, idToken, account);
      console.log(`สำเร็จ (uid: ${uid})`);
      results.push({ ...account, uid, ok: true });
    } catch (err) {
      const msg = err.message;
      // account มีอยู่แล้ว — ไม่ใช่ error จริง
      if (msg === 'EMAIL_EXISTS') {
        console.log('มีอยู่แล้ว (ข้าม)');
      } else {
        console.log(`ล้มเหลว: ${msg}`);
      }
      results.push({ ...account, ok: false, error: msg });
    }
  }

  // สรุป credentials
  const success = results.filter(r => r.ok || r.error === 'EMAIL_EXISTS');
  console.log('\n========================================');
  console.log(' Test Account Credentials');
  console.log('========================================');
  console.log('Role      Email                         Password');
  console.log('-------   ----------------------------  ---------------');
  for (const acc of ACCOUNTS) {
    const role = (acc.role ?? 'student').padEnd(7);
    console.log(`${role}   ${acc.email.padEnd(28)}  ${acc.password}`);
  }
  console.log('========================================');
  console.log(`\nสร้างสำเร็จ ${success.length}/${ACCOUNTS.length} accounts`);
  console.log('\nวิธีตั้ง role ใน app:');
  console.log('  admin   — เข้า Firebase Console > Firestore > users/{uid} > role: "admin"');
  console.log('  teacher — role ถูกตั้งอัตโนมัติผ่าน seed script แล้ว');
  console.log('  student — default (ไม่ต้องทำอะไร)');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
