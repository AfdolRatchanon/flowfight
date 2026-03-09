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
| Enemy Alive? | ศัตรูยังมีชีวิต |

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
│   │   └── authService.ts       # Firebase read/write functions
│   ├── stores/
│   │   ├── gameStore.ts         # Player + Character global state
│   │   ├── battleStore.ts       # HP, log, battle state
│   │   └── flowchartStore.ts    # Nodes + Edges
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

## ด่านทั้งหมด (15 ด่าน)

| # | ชื่อด่าน | ศัตรู | HP | ความยาก | แนวคิดที่เรียน |
|---|---------|------|----|---------|--------------|
| 1 | The Slime Cave | Slime | 40 | ★ | Sequential Logic |
| 2 | The Goblin Camp | Goblin Scout | 55 | ★ | If/Else Conditions |
| 3 | The Kobold Warren | Kobold Pack | 70 | ★★ | Conditions |
| 4 | The Goblin Fortress | Goblin Knight | 90 | ★★ | Loops (Repeat) |
| 5 | The Orc Outpost | Orc Warrior | 110 | ★★ | Loops (While Alive) |
| 6 | The Haunted Forest | Forest Wraith | 120 | ★★★ | Heal + Loop |
| 7 | The Troll Bridge | Stone Troll | 160 | ★★★ | Aggressive Loops |
| 8 | The Spider Den | Spider Queen | 140 | ★★★ | Dodge + Conditions |
| 9 | The Orc Warlord | Orc Warlord | 200 | ★★★★ | Complex Conditions |
| 10 | The Ice Cavern | Ice Giant | 230 | ★★★★ | Spell Casting |
| 11 | The Dragon's Lair | Young Dragon | 270 | ★★★★ | Advanced Combat |
| 12 | The Volcano Peak | Fire Elemental | 300 | ★★★★★ | Optimization |
| 13 | The Undead Crypt | Lich Lord | 350 | ★★★★★ | Full Toolkit |
| 14 | The Shadow Realm | Shadow Demon | 400 | ★★★★★ | Master Strategy |
| 15 | The Final Sanctum | Dark Overlord | 500 | ★★★★★ | True Mastery |

---

## Tech Stack

| เทคโนโลยี | บทบาท |
|----------|-------|
| React 18 + TypeScript | UI Framework |
| Vite | Build Tool |
| React Flow | Flowchart Editor |
| Zustand | State Management |
| Firebase Auth | Authentication |
| Firebase Firestore | Database (player data, leaderboard) |
| Firebase Hosting | Web Hosting |
