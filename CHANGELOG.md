# Changelog — FlowFight

ประวัติการเปลี่ยนแปลงทั้งหมด เรียงจากใหม่ → เก่า

---

### v0.21.0 (มีนาคม 2026)

**Phase 3+4 — Certificate, Sandbox & PWA**
- **Certificate Page** (`/certificate`) — ใบประกาศนียบัตร printable พร้อม `@media print`, แสดง Badge ที่ได้รับ, ชื่อผู้เล่น, ด่านที่ผ่าน, avg score
- **AchievementsPage** — เพิ่มปุ่มนำทางไป Certificate page
- **Sandbox Mode** (`/sandbox`) — วาด Flowchart อิสระโดยไม่มีการสู้รบ ฝึก logic ล้วน ๆ
- **MainMenu** — เพิ่ม Sandbox Mode ใน menu หลัก
- **PWA** — ติดตั้ง `vite-plugin-pwa` + manifest + service worker + SVG icon (192/512)
- **index.html** — อัปเดต title, meta tags, viewport-fit=cover, Apple touch icon

---

### v0.20.0 (มีนาคม 2026)

**Phase 3 — Auto-grading & Analytics**
- **Auto-grading**: score 0–100 ต่อด่าน (HP%×0.6 + NodeEfficiency×0.4) บันทึกใน Firestore `levelScores`
- **Teacher Analytics tab**: class avg score, per-level bar chart, รายชื่อนักเรียนต้องช่วย (avg < 60)
- **Teacher Student list**: แสดงชื่อ-นามสกุล, อีเมล, avg score badge ต่อคน
- **Admin Users tab**: ดู users ทั้งหมด พร้อม role/email/score/progress
- `users` collection เก็บข้อมูลจริงครบ: firstName, surname, email, role, levelScores

---

### v0.19.0 (มีนาคม 2026)

**Phase 2 — ปวส. Curriculum (10 ด่านใหม่)**
- **level_21** Nested Decisions — if/else ซ้อนกัน 2 ชั้น (Ailment + HP พร้อมกัน)
- **level_22** Counter Intelligence — Multi-Condition Loop (Turn + HP ใน Loop เดียวกัน)
- **level_23** Tri-Ailment Dragon — จัดการ Burn + Poison + Freeze ทั้ง 3 พร้อมกัน
- **level_24** Skill Optimizer — Class Skill Timing เจาะ Armor สูง
- **level_25** Priority Protocol — เรียงลำดับ Condition ให้ถูกต้อง (Priority Queue)
- **level_26** Infinite Regress — Dual Exit Condition Loop (enemy_alive + turn_gte)
- **level_27** Enrage Protocol — รับมือ Enemy State Change (Enrage < 40% HP)
- **level_28** Efficiency Challenge — ออกแบบ Flowchart ใช้ Node น้อยที่สุด
- **level_29** The Architect's Trial — Sub-Boss ใช้ทุก Condition Type
- **level_30** Grand Architect — ปวส. Final Boss (Void Emperor, 1000 HP, budget/turn 4)

---

### v0.18.4 (มีนาคม 2026)

**Testing & Version Correction**
- **Unit Tests** — เพิ่ม test สำหรับ `levelSystem` (15 tests) และ `achievements` (24 tests) รวม 61 unit tests ทั้งหมด
- **Pre-commit Hook** — รัน `npm test` อัตโนมัติก่อนทุก commit ถ้า fail → abort
- **CLAUDE.md** — เพิ่ม Testing section + Version management rules
- **Version correction** — แก้ไข version regression จาก v0.17.2–0.17.4 → v0.18.2–0.18.4

---

### v0.18.3 (มีนาคม 2026)

**Security & Validation**
- **loginAnonymous** — validate firstName/surname 1–50 chars (ป้องกัน storage abuse)
- **savePlayerProgress** — ตรวจ levelId ว่าอยู่ใน LEVELS จริง (ป้องกัน fake level injection)
- **TeacherDashboard** — ไม่อนุญาตตั้ง assignment deadline เป็นอดีต
- **Firestore rules** — assignment: deadline > now(), title 1–200 chars, levelIds ≤ 20

---

### v0.18.2 (มีนาคม 2026)

