# FlowFight — Flowchart Battle RPG

เกม RPG เพื่อการศึกษาที่ผู้เล่นสร้าง **Flowchart** เพื่อควบคุม hero ในการต่อสู้
ไม่ใช่แค่กด Attack — คุณต้องออกแบบ algorithm ด้วยกล่องลาก-วาง!

---

## สารบัญ

- [Requirements](#requirements)
- [ติดตั้งและรันในเครื่อง](#ติดตั้งและรันในเครื่อง)
- [ตั้งค่า Firebase](#ตั้งค่า-firebase)
- [วิธีเล่น](#วิธีเล่น)
- [Flowchart Blocks](#flowchart-blocks)
- [Class Skills](#class-skills)
- [ระบบตัวละครและ Level](#ระบบตัวละครและ-level)
- [Shop System](#shop-system)
- [Deploy ขึ้น Firebase Hosting](#deploy-ขึ้น-firebase-hosting)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ด่านทั้งหมด (20 ด่าน)](#ด่านทั้งหมด-20-ด่าน--endless)
- [สถานะระบบ](#สถานะระบบ)
- [Changelog](#changelog)
- [Team](#team)

---

## Requirements

- [Node.js](https://nodejs.org) v18 ขึ้นไป
- npm v9+
- บัญชี [Firebase](https://firebase.google.com) (ฟรี Spark plan ได้)
- (สำหรับ deploy) Firebase CLI

---

## ติดตั้งและรันในเครื่อง

```bash
# 1. Clone หรือ download โปรเจกต์
cd flowfight

# 2. ติดตั้ง dependencies
npm install

# 3. ตั้งค่า Firebase config (ดูหัวข้อถัดไป)

# 4. รัน dev server
npm run dev
# เปิดเบราว์เซอร์ไปที่ http://localhost:5173
```

---

## ตั้งค่า Firebase

### 1. สร้าง Firebase Project

1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. **Add project** → ตั้งชื่อ → สร้าง
3. **Project Settings** → แท็บ **General** → **Your apps** → คลิก Web (`</>`)
4. ตั้งชื่อ app → **Register app** → คัดลอก config object

### 2. เปิด Authentication

1. **Authentication** → **Get started**
2. **Sign-in method** → เปิด **Google** และ/หรือ **Email/Password**

### 3. สร้าง Firestore Database

1. **Firestore Database** → **Create database**
2. เลือก **Start in test mode** (ระหว่างพัฒนา)
3. Region: `asia-southeast1` หรือใกล้เคียง

### 4. ใส่ config ในโปรเจกต์

**4a. Firebase project pointer** — copy `.firebaserc.example` แล้วแก้ project ID:

```bash
cp .firebaserc.example .firebaserc
```

แก้ `your-firebase-project-id` ใน `.firebaserc` เป็น project ID ของตัวเอง (ดูได้จาก Firebase Console → Project Settings)

> **อย่า commit ไฟล์ `.firebaserc`** — มีอยู่ใน `.gitignore` แล้ว

**4b. Firebase SDK config** — สร้างไฟล์ `.env` (copy จาก `.env.example`) แล้วใส่ค่าจาก Firebase:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

> **อย่า commit ไฟล์ `.env`** — มีอยู่ใน `.gitignore` แล้ว

### Firestore Security Rules

Rules อยู่ในไฟล์ `firestore.rules` ที่ root โปรเจกต์ — deploy ด้วย:

```bash
firebase deploy --only firestore:rules
```

> Rules ใช้ระบบ Role-based (student / teacher / admin) พร้อม input validation bounds บน leaderboard data

### 5. ตั้งค่า Admin Account (ครั้งแรก)

Admin account ต้องตั้งค่าผ่าน Firebase Console เท่านั้น:

1. **Firebase Console** → **Firestore** → `users/{uid}`
2. แก้ field `role` เป็น `"admin"`

Admin สามารถสร้าง Teacher Invite Code ได้จาก Admin Dashboard ในแอป

---

## วิธีเล่น

### ขั้นตอนเริ่มต้น

1. **Login** ด้วย Google หรือ Email/Password
2. **สร้างตัวละคร** → เลือกอาชีพ, Equipment, สีตัวละคร
3. **เลือกด่าน** จากหน้า Level Select (ปลดล็อกตามลำดับ)
4. **สร้าง Flowchart** ในครึ่งล่างของหน้าจอ
5. กด **Execute Turn** เพื่อรัน hero ตาม flowchart

### หน้าจอระหว่างเล่น

หน้าจอแบ่งเป็น 2 ส่วน:
- **ครึ่งบน** — Battle Arena: HP bars, battle log, ailment status, enemy intent
- **ครึ่งล่าง** — Flowchart Editor: วาง/เชื่อม block ก่อนกด Execute

### การสร้าง Flowchart

- **คลิกขวา** บน canvas ว่าง → เมนู 3 ระดับสำหรับเพิ่ม block
  - Level 1: Process / Decision / Class Skills
  - Level 2: หมวดหมู่ (Combat / Support / HP / Ailment / Status / Counter)
  - Level 3: action หรือ condition ที่ต้องการ
- **ลาก** จุด handle ที่ขอบ node เพื่อเชื่อม edge
- **คลิกขวา** บน node → เปลี่ยน Action, คัดลอก, หรือลบ
- **Del** — ลบ node/edge ที่เลือก

ทุก Flowchart **ต้องมี Start → ... → End** จึงจะ Execute ได้

### ปุ่มควบคุม

| ปุ่ม | ความหมาย |
|------|----------|
| Execute Turn | รัน flowchart 1 รอบ (hero turn) |
| Stop | หยุดกลางคัน |
| 1x / 2x / 3x | ปรับความเร็ว animation |
| Reset | เริ่มด่านใหม่ |

---

## Flowchart Blocks

### Process (Action)

| Action | 💎 | ผล |
|--------|----|----|
| Attack | 1 | โจมตีพื้นฐาน |
| Power Strike | 2 | โจมตี 2x, cooldown 2 turns |
| Dodge | 1 | หลบการโจมตีถัดไป |
| Cast Spell | 2 | magic damage ทะลุ armor |
| Heal | 1 | ฟื้น HP (จำกัด 3 ครั้ง/battle) |
| Berserk | 1 | ATK+50%, DEF-30% เป็น 2 turns |
| Use Potion | 1 | ฟื้น HP จำนวนมาก (ต้องซื้อ) |
| Use Antidote | 1 | ล้าง Poison (ต้องซื้อ) |
| Debug Block | 0 | ลบ Virus nodes ออกจาก canvas |

> **💎 Budget** — แต่ละ turn มี 3 💎 ถ้า flowchart รวมเกิน 3 💎 จะแจ้งเตือน

### Decision (Condition)

เมนูเงื่อนไขแบ่งเป็น 4 หมวด:

**HP** — `HP < 50?` / `HP > 50?`

**Ailment (สถานะ)**
| เงื่อนไข | YES เมื่อ |
|----------|----------|
| ฉัน Burning? | hero ติด Burn |
| ศัตรู Burning? | ศัตรูติด Burn |
| ฉัน Poisoned? | hero ติด Poison |
| ศัตรู Poisoned? | ศัตรูติด Poison |
| ฉัน Frozen? | hero ติด Freeze |
| ศัตรู Frozen? | ศัตรูติด Freeze |

**Status**
| เงื่อนไข | YES เมื่อ |
|----------|----------|
| Enemy Alive? | ศัตรูยังมีชีวิต |
| Enemy Stunned? | ศัตรูติด Stun |
| Virus Present? | มี Virus node บน canvas |

**Counter** — `Turn ≥ N?`

---

## Class Skills

แต่ละ class มี 3 สกิลพิเศษ ปลดล็อกตาม character level
ใส่ใน flowchart ผ่านเมนู **Class Skills** (คลิกขวา → Class Skills)

| Class | Skill | Lv | 💎 | ผล |
|-------|-------|----|----|----|
| Knight | Iron Shield | 1 | 1 | ลด damage ที่รับ 50% |
| Knight | Counter | 3 | 2 | สะท้อน 40% damage กลับ |
| Knight | War Cry | 5 | 2 | ATK+40% / DEF-15% เป็น 2 turns |
| Mage | Fireball | 1 | 2 | Fire damage + 40% โอกาสติด Burn |
| Mage | Frost Nova | 3 | 2 | Magic damage + Freeze enemy 1 turn |
| Mage | Arcane Surge | 5 | 3 | Massive burst ทะลุ armor+DEF ทั้งหมด |
| Rogue | Backstab | 1 | 2 | ดาเมจ 2x ถ้าศัตรูติด Freeze/Stun |
| Rogue | Poison Strike | 3 | 1 | โจมตี + ติด Poison 3 รอบ |
| Rogue | Shadow Step | 5 | 2 | Evade + โจมตีหลังหลบ (guaranteed hit) |
| Barbarian | Whirlwind | 1 | 2 | โจมตี 3 ครั้ง (ดาเมจ -30%/ครั้ง) |
| Barbarian | Bloodthirst | 3 | 2 | โจมตี + ฮีล 50% ของดาเมจที่ทำ |
| Barbarian | Battle Cry | 5 | 3 | Berserk 3 turns + Stun ศัตรู 1 turn |

> สกิลที่ยังไม่ถึง level จะแสดงใน menu แต่มี 🔒 Lv.X และกดไม่ได้

---

## ระบบตัวละครและ Level

### 4 Classes

| Class | HP | ATK | DEF | SPD | บทบาท |
|-------|----|-----|-----|-----|-------|
| Knight | สูง | ปกติ | สูง | ปกติ | Tank — ทนดาเมจสูงสุด |
| Mage | ต่ำ | สูงมาก | ต่ำ | ปกติ | Glass Cannon — ดาเมจสูงสุด |
| Rogue | ปกติ | ปกติ | ต่ำ | สูง | Speedster — เร็ว คล่องแคล่ว |
| Barbarian | สูงมาก | สูง | ปกติ | ต่ำ | Berserker — พละกำลังดิบ |

### Stat Growth ต่อ Level

| Class | HP/Lv | ATK/Lv | DEF/Lv | SPD/Lv |
|-------|-------|--------|--------|--------|
| Knight | +15 | +1 | +2 | — |
| Mage | +8 | +3 | — | +1 |
| Rogue | +8 | +2 | — | +2 |
| Barbarian | +18 | +2 | +1 | — |

### XP ที่ต้องการแต่ละ Level (Level 1–10)

| Level | XP รวม | รับได้จากด่าน |
|-------|--------|-------------|
| 2 | 100 | ด่าน 1–2 |
| 3 | 250 | ด่าน 1–3 |
| 4 | 450 | ด่าน 1–4 |
| 5 | 700 | ด่าน 1–5 |
| 6 | 1,000 | ด่าน 1–7 |
| 7 | 1,400 | ด่าน 1–9 |
| 8 | 1,900 | ด่าน 1–11 |
| 9 | 2,500 | ด่าน 1–13 |
| 10 (MAX) | 3,200 | ด่าน 1–15 |

### Passive Bonuses (ปลดล็อกอัตโนมัติ)

| Class | Lv.2 | Lv.4 | Lv.6 |
|-------|------|------|------|
| Knight | DEF+3 | DEF+5 HP+10 | ATK+3 DEF+8 |
| Mage | ATK+4 | ATK+7 SPD+1 | ATK+10 SPD+1 |
| Rogue | SPD+2 | ATK+5 SPD+2 | ATK+8 SPD+3 |
| Barbarian | HP+15 | ATK+5 HP+20 | ATK+8 HP+30 |

---

## Shop System

ซื้ออุปกรณ์ด้วย **Gold** ที่ได้จากการชนะด่าน

| Slot | ตัวอย่าง |
|------|--------|
| Weapon | Iron Sword / Magic Staff / Twin Daggers / Hand Axe |
| Armor | Chain Mail / Cloth Robe / Leather Vest / Bear Pelt |
| Helmet | Iron Helmet / Wizard Hat / Scout Hood / Skull Cap |
| Accessory | Ring of Health / Boots of Swiftness / Amulet of Focus |

- อุปกรณ์ส่วนใหญ่ใช้ได้เฉพาะ class ตัวเอง
- Accessory บางชิ้นใช้ได้ทุก class
- Rarity: Common / Uncommon / Rare / Epic / Legendary
- มีเงื่อนไข `requiredLevel` สำหรับบางชิ้น

---

## Deploy ขึ้น Firebase Hosting

### ครั้งแรก

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# public directory: dist
# single-page app: Yes
# overwrite dist/index.html: No
```

### Build และ Deploy

```bash
npm run build
firebase deploy --only hosting
# Hosting URL: https://your-project-id.web.app
```

### Deploy ครั้งถัดไป

```bash
npm run build && firebase deploy --only hosting
```

---

## โครงสร้างโปรเจกต์

```
src/
├── components/
│   ├── Auth/
│   │   └── LoginPage.tsx           — Firebase Auth (Google + Email)
│   ├── Battle/
│   │   └── BattleScreen.tsx        — หน้าหลัก: arena + flowchart editor
│   ├── Character/
│   │   └── CharacterCustomizer.tsx — เลือก class / equipment / สี
│   ├── FlowchartEditor/
│   │   ├── FlowchartEditor.tsx     — canvas + context menu 3 ระดับ
│   │   └── CustomNodes/            — ActionNode, ConditionNode, LoopNode, ...
│   ├── Shop/
│   │   ├── ShopScreen.tsx          — shop popup หลังชนะด่าน
│   │   └── ShopPage.tsx            — หน้า shop แบบ standalone
│   └── UI/
│       ├── LevelSelect.tsx         — เลือกด่าน + แสดงสถานะ unlock
│       ├── MainMenu.tsx            — หน้าแรกหลัง login
│       ├── Leaderboard.tsx         — global + per-level + speedrun leaderboard
│       ├── ModeSelect.tsx          — เลือก Campaign / Endless
│       └── ThemeToggle.tsx         — สลับ Light / Dark theme
├── modes/
│   └── InfinityDev/
│       ├── InfinityDevScreen.tsx   — Endless Mode UI
│       └── InfinityDevBattle.tsx   — Endless Mode battle logic
├── engines/
│   ├── FlowchartEngine.ts          — parse + validate + execute flowchart
│   └── ShopEngine.ts               — คำนวณ stat bonus จาก equipment
├── hooks/
│   ├── useBattle.ts                — orchestrate battle (execute / stop / restart)
│   └── useAuth.ts                  — Firebase auth state
├── stores/
│   ├── gameStore.ts                — Player + Character global state (Zustand)
│   ├── battleStore.ts              — HP, log, ailment, executing state
│   ├── flowchartStore.ts           — nodes, edges, executionLog, visitedTrace
│   ├── shopStore.ts                — gold, potions, antidotes, equipment bonus
│   └── characterStore.ts           — character builder state
├── services/
│   ├── authService.ts              — Firestore read/write (progress, leaderboard)
│   ├── characterService.ts         — character save/load (Firestore)
│   ├── soundManager.ts             — BGM / SFX / Voice singleton
│   └── firebaseService.ts          — Firebase init + config
├── contexts/
│   └── ThemeContext.tsx            — Light/Dark theme + color tokens
├── types/
│   ├── game.types.ts               — TypeScript interfaces ทั้งหมด
│   └── firebase.types.ts           — Firestore document types
└── utils/
    ├── constants.ts                — LEVELS, CLASS_SKILLS, WEAPONS, ARMORS, ...
    └── levelSystem.ts              — gainXP(), levelProgressPct(), LEVEL_XP_TABLE

public/
├── characters/                     — knight.png, mage.png, rogue.png, barbarian.png
├── enemies/                        — sprite ศัตรูทุกด่าน (kebab-case .png)
└── backgrounds/                    — level_1.jpg – level_20.jpg + infinity_dev.jpg
```

---

## ด่านทั้งหมด (20 ด่าน + Endless)

ด่านออกแบบให้สอน Flowchart แบบสะสมตามลำดับ:
**Sequence → Decision (HP → Ailment → Counter) → Loop → Combine → Mastery**

### หมวด 1: Sequence (ด่าน 1–3)

| # | ชื่อด่าน | ศัตรู | Concept |
|---|---------|------|---------|
| 1 | The Slime Cave | Slime | Sequence พื้นฐาน — ต่อ block เป็นเส้นตรง |
| 2 | Heal Up! | Bigger Slime | Process มีหลายประเภท — เพิ่ม Heal ใน Sequence |
| 3 | Dodge Roll | Goblin Scout | Dodge — เลือก action ที่เหมาะสม |

### หมวด 2: Decision — HP Condition (ด่าน 4–6)

| # | ชื่อด่าน | ศัตรู | Concept |
|---|---------|------|---------|
| 4 | Heal When Low | Goblin | If/Else — HP < 50? Heal : Attack |
| 5 | Spider Den | Spider | Nested Condition — เงื่อนไขซ้อนกัน |
| 6 | Forest Wraith | Forest Wraith | HP > 50? Cast Spell เมื่อ HP สูง |

### หมวด 3: Decision — Ailment Condition (ด่าน 7–8)

| # | ชื่อด่าน | ศัตรู | Concept |
|---|---------|------|---------|
| 7 | Orc's Poison | Orc Warrior | Hero Poisoned? — ตรวจสถานะตัวเองด้วย Condition |
| 8 | Frozen in Place | Kobold | Hero Frozen? + Dodge — รับมือ Ailment |

### หมวด 4: Decision — Counter (ด่าน 9–10)

| # | ชื่อด่าน | ศัตรู | Concept |
|---|---------|------|---------|
| 9 | Turn Counter | Goblin Knight | Turn ≥ N? — Power Strike ในเวลาที่ถูกต้อง |
| 10 | Troll Rampage | Stone Troll | Counter + HP Threshold ซ้อนกัน |

### หมวด 5: Loop (ด่าน 11–13)

| # | ชื่อด่าน | ศัตรู | Concept |
|---|---------|------|---------|
| 11 | While Loop | Orc | Enemy Alive? — วนโจมตีจนศัตรูตาย |
| 12 | Loop + Heal | Ice Giant | Loop + HP Decision ข้างใน |
| 13 | Dragon's Counter | Dragon's Lair | Loop + Counter — burst ทุก N รอบ |

### หมวด 6: Combine (ด่าน 14–15)

| # | ชื่อด่าน | ศัตรู | Concept |
|---|---------|------|---------|
| 14 | Dragon's Fury | Dragon's Lair | Loop + Ailment + HP + Counter รวมกัน |
| 15 | The Warlord Returns | Orc Warrior | Full Algorithm — ทุก concept รวมกัน |

### หมวด 7: Mastery (ด่าน 16–20)

| # | ชื่อด่าน | ศัตรู | Concept |
|---|---------|------|---------|
| 16 | Vampire's Curse | Vampire Lord | Class Skills + Ailment |
| 17 | Frost Titan | Frost Titan | Counter Precision |
| 18 | Dark Commander | Dark Commander | ออกแบบ Algorithm เองทั้งหมด |
| 19 | The Lich Lord | The Lich Lord | **Sub-BOSS** — Mastery ทุก Ailment |
| 20 | The Dark Overlord | The Dark Overlord | **FINAL BOSS** — ทุก concept |
| ∞ | **Endless Mode** | Wave ∞ | Survival — score = Wave × HP% |

> แต่ละด่านมี **requiredBlocks** — ถ้าไม่มี block ที่กำหนด ศัตรูจะ Shield ป้องกันการโจมตีทุกครั้ง

---

## สถานะระบบ

> อัปเดต: มีนาคม 2026 | v0.17.1 | [เล่นออนไลน์](https://project-rpg-flowchart.web.app/)

### สิ่งที่พัฒนาแล้ว

- [x] FlowchartEngine — validate + execute ครบ (loop detection, SCC algorithm)
- [x] Battle System — HP / Armor / Parry / Dodge / Ailment / Enrage / Combo
- [x] Flowchart Editor — context menu 3 ระดับ, Windows-style submenu positioning
- [x] 💎 Budget System — action points per turn (3 💎/turn), badge บน node
- [x] Enemy Budget System — enemy โจมตีหลายครั้ง/turn ตาม `budgetPerTurn`
- [x] 4 Classes + Class Skills (3 skills/class, unlock ตาม level)
- [x] Passive bonuses (Lv.2 / Lv.4 / Lv.6)
- [x] Character Progression — XP, Level 1–10, stat growth per class
- [x] Shop System — 40+ items, 4 slots, gold rewards จากด่าน
- [x] Equipment stat bonuses ผ่าน ShopEngine
- [x] 20 Campaign Levels + Endless Mode (สอน Sequence → Decision → Loop → Combine → Mastery)
- [x] Pre-set Hero Status ต่อด่าน — ด่านที่สอน ailment hero เริ่มด้วย poison/freeze + HP ต่ำ
- [x] Firebase Auth — Google Sign-In
- [x] Firestore — save player progress, character progress, leaderboard
- [x] Firestore — Potions/Antidotes sync ทุกครั้งหลังสู้ (ชนะ + แพ้)
- [x] Global Leaderboard + Per-level Leaderboard + Campaign Speedrun Leaderboard
- [x] Light / Dark Theme
- [x] Enemy Shield mechanic — ป้องกันเมื่อขาด required blocks (รองรับ Condition-type blocks ด้วย)
- [x] Shield badge icon ตรงกับ context menu — mobile แสดง emoji อย่างเดียว
- [x] Virus mechanic — ไวรัสเกิดใน canvas, Debug Block ลบออก
- [x] Turn-based battle (hero turn → enemy turn → resolution)
- [x] Speed control 1x / 2x / 3x
- [x] Visited node trace — แสดงเส้นทางที่รันหลัง execute
- [x] Endless Wave Mode — wave scaling, score system
- [x] Tutorial Guide — hint panel ลากย้ายได้ (draggable) + 20 ด่านพร้อม guided steps
- [x] Process block menu — แสดงคำอธิบายแต่ละ action ในเมนู context
- [x] **Daily Farm (Diminishing Returns รายวัน)** — บันทึกใน Firestore รีเซ็ตเที่ยงคืน UTC+7
- [x] LevelSelect แสดง efficiency badge (🟢100% / 🟡50% / 🟠25% / 🔴10%) + countdown reset
- [x] Background images ครบทุกด่าน (level_1–20 + infinity_dev) เป็นไฟล์ `.jpg` ชื่อ clean
- [x] Enemy Sprites ครบทุกด่าน รวม level 16–20 (Vampire Lord, Frost Titan, Dark Commander, Lich Lord, Dark Overlord)
- [x] Sound System — BGM + SFX + Voice Pack, Convert WAV → MP3 (5.2 GB → 25 MB)
- [x] Lazy loading routes — initial bundle ลดจาก 558 KB → 271 KB
- [x] Version single source of truth — ดึงจาก `package.json` อัตโนมัติ
- [x] MIT License + Team Credits
- [x] **Achievement System** — 8 achievements, ตรวจหลังชนะ, toast popup แสดงทีละอัน
- [x] **Flowchart Save/Load** — auto-save nodes/edges ต่อด่านใน Firestore, โหลดกลับเมื่อเข้าด่านอีกครั้ง
- [x] **Tooltip บน Action Block** — hover เพื่อดูคำอธิบายแต่ละ action
- [x] **Mute button** — ปุ่ม 🔊/🔇 ใน battle header ปิด/เปิดเสียงได้ทันที
- [x] **Learning Objective popup** — หลังชนะด่านแสดง "คุณเพิ่งเรียนรู้..." พร้อม icon และชื่อ concept
- [x] **Sprite idle animation** — hero/enemy ลอยขึ้นลงเมื่อ idle, hero กระพริบแดงเมื่อ HP < 30%
- [x] **Keyboard shortcuts** — Space = Run, R = Retry, Esc = Stop
- [x] **Flowchart Undo/Redo** — Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z (history 50 steps)
- [x] **Volume slider** — popup จากปุ่ม 🔊 ปรับ BGM และ SFX แยกกัน
- [x] **3 Roles** — student / teacher / admin พร้อม route guard แยกต่างหาก
- [x] **Admin Dashboard** — สร้าง/ลบ Teacher Invite Code, ดู stats จำนวน users + classrooms
- [x] **Upgrade to Teacher** — บัญชีนักเรียนที่มีอยู่แล้ว upgrade เป็นครูได้โดยใช้ invite code
- [x] **Security Hardening** — ป้องกัน role self-escalation, route guard, Firestore transaction บน invite code, classroom create ต้องเป็น teacher/admin
- [x] **Level Access Guard** — ป้องกันการแก้ URL เพื่อข้ามด่านที่ยังไม่ปลดล็อก (redirect กลับ Level Select ทันที)

### แผนพัฒนาในอนาคต

ดู [ROADMAP.md](ROADMAP.md) สำหรับแผน LMS Platform เต็มรูปแบบ รวมถึงสิ่งที่ยังขาดและ Phase การพัฒนาถัดไป

---

## Changelog

### v0.17.1 (มีนาคม 2026)

**Bug Fixes**
- **Level Access Guard** — ป้องกันผู้เล่นพิมพ์ URL ตรงเพื่อข้ามด่านที่ยังไม่ปลดล็อก (เช่น `/battle/level_05` ก่อนผ่านด่าน 4) — redirect กลับ Level Select พร้อม `replace: true`
- Invalid levelId (ไม่มีในระบบ) ก็ถูก redirect เช่นกัน
- Endless mode ไม่ได้รับผลกระทบ

### v0.17.0 (มีนาคม 2026)

**Roles & Access Control**
- **Admin Role** — `role: 'admin'` เข้าถึงได้ทุก route, ไม่ถูก redirect บังคับ
- **Admin Dashboard** (`/admin`) — สร้าง/ลบ Teacher Invite Code, ดู stats (users, classrooms, codes)
- **Upgrade to Teacher** — บัญชีนักเรียนที่มีอยู่แล้ว upgrade เป็นครูได้จาก Main Menu โดยใช้ invite code

**Security Hardening**
- **Route Guard** — non-admin ถูก redirect ออกจาก `/admin`, non-teacher ถูก redirect ออกจาก `/teacher`
- **Block role self-escalation** — Firestore rules ป้องกันไม่ให้ user เปลี่ยน role ตัวเองเป็น admin ผ่าน client (อนุญาตเฉพาะ student→teacher เท่านั้น)
- **Classroom create guard** — เฉพาะ teacher/admin สร้างห้องเรียนได้ (Firestore rules)
- **TOCTOU fix** — ใช้ Firestore `runTransaction` ป้องกัน race condition บน invite code claim
- **Firestore rules ครบถ้วน** — แก้ `hasOnly` ที่ block leaderboard/endlessboard writes, เพิ่ม upper bounds บน stats

**Bug Fixes**
- แก้ `saveLeaderboardEntry` ถูก block (field names ไม่ตรง hasOnly list)
- แก้ `saveEndlessLeaderboardEntry` ถูก block (field names ไม่ตรง hasOnly list)
- แก้ `registerTeacher` ถูก block (Firestore rules ป้องกัน role='teacher' บน new document)
- แก้ `.gitignore` ที่ ignore `firebase.json`, `.firebaserc`, `firestore.rules` ผิดพลาด

### v0.16.0 (มีนาคม 2026)

**Teacher / LMS (Phase 1)**
- **Teacher Role** — สมัครบัญชีครูด้วย Invite Code, redirect ไป Teacher Dashboard อัตโนมัติ
- **Teacher Register Page** — หน้าสมัครบัญชีครูแยกต่างหาก (`/teacher-register`)
- **Classroom** — ครูสร้างห้องได้ รหัส 6 หลัก, นักเรียน join จาก Main Menu
- **Teacher Dashboard** — ดูรายชื่อนักเรียน, ด่านที่ผ่าน, Progress bar, วันที่เล่นล่าสุด

**Infrastructure**
- **Firestore rules** — เพิ่ม rule สำหรับ `teacher_codes` + `classrooms`

### v0.15.0 (มีนาคม 2026)

**UX / UI**
- **Dark Medieval Theme** — palette ใหม่ navy กลางคืน + ขอบทอง, font Cinzel (EN heading) + Sarabun (ไทย)
- **Volume Slider** — ปุ่ม 🔊 เปิด popup ปรับ BGM / SFX แยก + mute toggle, รองรับทุกหน้า (Main Menu, Level Select, Battle, Endless)
- **Volume restore after unmute** — เพลงกลับมาต่อจากเพลงเดิมทันที ไม่ต้องเริ่มใหม่
- **BGM autoplay retry** — หลัง F5 เพลง resume ทันทีที่ user interaction แรก (รองรับ Browser Autoplay Policy)

**Battle**
- **Keyboard shortcuts** — Space = Run, R = Retry, Esc = Stop
- **Mute button** — ปุ่ม 🔊/🔇 ใน battle header

**Flowchart Editor**
- **Undo / Redo** — Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z, history 50 steps

### v0.14.0 (มีนาคม 2026)

**Battle**
- **Sprite idle animation** — hero ลอยขึ้นลง, enemy ลอยพร้อม rotate, hero กระพริบแดงเมื่อ HP < 30%
- **Learning Objective popup** — หลังชนะแต่ละด่านแสดง concept ที่เพิ่งเรียนรู้ (🔁 Loop / ↕️ If-Else / 🧠 Algorithm ฯลฯ)

**Flowchart Editor**
- **Save / Load per level** — auto-save nodes/edges ใน Firestore (debounce 800ms), โหลดกลับเมื่อเข้าด่านอีกครั้ง
- **Tooltip บน Action Block** — hover แสดงคำอธิบายแต่ละ action (ครบ 22 types)

**Achievement & Progression**
- **Achievement System** — 8 achievements, ตรวจหลังชนะ, toast popup ทีละอัน, บันทึก Firestore

### v0.13.0 (มีนาคม 2026)

**Infrastructure**
- **Vitest unit tests** — 22 test cases ครอบคลุม FlowchartEngine core logic
- **GitHub Actions CI** — TypeScript check → Unit Test → Build ทุก push/PR
- **CLAUDE.md + PROCESS.md + ROADMAP.md** — เอกสารกระบวนการทำงานและแผนพัฒนา LMS Platform

### v0.12.3 (มีนาคม 2026)

- **Team Credits** — เพิ่มชื่อทีมงานใน LICENSE, README, หน้า Login และ Main Menu (Lead Dev / Project & Creative Director / Lead QA / QA Tester)
- **Version single source of truth** — `vite.config.ts` ดึง version จาก `package.json` อัตโนมัติ ลบ `GAME_VERSION` จาก `constants.ts` และ `VITE_APP_VERSION` จาก `.env`/`.env.example`
- **Lazy loading routes** — แยก chunk BattleScreen, InfinityDev, Leaderboard, Shop, CharacterCustomizer ลด initial bundle จาก **558 KB → 271 KB** (-51%)
- **MIT License** — เพิ่มไฟล์ `LICENSE` (MIT 2026 Ratchanon Semsayan)

### v0.12.2 (มีนาคม 2026)

- **Background images ครบทุกด่าน** — rename ไฟล์เป็น `level_1.jpg`–`level_20.jpg` + `infinity_dev.jpg`, ลบไฟล์ชื่อเดิมและ `bg-preview.html` ทิ้ง
- `level_endless` ใช้ภาพ `infinity_dev.jpg` แทน emoji fallback
- **Enemy Sprites ครบ level 16–20** — Vampire Lord, Frost Titan, Dark Commander, Lich Lord, Dark Overlord (rename เป็น kebab-case ไม่มี space)

### v0.12.1 (มีนาคม 2026)

- **จัดโครงสร้างโปรเจกต์** — ย้าย `soundManager.ts` จาก `utils/` → `services/`
- Rename enemy sprites เป็น kebab-case (`Bigger Slime.png` → `bigger-slime.png` ฯลฯ) ไม่มี space/apostrophe
- ลบไฟล์ Vite template ที่ไม่ใช้: `react.svg`, `vite.svg`
- ลบโฟลเดอร์ว่าง: `src/components/Common/`, `src/styles/`
- ลบ `pglite-debug.log`

### v0.12.0 (มีนาคม 2026)

- **Campaign Speedrun Leaderboard** — tab "⏱️ Speedrun" ใน Leaderboard จับเวลา wall clock จริงตั้งแต่ชนะด่านแรกครั้งแรก จนถึงด่านสุดท้าย
- แสดง Finished (เรียงเวลาน้อย→มาก, มงกุฎ 👑 อันดับ 1) และ In Progress (progress bar X/15, วันที่เริ่ม)
- บันทึก `campaignStartedAt` / `campaignClearedAt` / `campaignTotalTimeMs` ใน Firestore Leaderboard

### v0.11.0 (มีนาคม 2026)

- **Sound System** — ระบบเสียงครบวงจร BGM + SFX + Voice
- **BGM อัตโนมัติตาม route** — Main Menu / Level Select / Battle / Infinity Dev เล่นเพลงคนละชุด
- **Battle SFX** — เสียงทุก action: attack, power strike, spell, heal, dodge, berserk, potion, antidote, parry, burn, freeze, poison, victory, defeat, level-up
- **UI SFX** — เสียงวาง node, เชื่อม edge, ซื้อไอเทม, ใส่อุปกรณ์
- **Voice Pack** — เสียงพากย์ Mage และ Warrior (attack / hit / death) เล่น random 40% กัน spam
- **Volume & Mute** — บันทึกค่าใน localStorage (SFX / BGM / Voice แยกกัน)
- จัดโฟลเดอร์ sound ใหม่: `bgm/` `sfx/` `voice/` เลือกเฉพาะไฟล์ที่ใช้
- Convert ไฟล์เสียงจาก WAV → MP3 128kbps ลดขนาดจาก **5.2 GB → 25 MB**

### v0.10.1 (มีนาคม 2026)

- แก้ **Handle highlight หายหลังปล่อยมือ** — ย้าย active handle state เข้า Zustand store แทนการใช้ `classList` โดยตรง (ReactFlow อัพเดต className ระหว่าง drag ทำให้ class หาย)
- แก้ **Handle ตำแหน่งเพี้ยนเมื่อ highlight** — ลบ `transform: scale()` ออกจาก CSS ใช้เฉพาะ `box-shadow` glow แทน
- เพิ่ม **SelfLoopEdge** — custom edge สำหรับ edge ที่วนกลับ node เดิม มี path ยาวขึ้น 80px และ invisible hitbox 24px คลิก/ลบง่ายกว่าเดิม

### v0.10.0 (มีนาคม 2026)

- **Daily Farm Diminishing Returns** — จำนวนครั้งที่เล่นซ้ำรายวันเก็บใน Firestore (`dailyFarm.date` + `dailyFarm.plays`) รีเซ็ตทุกเที่ยงคืน UTC+7
- LevelSelect แสดง efficiency badge ต่อด่าน (🟢100% / 🟡50% / 🟠25% / 🔴10%) + countdown ถึงเวลา reset
- แก้ bug **Potions/Antidotes ไม่ถูก save** หลังใช้ในการสู้ — ตอนนี้ sync กลับ Firestore ทุกครั้งที่ battle จบ (ทั้งชนะและแพ้)
- **Enemy Budget System** — enemy โจมตีหลายครั้งต่อ turn ตาม `budgetPerTurn` ใน FlowchartEngine (`executeEnemyTurn`)
- เพิ่ม enemy behaviors: `poison_strike`, `freeze_strike`, `burn_strike`, `power_strike`
- ด่าน 11–15 `budgetPerTurn: 2`, ด่าน 16–20 `budgetPerTurn: 3`
- **Pre-set Hero Status** — ด่าน 7 hero เริ่มติด Poison + HP 70%, ด่าน 8 เริ่มติด Freeze เพื่อสอนการรับมือ ailment
- แก้ Enemy Shield ให้รองรับ Condition-type required blocks (`hero_poisoned`, `hero_frozen`, `enemy_alive`, `hp_less`, `turn_gte`)
- Shield badge icon ตรงกับเมนู context, mobile แสดง emoji อย่างเดียว

### v0.9.0 (มีนาคม 2026)
- **Tutorial rework**: 20 ด่าน ลำดับการสอนที่ถูกต้อง Sequence → Decision (HP/Ailment/Counter) → Loop → Combine → Mastery
- **Draggable Tutorial Guide**: hint panel ลากย้ายได้ ไม่บังหน้าจอเล่น
- **Process block descriptions**: เมนู context level-3 แสดงคำอธิบายใต้ชื่อ action ทุกตัว
- **Counter threshold**: Decision node `Turn ≥ N?` ปรับค่าทีละ ±1 (HP/Gold ยังคง ±10)
- **Emoji fallback**: ด่าน 16–20 (Vampire Lord / Frost Titan / Dark Commander / Lich Lord / Dark Overlord) ใช้ emoji แสดงศัตรูจนกว่าจะมีภาพจริง
- ระบบ **Diminishing Returns**: XP/Gold ลดลงเมื่อ clear ด่านซ้ำ (×100% → ×50% → ×25% → ×10%)
- **Bonus XP** จาก Bonus Objective (+50% base XP ก่อนคูณ multiplier)
- Victory screen แสดง multiplier และ bonus XP
- **Full Firestore Persistence**: potions, antidotes, attackBonus, equipped items บันทึกครบทุก field
- แก้ bug buyConsumable ไม่ save gold/items ทันที
- **Endless mode**: ใช้ภาพศัตรูจากแคมเปญ (กลุ่มละ 5 wave × 15 ศัตรู)
- แก้ ShopScreen ถูก result overlay บัง (zIndex 60 → 300)

### v0.8.0
- **BagButton**: overlay กระเป๋า (React Portal) เข้าถึงได้จากทุกหน้า
- แท็บ "ของใช้" และ "Equip" — ใส่/ถอดอุปกรณ์ระหว่างด่านได้
- **Daily Restock**: รับ potion/antidote ฟรีทุก 8 ชั่วโมง พร้อม countdown timer
- เปิดร้านค้าจากกระเป๋าระหว่างด่าน แล้วกลับสู้รบต่อโดยไม่ reset
- แก้ Endless mode base attack (3 → 8)

### v0.7.0
- **Turn-based system**: planning → running → enemy_turn → resolution
- **Budget system**: 💎 3/turn, ACTION_COST per node, badge แสดงบน ActionNode
- **Enemy Shield**: บล็อก damaging action ถ้าขาด required blocks
- **Class Skills**: 3 skills/class, lock ตาม character level, แสดงใน context menu
- Condition menu 3 ระดับ (Process / Decision / ClassSkills)
- แก้ animation transform สร้าง stacking context ทำให้ overlay บัง

### v0.6.0
- **Post-battle ShopScreen**: ซื้อ consumable + equipment หลังชนะด่าน
- ปุ่ม Retry จาก ShopScreen restart ด่านได้ทันที
- `fromBag` prop: ปิดร้านแล้วกลับด่านเดิม ไม่ navigate
- Equipment tab ใน ShopScreen แสดงอุปกรณ์แยก slot

### v0.5.0
- **Shop system**: ซื้อ Potion, Antidote, ATK Scroll, Equipment ด้วย Gold
- Gold ได้จากการชนะด่าน — บันทึก/โหลดจาก Firestore
- Flowchart Editor ปรับ UX ใหม่: drag-and-drop, palette, END reachability check
- `purchasedEquipment` บันทึกแยกจาก character progress

### v0.4.0
- **Equipment system**: 40+ ชิ้น, 4 slots (Weapon / Armor / Helmet / Accessory)
- Per-class base stats + Passive Bonuses ปลดล็อกตาม level (Lv.2/4/6)
- **Leaderboard**: overall + per-level + endless mode
- Loop guard ป้องกัน infinite loop

### v0.3.0
- Right-click **context menu** บน node/edge/canvas (3 ระดับ, Windows-style)
- เพิ่ม/ลบ/แก้ไข node ผ่าน menu
- UX: snap-to-grid, mini-map, auto-layout

### v0.2.0
- **Condition** และ **Loop** node
- **Objective system**: เงื่อนไขผ่านด่าน + Bonus Objective
- Tutorial text ต่อด่าน
- **15 Campaign Levels** (ต่อมา rework เป็น 20 ด่านใน v0.9.0)

### v0.1.0
- ระบบต่อสู้พื้นฐาน Hero vs Enemy
- Flowchart Editor: Start / End / Action node (Attack, Heal, Dodge)
- 4 Character Classes: Knight / Mage / Rogue / Barbarian
- Level system: XP, Level 1–10
- Firebase Auth: Email, Google, Anonymous login
- Endless Mode (wave scaling)

---

## Tech Stack

| | เวอร์ชัน | บทบาท |
|-|---------|-------|
| React + TypeScript | 19 | UI Framework |
| Vite | 7 | Build Tool |
| React Flow | 11 | Flowchart Canvas |
| Zustand | 5 | State Management |
| Framer Motion | 12 | UI Animation |
| Firebase | 12 | Auth + Firestore + Hosting |
| Tailwind CSS | 4 | Utility CSS |

---

## Team

| บทบาท | ชื่อ |
|-------|------|
| Lead Developer | Ratchanon Semsayan |
| Project & Creative Director | Suppakit Kongthong |
| Lead QA & System Advisor | Phattrawut Nachirit, Watanyu Arjsurin |
| QA Tester | Prapatpong Srikampol, Anon Mongkolwong, Jetsada Longkrathok |

---

`v0.17.1` — มีนาคม 2026

---

## License

MIT License — Copyright (c) 2026 Ratchanon Semsayan

## Credits

| Role                        | Name                                      |
|-----------------------------|-------------------------------------------|
| Lead Developer              | Ratchanon Semsayan (รัชชานนท์ เสมสายัณห์)   |
| Project & Creative Director | Suppakit Kongthong (ศุภกิจ คงทอง)         |
| Lead QA & System Advisor    | Phattrawut Nachirit (ภัทราวุฒ นาชัยฤทธิ์) |
| Lead QA & System Advisor    | Watanyu Arjsurin (วทัญญู อาจสุรินทร์)     |
| QA Tester                   | Prapatpong Srikampol (ประภัสพงษ์ ศรีกำพล) |
| QA Tester                   | Anon Mongkolwong (อานนท์ มงคลวงษ์)        |
| QA Tester                   | Jetsada Longkrathok (เจษฎา โล่งกระโทก)   |
