# CLAUDE.md — FlowFight Project Instructions

## Project Overview
- **Game**: FlowFight — Flowchart Battle RPG (educational game)
- **Path**: `c:\Users\dol_7\Desktop\Project Game RPG Flowchart\flowfight`
- **Stack**: React 19 + TypeScript + Vite, ReactFlow, Zustand, Firebase, Tailwind v4
- **Concept**: Dual-screen — top = Battle Arena, bottom = Flowchart Editor

> **อ่านก่อนเริ่มทุก task:** ตรวจสอบ [README.md](README.md) เสมอเพื่อให้ข้อมูล version, stack, และโครงสร้างโปรเจกต์ถูกต้อง
> เอกสารอื่น: [GAMEPLAY.md](GAMEPLAY.md) (ข้อมูลเกม), [ROADMAP.md](ROADMAP.md) (แผน), [CHANGELOG.md](CHANGELOG.md) (ประวัติ)

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
- **ห้าม push ทุกกรณี** — user จะ push เอง Claude ทำได้แค่ commit เท่านั้น
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
    Auth/         — LoginPage, TeacherRegisterPage
    Battle/       — BattleScreen
    FlowchartEditor/ — FlowchartEditor, CustomNodes/
    Character/    — CharacterCustomizer
    Shop/         — ShopScreen, ShopPage
    Teacher/      — TeacherDashboard
    Admin/        — AdminDashboard
    UI/           — MainMenu, LevelSelect, ModeSelect, Leaderboard,
                    AchievementsPage, CertificatePage, SandboxMode,
                    VolumeButton, ThemeToggle, JoinClassroomModal
  modes/
    InfinityDev/  — InfinityDevScreen, InfinityDevBattle
  engines/        — FlowchartEngine.ts, ShopEngine.ts
  hooks/          — useBattle.ts, useAuth.ts
  stores/         — gameStore, battleStore, flowchartStore, shopStore, characterStore
  services/       — authService, teacherService, characterService, soundManager, firebaseService
  contexts/       — ThemeContext.tsx
  tests/          — firestore.rules.test.ts
  types/          — game.types.ts, firebase.types.ts
  utils/          — constants, levelSystem, achievements, levelSystem.test.ts, achievements.test.ts
```

### Roles
- `student` — เล่นเกมปกติ
- `teacher` — สร้างห้องเรียน, กำหนด assignment, ดู progress นักเรียน
- `admin` — ทุกอย่าง + จัดการ teacher invite codes (ต้องตั้งใน Firebase Console)

### Security Rules
- ห้าม commit `.env` (อยู่ใน .gitignore แล้ว)
- `firestore.rules`, `firebase.json`, `.firebaserc` — commit ได้ (ไม่ใช่ secret)
- Admin role ตั้งได้ใน Firebase Console → Firestore → users/{uid} → role: "admin" เท่านั้น

### Error Monitoring
- `@sentry/react` ติดตั้งอยู่ใน dependencies — ถ้า production มี uncaught error ให้ตรวจ Sentry dashboard ก่อน debug
- ถ้า deploy แล้วพัง → rollback ด้วย `firebase hosting:channel:deploy preview` เพื่อ test ก่อน หรือ `git revert` แล้ว deploy ใหม่

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
1. `npx tsc --noEmit` — TypeScript ต้องไม่มี error **(blocking)**
2. `npm test` — unit tests ต้องผ่านทั้งหมด **(blocking)**
3. ถ้าแก้ `firestore.rules` → `npm run test:rules` (แจ้ง user รัน Emulator ก่อน)
4. ถ้าแก้ logic ใน `FlowchartEngine` / `levelSystem` / `achievements` → ต้องเพิ่ม/อัปเดต test

### ตรวจก่อน commit ทุกครั้ง
```bash
npx tsc --noEmit   # ต้องไม่มี error
npm test           # ต้องผ่านทั้งหมด
```

### Linting (ไม่ blocking แต่ควรสนใจ)
```bash
npm run lint       # รันเพื่อตรวจสอบ — อย่าเพิ่ม error ใหม่
```
> โปรเจกต์มี lint errors สะสมอยู่แล้ว (~118 รายการ ส่วนใหญ่ `any` type)
> กฎ: **โค้ดใหม่ที่เพิ่มต้องไม่เพิ่ม error เกินกว่าเดิม** — ไม่ต้องแก้ของเก่าทุกครั้ง

> **Deploy = user รัน เอง** — Claude ห้าม deploy ทุกกรณี (เหมือนกับ push)
> คำสั่ง deploy สำหรับ user:
> - แก้เฉพาะ rules → `firebase deploy --only firestore:rules`
> - แก้เฉพาะ frontend → `firebase deploy --only hosting`
> - แก้ทั้งคู่ → `firebase deploy`

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

## Development Priority (อ่านก่อนเริ่มทุก feature)

> ดู [ROADMAP.md](ROADMAP.md) เสมอก่อนเริ่มทำ feature ใหม่

**ลำดับความสำคัญปัจจุบัน (มีนาคม 2026):**
```
เสร็จแล้ว:
  Phase 1 LMS Foundation    — Teacher/Classroom/Assignment [x] v0.17–18
  Phase 2 ปวส. Curriculum   — level_21–30 [x] v0.19.0
  Phase 3 Analytics         — Auto-grading, Teacher Analytics [x] v0.20.0
  Phase 4 Platform          — PWA, Sandbox Mode [x] v0.21.0

ถัดไป:
  1. Mobile / Tablet Support — Responsive layout สำหรับ touch screen
  2. Phase 5 Advanced LMS    — Custom Level Editor, Class Competition, AI Hint
  3. Curriculum Alignment    — เชื่อมกับหลักสูตร สอศ. (ปวช./ปวส.) อย่างเป็นทางการ
  4. ประถม / มัธยม           — ทำสุดท้าย (ต้องออกแบบ UX ใหม่ทั้งหมด)
```

**กฎ:** ทุกครั้งที่เริ่ม feature ใหม่ → อัปเดต ROADMAP.md เปลี่ยน `[ ]` เป็น `[x] vX.Y.Z`

## Current Version
**v0.24.0** — ดู ROADMAP.md สำหรับ Phase ถัดไป

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
   - `CHANGELOG.md` → เพิ่ม section ใหม่ด้านบนสุด
   - `README.md` → แก้ badge version (บรรทัด `**vX.Y.Z**`)
   - CLAUDE.md section นี้ → Current Version
6. **ตรวจ version ย้อนหลัง** ถ้าไม่แน่ใจ: `git log --oneline -5`