**Security Hardening**
- **Firestore rules** — แยก `get` / `list` permission: students อ่านได้เฉพาะ doc ตัวเอง, teacher/admin list ได้
- **BattleScreen** — เพิ่ม character guard: ไม่มี character → redirect `/character` (ปิด demo exploit)
- **AdminDashboard** — เพิ่มปุ่มกลับ home + try/catch บน loadStats
- **LevelSelect** — ลบ Endless Mode card ที่ comment ออก (dead code)

---

### v0.18.1 (มีนาคม 2026)

**UX & Features**
- **Flowchart Save Indicator** — แสดงสถานะ ↻ กำลังบันทึก / ☁️ บันทึกแล้ว ✓ ใน BattleScreen toolbar
- **AchievementsPage** — หน้าแสดง achievement ทั้งหมด (`/achievements`): progress bar, locked = ???
- **MainMenu** — เพิ่มปุ่ม Achievements ใน menu

---

### v0.18.0 (มีนาคม 2026)

**Phase 1 — LMS Foundation เสร็จสมบูรณ์**
- **Assignment System** — ครูสร้างงานในแต่ละห้องเรียน: เลือกด่าน + ตั้ง deadline
- **Teacher Dashboard** — tab "งานที่มอบหมาย" สร้าง/ลบงาน, เลือกด่าน D1–D30, date picker
- **Student MainMenu** — แสดง "งานที่ต้องส่ง" พร้อม progress (X/N ด่าน), สี overdue แดง
- **Firestore rules** — `assignments` collection: teacher create, teacher/admin delete, all read

---

### v0.17.1 (มีนาคม 2026)

**Bug Fixes**
- **Level Access Guard** — ป้องกันผู้เล่นพิมพ์ URL ตรงเพื่อข้ามด่านที่ยังไม่ปลดล็อก — redirect กลับ Level Select พร้อม `replace: true`
- Invalid levelId (ไม่มีในระบบ) ก็ถูก redirect เช่นกัน

---

### v0.17.0 (มีนาคม 2026)

**Roles & Access Control**
- **Admin Role** — `role: 'admin'` เข้าถึงได้ทุก route, ไม่ถูก redirect บังคับ
- **Admin Dashboard** (`/admin`) — สร้าง/ลบ Teacher Invite Code, ดู stats (users, classrooms, codes)
- **Upgrade to Teacher** — บัญชีนักเรียนที่มีอยู่แล้ว upgrade เป็นครูได้จาก Main Menu โดยใช้ invite code
- **Route Guard** — non-admin ถูก redirect ออกจาก `/admin`, non-teacher ถูก redirect ออกจาก `/teacher`
- **Block role self-escalation** — Firestore rules ป้องกันไม่ให้ user เปลี่ยน role ตัวเองเป็น admin ผ่าน client
- **TOCTOU fix** — ใช้ Firestore `runTransaction` ป้องกัน race condition บน invite code claim

---

### v0.16.0 (มีนาคม 2026)

**Teacher / LMS (Phase 1)**
- **Teacher Role** — สมัครบัญชีครูด้วย Invite Code, redirect ไป Teacher Dashboard อัตโนมัติ
- **Classroom** — ครูสร้างห้องได้ รหัส 6 หลัก, นักเรียน join จาก Main Menu
- **Teacher Dashboard** — ดูรายชื่อนักเรียน, ด่านที่ผ่าน, Progress bar, วันที่เล่นล่าสุด

---

### v0.15.0 (มีนาคม 2026)

**UX / UI**
- **Dark Medieval Theme** — palette ใหม่ navy กลางคืน + ขอบทอง, font Cinzel + Sarabun
- **Volume Slider** — ปุ่ม 🔊 เปิด popup ปรับ BGM / SFX แยก + mute toggle
- **BGM autoplay retry** — หลัง F5 เพลง resume ทันทีที่ user interaction แรก
- **Keyboard shortcuts** — Space = Run, R = Retry, Esc = Stop
- **Undo / Redo** — Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z, history 50 steps

---

### v0.14.0 (มีนาคม 2026)

**Battle & Editor**
- **Sprite idle animation** — hero ลอยขึ้นลง, enemy ลอยพร้อม rotate, hero กระพริบแดงเมื่อ HP < 30%
- **Learning Objective popup** — หลังชนะแต่ละด่านแสดง concept ที่เพิ่งเรียนรู้
- **Save / Load per level** — auto-save nodes/edges ใน Firestore (debounce 800ms)
- **Tooltip บน Action Block** — hover แสดงคำอธิบายแต่ละ action (ครบ 22 types)
- **Achievement System** — 8 achievements, ตรวจหลังชนะ, toast popup ทีละอัน

