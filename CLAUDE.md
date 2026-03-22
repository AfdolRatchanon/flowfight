# CLAUDE.md — FlowFight Project Instructions

## Project Overview
- **Game**: FlowFight — Flowchart Battle RPG (educational game)
- **Path**: `c:\Users\dol_7\Desktop\Project Game RPG Flowchart\flowfight`
- **Stack**: React 19 + TypeScript + Vite, ReactFlow, Zustand, Firebase, Tailwind v4
- **Concept**: Dual-screen — top = Battle Arena, bottom = Flowchart Editor

## Workflow (สำคัญมาก — ทำตามทุกครั้ง)

### ก่อนลงมือทำทุก task:
1. **วิเคราะห์ prompt** — ครบถ้วนพอทำได้ถูกต้องหรือยัง?
2. **ถ้าไม่ครบ** → แจ้งสิ่งที่ขาด + เสนอ option → รอ user ตอบ
3. **ถ้าครบ** → เสนอแผน + scope + ผลกระทบที่อาจเกิด → รอ user อนุมัติ
4. **เมื่อ user บอกให้เริ่ม** ("ok", "เริ่มได้", "ทำได้เลย" ฯลฯ) → ลงมือ

### ตัวอย่างสิ่งที่ต้องตรวจก่อนทำ:
- Scope ชัดหรือยัง? (ทั้ง feature หรือแค่ส่วนไหน?)
- มี prerequisite ที่ยังขาด? (context, file, requirement)
- มีหลายวิธีแก้ — user ต้องการแบบไหน?
- มีผลกระทบข้างเคียงที่ควรแจ้งก่อนหรือไม่?

## Commit Policy

- **ห้าม commit** ถ้า user ไม่ได้สั่ง
- ก่อน commit ต้องบอก user ก่อนเสมอว่าจะ commit อะไร รอ user อนุมัติ
- ห้าม push ถ้า user ไม่ได้สั่ง push โดยตรง
- Commit message: `type: description (vX.Y.Z)` + `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Version: SemVer — MAJOR.MINOR.PATCH (feature=MINOR, fix/docs=PATCH)

## Communication Style

- **ภาษาไทย** เป็นหลัก
- ไม่ใช้ emoji ถ้า user ไม่ขอ
- ไม่สรุปสิ่งที่ทำไปแล้วท้าย response (user อ่าน diff เองได้)
- ไม่ประกาศ phase (BA/SA/Dev/QA) — ลงมือหรือถามตรง ๆ
- ตอบสั้น ตรงประเด็น ประหยัด token

## Project Standards

### Tech Decisions
- State management: Zustand (ไม่ใช้ Redux)
- Styling: inline styles + Tailwind utility classes (ไม่ใช้ CSS modules)
- Firebase: Firestore + Auth (Email/Password, Google, Anonymous)
- Firestore rules: `firestore.rules` ที่ root — deploy ด้วย `firebase deploy --only firestore:rules`

### File Structure
```
src/
  components/
    Battle/       — BattleScreen, FlowchartEditor, etc.
    UI/           — MainMenu, LevelSelect, AchievementsPage, etc.
    Admin/        — AdminDashboard
    Teacher/      — TeacherDashboard
    Character/    — CharacterCustomizer
  services/       — authService, teacherService, firebaseService
  stores/         — gameStore, flowchartStore, shopStore, etc.
  utils/          — constants, levelSystem, achievements, etc.
  types/          — game.types.ts
```

### Roles
- `student` — เล่นเกมปกติ
- `teacher` — สร้างห้องเรียน, กำหนด assignment, ดู progress นักเรียน
- `admin` — ทุกอย่าง + จัดการ teacher invite codes (ต้องตั้งใน Firebase Console)

### Security Rules
- ห้าม commit `.env` (อยู่ใน .gitignore แล้ว)
- `firestore.rules`, `firebase.json`, `.firebaserc` — commit ได้ (ไม่ใช่ secret)
- Admin role ตั้งได้ใน Firebase Console → Firestore → users/{uid} → role: "admin" เท่านั้น

## Testing (Professional Tester Standard)

### Testing Pyramid
```
         /    E2E (Playwright)     \   ← น้อย: critical user flows
        /   Integration (Emulator)  \  ← กลาง: Firebase services + rules
       /       Unit Tests            \ ← มาก: pure logic functions
```

### Test Commands
| Command | ใช้เมื่อ |
|---|---|
| `npm test` | รัน unit tests (FlowchartEngine, levelSystem, achievements) |
| `npm run test:watch` | ระหว่าง develop |
| `npm run test:rules` | หลังแก้ `firestore.rules` (ต้องรัน Emulator ก่อน) |
| `firebase emulators:start --only firestore` | เปิด Emulator สำหรับ rules test |

### Pre-commit Hook (อัตโนมัติ)
Git hook ที่ `.git/hooks/pre-commit` รัน `npm test` ก่อนทุก commit
ถ้า test fail → commit ถูก abort ทันที

### Claude ต้องทำก่อน commit ทุกครั้ง
1. `npm test` — unit tests ผ่านทั้งหมด
2. ถ้าแก้ `firestore.rules` → `npm run test:rules` (แจ้ง user รัน Emulator ก่อน)
3. ถ้าแก้ logic ใน `FlowchartEngine` / `levelSystem` / `achievements` → ต้องเพิ่ม/อัปเดต test

### Test Coverage Priority
| Priority | Module | Test File |
|---|---|---|
| 1 | FlowchartEngine (budget, win/lose, shield) | `src/engines/FlowchartEngine.test.ts` |
| 2 | levelSystem (XP, level up) | `src/utils/levelSystem.test.ts` |
| 3 | achievements (unlock conditions) | `src/utils/achievements.test.ts` |
| 4 | Firestore rules (security) | `src/tests/firestore.rules.test.ts` |

### Test Categories ที่ต้องครอบคลุม
- **Happy path** — ใช้งานปกติ
- **Edge case** — boundary values (0, max, empty)
- **Security** — unauthorized access, input injection, role escalation
- **Regression** — สิ่งที่เคย bug ต้องมี test ยืนยัน

### ถ้าพบ Bug → Test First
ก่อนแก้ bug ให้เขียน test ที่ reproduce bug ก่อน แล้วค่อยแก้จนเขียว

## Current Version
**v0.18.4** — ดู ROADMAP.md สำหรับ Phase ถัดไป

### กฎการจัดการ Version (ห้ามผิดเด็ดขาด)

1. **Single source of truth = `package.json`** — อัปเดตที่นี่ที่เดียว
2. **ก่อน commit ทุกครั้ง** ให้ตรวจ `package.json` version ก่อนเสมอ:
   ```bash
   grep '"version"' package.json
   ```
3. **Version ต้องเพิ่มขึ้นเสมอ** — ห้ามใช้เลขที่น้อยกว่า version ปัจจุบัน
4. **ตรวจ version ปัจจุบันก่อน bump**:
   - PATCH (x.x.+1): bug fix, docs, test, refactor, security fix
   - MINOR (x.+1.0): feature ใหม่
   - MAJOR (+1.0.0): breaking change
5. **อัปเดตทุกที่พร้อมกัน** เมื่อ bump version:
   - `package.json` → `"version": "x.y.z"`
   - `README.md` → badge + changelog section ใหม่
   - CLAUDE.md section นี้ → Current Version
6. **ตรวจ version ย้อนหลัง** ถ้าไม่แน่ใจ: `git log --oneline -5`
