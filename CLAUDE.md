# FlowFight — Working Agreement

กฎและกระบวนการที่ใช้ทุกครั้งเมื่อทำงานในโปรเจกต์นี้

---

## Stack

- React 19 + TypeScript + Vite
- ReactFlow, Zustand, Firebase (Auth + Firestore), Tailwind v4
- Vitest (unit test), GitHub Actions (CI)

---

## กระบวนการทำงาน (ทำตามลำดับทุกครั้ง)

### 1. วิเคราะห์ก่อนลงมือ
- อ่านไฟล์ที่เกี่ยวข้องก่อนแก้เสมอ — ห้ามเดาโครงสร้าง
- ถ้า scope ใหญ่ ให้สร้าง todo list ก่อนเริ่ม

### 2. พัฒนา
- แก้เฉพาะสิ่งที่ถูกขอ ไม่เพิ่มฟีเจอร์นอกเหนือ
- ไม่เพิ่ม comment/docstring ในโค้ดที่ไม่ได้แก้
- ใช้ `npm run build` ตรวจทุกครั้งก่อนส่งผล

### 3. ทดสอบ
- `npm test` — รัน unit test ทุกครั้งหลังแก้ engine logic
- ถ้าแก้ Firestore rules ให้รัน `firebase deploy --only firestore:rules` ด้วย
- ถ้าแก้ game logic ให้เขียน/อัปเดต test ใน `src/engines/*.test.ts`

### 4. Version & Documentation
- bump version ใน `package.json` ตาม Semantic Versioning:
  - `patch` (x.x.**1**) — bugfix, เปลี่ยนเล็กน้อย
  - `minor` (x.**1**.0) — ฟีเจอร์ใหม่ backward compatible
  - `major` (**1**.0.0) — เปลี่ยนแปลงใหญ่ breaking change
- อัปเดต `README.md` changelog ทุกครั้งที่ bump version
- อัปเดต `ROADMAP.md` ถ้ามีฟีเจอร์ที่ทำเสร็จแล้ว

### 5. Commit Message
รูปแบบ: `type: สิ่งที่ทำ (vX.X.X)`

| type | ใช้เมื่อ |
|---|---|
| `feat` | เพิ่มฟีเจอร์ใหม่ |
| `fix` | แก้บัก |
| `docs` | แก้เอกสาร README/ROADMAP |
| `refactor` | ปรับโครงสร้างโค้ดโดยไม่เปลี่ยน behavior |
| `test` | เพิ่ม/แก้ test |
| `chore` | งานดูแลระบบ (deps, config, CI) |
| `security` | แก้ช่องโหว่ความปลอดภัย |

ตัวอย่าง:
```
feat: add achievement system and flowchart save/load (v0.14.0)
fix: handle highlight not persisting after mouse release (v0.10.1)
security: tighten Firestore rules with field validation and range checks
```

---

## กฎเพิ่มเติม

- **ภาษา**: ตอบเป็นภาษาไทย ยกเว้น code และ commit message
- **ไม่สรุปท้าย response** — ผู้ใช้อ่าน diff เองได้
- **ถามก่อนทำ** เมื่อ scope ไม่ชัดเจน หรืองานมีความเสี่ยงสูง (ลบไฟล์, แก้ rules, deploy)
- **Firestore rules** — ต้อง deploy ทุกครั้งที่แก้ `firestore.rules`:
  ```bash
  firebase deploy --only firestore:rules
  ```
- **ไม่ commit ให้อัตโนมัติ** — บอกข้อความ commit แล้วให้ผู้ใช้ทำเอง

---

## โครงสร้างสำคัญ

```
src/
  engines/          ← game logic (FlowchartEngine, ShopEngine)
  components/
    Battle/         ← BattleScreen หลัก
    FlowchartEditor/← editor + CustomNodes
    UI/             ← Leaderboard, MainMenu, Login
  services/         ← authService, soundManager, firebaseService
  stores/           ← Zustand stores
  utils/            ← constants, levelSystem, achievements
  types/            ← game.types.ts

public/
  backgrounds/      ← level_1.jpg – level_20.jpg + infinity_dev.jpg
  characters/       ← knight/mage/rogue/barbarian.png
  enemies/          ← enemy sprites
```

---

## ห้ามทำ

- ❌ แก้ไฟล์โดยไม่ได้อ่านก่อน
- ❌ ลบไฟล์โดยไม่ยืนยันกับผู้ใช้
- ❌ Push หรือ deploy โดยไม่ได้รับอนุญาต
- ❌ เพิ่ม mana/MP ให้ hero (ระบบใช้ Budget 💎 เท่านั้น)
- ❌ Commit โดยอัตโนมัติ