---

### v0.13.0 (มีนาคม 2026)

- **Vitest unit tests** — 22 test cases ครอบคลุม FlowchartEngine core logic
- **GitHub Actions CI** — TypeScript check → Unit Test → Build ทุก push/PR
- **CLAUDE.md + ROADMAP.md** — เอกสารกระบวนการทำงานและแผนพัฒนา

---

### v0.12.3 (มีนาคม 2026)

- **Team Credits** — เพิ่มชื่อทีมงานใน LICENSE, README, Login และ Main Menu
- **Version single source of truth** — ดึง version จาก `package.json` อัตโนมัติ
- **Lazy loading routes** — ลด initial bundle จาก 558 KB → 271 KB (-51%)
- **MIT License**

---

### v0.12.2 (มีนาคม 2026)

- **Background images ครบทุกด่าน** — `level_1.jpg`–`level_20.jpg` + `infinity_dev.jpg`
- **Enemy Sprites ครบ level 16–20** — Vampire Lord, Frost Titan, Dark Commander, Lich Lord, Dark Overlord

---

### v0.12.1 (มีนาคม 2026)

- จัดโครงสร้างโปรเจกต์ — ย้าย `soundManager.ts` → `services/`
- Rename enemy sprites เป็น kebab-case

---

### v0.12.0 (มีนาคม 2026)

- **Campaign Speedrun Leaderboard** — tab "Speedrun" จับเวลา wall clock ตั้งแต่ด่านแรกถึงด่านสุดท้าย

---

### v0.11.0 (มีนาคม 2026)

- **Sound System** — BGM + SFX + Voice (Menu / Level Select / Battle / Endless)
- Convert WAV → MP3 128kbps ลดขนาดจาก **5.2 GB → 25 MB**

---

### v0.10.0 (มีนาคม 2026)

- **Daily Farm Diminishing Returns** — รีเซ็ตทุกเที่ยงคืน UTC+7
- LevelSelect แสดง efficiency badge (100% / 50% / 25% / 10%) + countdown
- **Enemy Budget System** — enemy โจมตีหลายครั้งต่อ turn ตาม `budgetPerTurn`
- **Pre-set Hero Status** — ด่าน 7 hero เริ่มติด Poison, ด่าน 8 เริ่มติด Freeze

---

### v0.9.0 (มีนาคม 2026)

- **Tutorial rework** — 20 ด่าน Sequence → Decision → Loop → Combine → Mastery
- **Draggable Tutorial Guide** — hint panel ลากย้ายได้
- **Diminishing Returns** — XP/Gold ลดเมื่อ clear ด่านซ้ำ (100% → 50% → 25% → 10%)

---

### v0.8.0

- **BagButton** — overlay กระเป๋า เข้าถึงได้จากทุกหน้า
- **Daily Restock** — potion/antidote ฟรีทุก 8 ชั่วโมง

---

### v0.7.0

- **Turn-based system** — planning → running → enemy_turn → resolution
- **Budget system** — 3 💎/turn, ACTION_COST per node
- **Enemy Shield** — บล็อก damaging action ถ้าขาด required blocks
- **Class Skills** — 3 skills/class, lock ตาม character level

---

### v0.6.0

- **Post-battle ShopScreen** — ซื้อ consumable + equipment หลังชนะด่าน

---

### v0.5.0

- **Shop system** — Gold ได้จากชนะด่าน บันทึก Firestore

---

### v0.4.0

- **Equipment system** — 40+ ชิ้น, 4 slots
- **Leaderboard** — overall + per-level + endless mode
- Loop guard ป้องกัน infinite loop

---

### v0.3.0

- Right-click **context menu** บน node/edge/canvas (3 ระดับ, Windows-style)

---

### v0.2.0

- **Condition** และ **Loop** node
- **Objective system** + Tutorial text ต่อด่าน

---

### v0.1.0

- ระบบต่อสู้พื้นฐาน Hero vs Enemy
- Flowchart Editor: Start / End / Action node
- 4 Character Classes: Knight / Mage / Rogue / Barbarian
- Level system: XP, Level 1–100
- Firebase Auth: Email, Google, Anonymous
- Endless Mode (wave scaling)
