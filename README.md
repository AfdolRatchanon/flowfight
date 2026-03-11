# FlowFight — Flowchart Battle RPG

เกม RPG เพื่อการศึกษาที่ผู้เล่นสร้าง **Flowchart** เพื่อควบคุมวีรบุรุษในการต่อสู้
ไม่ใช่แค่กด Attack — คุณต้องเขียนโปรแกรมด้วยกล่องลาก-วาง!

---

## สารบัญ

- [Requirements](#requirements)
- [ติดตั้งและรันในเครื่อง](#ติดตั้งและรันในเครื่อง)
- [ตั้งค่า Firebase](#ตั้งค่า-firebase)
- [วิธีเล่น](#วิธีเล่น)
- [Flowchart Blocks](#flowchart-blocks)
- [ระบบตัวละครและ Level](#ระบบตัวละครและ-level)
- [Deploy ขึ้น Firebase Hosting](#deploy-ขึ้น-firebase-hosting)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ด่านทั้งหมด (15 ด่าน)](#ด่านทั้งหมด-15-ด่าน)

---

## Requirements

- [Node.js](https://nodejs.org) v18 ขึ้นไป
- npm v9+ (มากับ Node)
- บัญชี [Firebase](https://firebase.google.com) (ฟรี Spark plan ได้เลย)
- (สำหรับ deploy) Firebase CLI

---

## ติดตั้งและรันในเครื่อง

```bash
# 1. Clone หรือ download โปรเจกต์
cd flowfight

# 2. ติดตั้ง dependencies
npm install

# 3. คัดลอกไฟล์ config
cp .env.example .env.local

# 4. แก้ไข .env.local ใส่ค่า Firebase (ดูหัวข้อถัดไป)

# 5. รัน dev server
npm run dev
# เปิดเบราว์เซอร์ไปที่ http://localhost:5173
```

---

## ตั้งค่า Firebase

### 1. สร้าง Firebase Project

1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. คลิก **Add project** → ตั้งชื่อโปรเจกต์ → สร้าง
3. ในโปรเจกต์ ไปที่ **Project Settings** (ไอคอนฟันเฟือง) → แท็บ **General**
4. เลื่อนลงมาที่ **Your apps** → คลิก **Web** (`</>`)
5. ตั้งชื่อ app → **Register app**
6. คัดลอก config object ที่ได้

### 2. เปิด Authentication

1. ไปที่ **Authentication** → **Get started**
2. แท็บ **Sign-in method** → เปิด **Email/Password**
3. (แนะนำ) เปิด **Anonymous** ด้วย เพื่อให้เล่นแบบไม่ต้อง login

### 3. สร้าง Firestore Database

1. ไปที่ **Firestore Database** → **Create database**
2. เลือก **Start in test mode** (ระหว่างพัฒนา)
3. เลือก region ใกล้บ้าน เช่น `asia-southeast1`

> **Production:** ก่อน deploy จริงควรตั้ง Security Rules ที่ปลอดภัย (ดูตัวอย่างด้านล่าง)

### 4. ใส่ค่าใน .env.local

เปิดไฟล์ `.env.local` แล้วใส่ค่าจาก Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

VITE_APP_VERSION=0.1.0
```

### Firestore Security Rules (แนะนำสำหรับ production)

ไปที่ **Firestore** → **Rules** แล้วใช้:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /leaderboard/{entry} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /levelLeaderboard/{levelId}/entries/{entry} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## วิธีเล่น

### ขั้นตอนเริ่มต้น

1. **Login** ด้วย Email/Password หรือ Anonymous
2. **สร้างตัวละคร** → เลือกอาชีพ, Equipment, สี
3. **เลือกด่าน** จากหน้า Level Select
4. **สร้าง Flowchart** ในส่วนล่างของหน้าจอ
5. กด **Play** เพื่อดูผลการต่อสู้

### การสร้าง Flowchart

- **ลากบล็อก** จาก Panel ซ้ายมาวางบน Canvas
- **เชื่อมต่อ** โดยคลิกจุดสีขาวที่ขอบบล็อก แล้วลากไปยังบล็อกถัดไป
- ทุก Flowchart **ต้องมี Start และ End** เสมอ
- กด **Validate** เพื่อตรวจสอบก่อนรัน

### ปุ่มควบคุม

| ปุ่ม | ความหมาย |
|------|----------|
| Validate | ตรวจว่า Flowchart ถูกต้องหรือไม่ |
| Play | รัน Flowchart ทั้งหมดอัตโนมัติ |
| Step | รันทีละขั้นตอน (ดูการทำงานละเอียด) |
| Stop | หยุดการรันกลางคัน |
| Clear | ล้าง Flowchart ทั้งหมด |

---

## Flowchart Blocks

| บล็อก | รูปร่าง | ความหมาย |
|-------|---------|----------|
| **Start** | วงรีเขียว | จุดเริ่มต้น (มีได้แค่ 1 อัน) |
| **End** | วงรีเขียว | จุดสิ้นสุด |
| **Attack** | สี่เหลี่ยมแดง | โจมตีศัตรู (ศัตรูโต้กลับ 100%) |
| **Heal** | สี่เหลี่ยมแดง | ฟื้นฟู HP ประมาณ 20 |
| **Dodge** | สี่เหลี่ยมแดง | หลบการโจมตี (สำเร็จ 70%) |
| **Cast Spell** | สี่เหลี่ยมแดง | เวทย์ดาเมจ 1.5× (ศัตรูโต้กลับ 50%) |
| **Condition** | เพชรน้ำเงิน | แยกทาง YES / NO ตามเงื่อนไข |
| **Loop** | เพชรส้ม | วนซ้ำทาง LOOP / ออกทาง NEXT |

### Condition Types

| เงื่อนไข | YES เมื่อ |
|----------|----------|
| HP > X | HP ของฮีโร่มากกว่า X |
| HP < X | HP ของฮีโร่น้อยกว่า X |
| MP > X | Mana ของฮีโร่มากกว่า X |
| MP < X | Mana ของฮีโร่น้อยกว่า X |
| Enemy Alive? | ศัตรูยังมีชีวิต |
| Enemy Close? | ศัตรูอยู่ใกล้ (สำหรับ Rogue) |

> **Interactive Condition Node:** คลิกปุ่ม HP/MP เพื่อสลับ subject, คลิก `>/<` เพื่อสลับ operator, กด `+10`/`−10` เพื่อปรับ threshold โดยตรงบน node

### Loop Types

| ประเภท | ทำงาน |
|--------|-------|
| Repeat N times | วนซ้ำ N รอบแล้วออก |
| While Enemy Alive | วนจนกว่าศัตรูจะตาย |

---

## ระบบตัวละครและ Level

### 4 อาชีพ

| อาชีพ | HP | ATK | DEF | จุดเด่น |
|-------|----|----|-----|---------|
| Knight | 100 | 10 | 8 | ทนทาน |
| Mage | 80 | 14 | 4 | ดาเมจสูง |
| Rogue | 90 | 12 | 5 | เร็ว |
| Barbarian | 120 | 13 | 6 | HP สูงสุด |

### XP และ Level

- เอาชนะศัตรูได้รับ XP
- Level สูงสุดคือ **Level 10**
- XP progress บันทึกลง Firestore อัตโนมัติ

| Level | XP ที่ต้องการ |
|-------|-------------|
| 2 | 100 |
| 3 | 250 |
| 4 | 450 |
| 5 | 700 |
| 6 | 1,000 |
| 7 | 1,400 |
| 8 | 1,900 |
| 9 | 2,500 |
| 10 | 3,200 |

---

## Deploy ขึ้น Firebase Hosting

### ครั้งแรก (ติดตั้ง Firebase CLI)

```bash
npm install -g firebase-tools
firebase login
```

### สร้างไฟล์ firebase.json

รันคำสั่งนี้ในโฟลเดอร์โปรเจกต์:

```bash
firebase init hosting
```

ตอบคำถาม:
- **What do you want to use as your public directory?** → `dist`
- **Configure as a single-page app?** → `Yes`
- **Set up automatic builds with GitHub?** → `No` (หรือ Yes ถ้าต้องการ CI/CD)
- **File dist/index.html already exists. Overwrite?** → `No`

จะได้ไฟล์ `firebase.json` แบบนี้:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

> `rewrites` สำคัญมาก — ทำให้ React Router ทำงานได้ถูกต้องเมื่อ refresh หน้า

### Build และ Deploy

```bash
# Build โปรเจกต์
npm run build

# Deploy
firebase deploy --only hosting
```

เมื่อเสร็จจะได้ URL ประมาณ:
```
Hosting URL: https://your-project-id.web.app
```

### Deploy ครั้งถัดไป

```bash
npm run build && firebase deploy --only hosting
```

### (ทางเลือก) ตั้ง Custom Domain

1. Firebase Console → **Hosting** → **Add custom domain**
2. ใส่โดเมนของคุณ → ทำตามขั้นตอน DNS verification

---

## โครงสร้างโปรเจกต์

```
flowfight/
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   ├── Auth/             # หน้า Login / Register
│   │   ├── Battle/           # BattleScreen (arena + flowchart)
│   │   ├── Character/        # CharacterCustomizer
│   │   ├── FlowchartEditor/  # Editor + CustomNodes + BlockPalette
│   │   └── UI/               # MainMenu, LevelSelect, Leaderboard
│   ├── engines/
│   │   └── FlowchartEngine.ts   # Logic การรัน flowchart และ battle
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth state + Firestore sync
│   │   └── useBattle.ts         # Animation loop + step execution
│   ├── services/
│   │   ├── authService.ts       # Firebase read/write (auth, leaderboard, progress)
│   │   ├── characterService.ts  # Character save/load (ยังไม่ integrate กับ UI)
│   │   └── firebaseService.ts   # Firebase config & initialization
│   ├── stores/
│   │   ├── gameStore.ts         # Player + Character global state
│   │   ├── battleStore.ts       # HP, Mana, log, battle state
│   │   ├── characterStore.ts    # Character builder, equipment, class selection
│   │   └── flowchartStore.ts    # Nodes + Edges + execution log
│   ├── types/
│   │   └── game.types.ts        # TypeScript interfaces ทั้งหมด
│   └── utils/
│       ├── constants.ts         # LEVELS, WEAPONS, ARMORS, etc.
│       └── levelSystem.ts       # XP table, gainXP(), levelProgressPct()
├── .env.example              # Template สำหรับ Firebase config
├── .env.local                # Config จริง (อย่า commit!)
├── firebase.json             # Firebase Hosting config
├── vite.config.ts
└── package.json
```

---

## ด่านทั้งหมด (15 ด่าน + Endless)

| # | ชื่อด่าน | ศัตรู | HP | ความยาก | แนวคิดที่เรียน |
|---|---------|------|----|---------|--------------|
| 1 | The Slime Cave | Slime | 25 | ★ | Sequential Logic |
| 2 | Slime x2 | Slime | 45 | ★ | Sequential (หลายครั้ง) |
| 3 | The Goblin Cave | Goblin | 60 | ★★ | Condition + Loop |
| 4 | Heal When Low | Goblin | 70 | ★★ | If/Else + Heal |
| 5 | The Kobold Pack | Kobold Pack | 90 | ★★ | Condition Loop + Heal |
| 6 | The Goblin Knight | Goblin Knight | 110 | ★★★ | Dodge + Armor + **Enrage 30%** |
| 7 | The Spider Den | Spider Queen | 130 | ★★★ | Nested Conditions + **Enrage 25%** |
| 8 | The Forest Wraith | Forest Wraith | 140 | ★★★ | Cast Spell |
| 9 | Mana Control | Orc Warrior | 160 | ★★★★ | Resource Management |
| 10 | Power Strike! | Stone Troll | 190 | ★★★★ | Power Strike + Armor |
| 11 | The Orc Warlord | Orc Warlord | 220 | ★★★★ | Full Skill Set + **Enrage 30%** |
| 12 | The Ice Cavern | Ice Giant | 260 | ★★★★★ | High Armor + Spell/Strike |
| 13 | The Dragon's Lair | Young Dragon | 300 | ★★★★★ | All 5 Actions + **Enrage 35%** |
| 14 | The Lich Lord | Lich Lord | 370 | ★★★★★ | Parry 25% + Heal + **Enrage 40%** |
| 15 | The Dark Overlord | Dark Overlord | 500 | ★★★★★ | True Mastery + **Enrage 40%** |
| ∞ | **Endless Mode** | Wave ∞ | Scales | ★★★★★ | ทุก Wave — ศัตรูแรง+มากขึ้น |

> **Enemy Enrage:** เมื่อ HP ของศัตรูตกต่ำกว่า threshold% → ATK ×1.5 และแสดงข้อความ "ENRAGED!"

---

## Tech Stack

| เทคโนโลยี | เวอร์ชัน | บทบาท |
|----------|---------|-------|
| React + TypeScript | 19.x | UI Framework |
| Vite | 7.x | Build Tool |
| React Flow | 11.x | Flowchart Editor |
| Zustand | 5.x | State Management |
| Firebase Auth | 12.x | Authentication (Email / Google / Anonymous) |
| Firebase Firestore | 12.x | Database (player data, leaderboard) |
| Firebase Hosting | — | Web Hosting |
| Tailwind CSS | 4.x | Styling (via @tailwindcss/vite) |
| Framer Motion | 12.x | UI Animations |
| Phaser 3 | 3.x | ติดตั้งแล้ว — ยังไม่ได้ใช้ (planned for sprite/battle animation) |

---

## สถานะระบบ — มีอะไรแล้ว / ขาดอะไร

> อัปเดตล่าสุด: มีนาคม 2026

### สิ่งที่พัฒนาแล้ว (Implemented)

#### Core Gameplay
- [x] Flowchart Editor ด้วย ReactFlow — Node, Edge, Handle ครบ
- [x] FlowchartEngine — Validate + Execute ครบ รองรับ 5 action types
- [x] Battle System — HP / Mana / Armor / Parry / Dodge ทำงานได้
- [x] Infinite Loop Detection (Tarjan's SCC algorithm)
- [x] Condition nodes: HP < X, HP > X, **MP < X, MP > X**, Enemy Alive, Enemy Close
- [x] **Interactive Condition Node** — คลิกเปลี่ยน HP/MP, >/< operator, ±10 threshold บน node ได้เลย
- [x] Loop nodes: Repeat N times, While Alive
- [x] Speed Control 1x–5x และ Step-through mode
- [x] Preview Flowchart แสดง branch outcomes ทั้ง YES/NO ก่อนรัน
- [x] Required block validation — ศัตรูป้องกันถ้าไม่มี block ที่กำหนด
- [x] **Enemy Enrage mechanic** — HP ต่ำกว่า threshold% → ATK ×1.5 (ด่าน 6,7,11,13,14,15)
- [x] **Tutorial Overlay** — step-by-step hints ด่าน 1–5 พร้อม prev/next/close
- [x] **Endless Wave Mode** — ศัตรู scale ขึ้นทุก wave, แก้ flowchart ระหว่าง wave ได้, score = wave × HP%

#### Character & Progression
- [x] 4 classes: Knight / Mage / Rogue / Barbarian พร้อม stat growth per level
- [x] Equipment system — 40+ items ใน 4 slots (Head, Weapon, Armor, Accessory)
- [x] Level 1–10 + XP system พร้อม XP table
- [x] Color customization (hex picker) Primary / Secondary / Accent

#### UI & Navigation
- [x] Login: Email/Password + Google OAuth + Guest (Anonymous) + Password Reset
- [x] MainMenu / LevelSelect (15 ด่าน) / BattleScreen / CharacterCustomizer / Leaderboard
- [x] Light / Dark theme toggle
- [x] Panel toggle ซ่อน/เปิด Blocks palette และ Sim Preview
- [x] fitView auto-reset เมื่อเข้าด่านใหม่
- [x] ReactFlow watermark ซ่อนแล้ว

#### Backend (Firebase)
- [x] Firebase Auth + Firestore
- [x] Global leaderboard + Per-level leaderboard
- [x] savePlayerProgress + saveCharacterProgress
- [x] Firestore Security Rules ตัวอย่างพร้อมใช้งาน

---

### สิ่งที่ยังขาด / ต้องพัฒนาต่อ

#### ลำดับความสำคัญสูง

- [ ] **Flowchart Save/Load per level** — ตอนนี้วาดแล้วปิดหน้าต่าง → หายหมด
  - บันทึก nodes + edges ลง Firestore per `(userId, levelId)`
  - โหลดกลับมาเมื่อเข้าด่านเดิมซ้ำ
  - อาจเพิ่ม Template flowchart สำหรับ beginner

- [x] **Tutorial ด่าน 1–5** — Overlay step-by-step hints พร้อมใช้งานแล้ว
- [ ] Tooltip อธิบาย block แต่ละตัวเมื่อ hover (nice to have)

- [ ] **Equipment Save ให้สมบูรณ์** — `characterService.ts` มีอยู่แต่ไม่ได้ถูก integrate
  - เรียก `characterService` จาก `CharacterCustomizer` จริง
  - บันทึก equipment ที่เลือกลง Firestore

#### ลำดับความสำคัญกลาง

- [ ] **Sound Effects เบื้องต้น**
  - โฟลเดอร์ `assets/sounds/` มีอยู่แต่ว่างเปล่า
  - SFX: โจมตี, heal, level up, victory, defeat
  - ดนตรีประกอบ (battle music, menu music)

- [ ] **Equipment Shop**
  - มี item catalog ครบใน `constants.ts` แต่ไม่มีหน้า shop
  - ต้องมีระบบ Gold / Currency
  - Mechanics การได้ Gold จากการชนะด่าน

- [ ] **Achievement System**
  - type `Achievement` อยู่ใน `game.types.ts` แล้ว แต่ยังไม่มี UI
  - ระบบ unlock achievement (เช่น ชนะด่าน 1, เล่นครบ 5 ด่าน)
  - หน้าแสดง achievements และ progress

#### ลำดับความสำคัญต่ำ (Nice to Have)

- [ ] **Sprites / Visual ตัวละครจริง**
  - โฟลเดอร์ `assets/sprites/` ว่างเปล่า
  - ตอนนี้ Battle Arena ใช้ emoji + gradient box
  - Phaser 3 อยู่ใน architecture docs แต่ยังไม่ได้ใช้

- [ ] **Enemy Animation**
  - ศัตรูแสดงเป็น emoji
  - ควรมี sprite animation สำหรับ idle / attack / hurt / death

- [ ] **Mobile / Responsive Support**
  - Flowchart Editor ใช้งานยากบน touch screen
  - Layout ออกแบบสำหรับ desktop เท่านั้น

- [ ] **Flowchart Template Library**
  - ตัวอย่าง flowchart พร้อมใช้สำหรับแต่ละด่าน
  - ให้ผู้เล่นเลือก template แล้วปรับแต่งเพิ่ม

---

### ตารางสรุปสถานะ

| หมวด | สถานะ | หมายเหตุ |
|------|--------|----------|
| Game Logic (Engine) | 95% | ครบทุก action, Enrage mechanic, Mana conditions |
| UI / Navigation | 90% | ครบหลัก, Tutorial overlay ด่าน 1–5 แล้ว |
| Authentication | 95% | ครบ, username fix ใช้งานได้แล้ว |
| Character / Equipment | 70% | UI ครบ, แต่ save equipment ไม่สมบูรณ์ |
| Flowchart Save | 0% | **ยังไม่ได้ทำ** — สำคัญมาก |
| Tutorial / Onboarding | 60% | Overlay ด่าน 1–5 เสร็จแล้ว, ขาด tooltip per block |
| Sound / Music | 0% | โฟลเดอร์ว่างเปล่า |
| Sprites / Animation | 5% | ใช้ emoji แทน sprite จริง |
| Shop System | 0% | Item catalog พร้อม แต่ยังไม่มี shop UI |
| Achievement System | 0% | Types พร้อม แต่ยังไม่มี logic + UI |
| Mobile Support | 0% | Desktop only |
| Endless Mode | 100% | Wave scaling, score system, flowchart editable between waves |
| Leaderboard | 80% | ทำงานได้ ต้อง verify หลังเล่นจริง |

---

### หมายเหตุทางเทคนิคที่ควรจำ

- **Firebase Rules** ต้องอัปเดตใน Firebase Console ด้วยมือ (ดูหัวข้อ Firestore Security Rules ด้านบน)
- **`characterService.ts`** มีอยู่ใน `src/services/` แต่ยังไม่ถูกเรียกใช้จาก CharacterCustomizer
- **`updateDoc`** จะ throw ถ้า document ยังไม่มีใน Firestore — ใช้ `setDoc` กับ `{ merge: true }` แทน
- **Username fallback chain**: `profile.username` → `user.displayName` → `user.email.split('@')[0]` → `'Player'`
- **`key={level.id}`** บน `<FlowchartEditor>` ทำให้ ReactFlow remount และ fitView ทุกครั้งที่เปลี่ยนด่าน
- **`proOptions={{ hideAttribution: true }}`** ใน ReactFlow ซ่อน watermark
