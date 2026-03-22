# FlowFight — Flowchart Battle RPG

เกม RPG เพื่อการศึกษาที่ผู้เล่นสร้าง **Flowchart** เพื่อควบคุม hero ในการต่อสู้
ไม่ใช่แค่กด Attack — คุณต้องออกแบบ algorithm ด้วยกล่องลาก-วาง!

**v0.21.0** | [เล่นออนไลน์](https://project-rpg-flowchart.web.app/) | สำหรับระดับ **ปวช.–ปวส.** (สอศ.)

---

## สารบัญ

- [Requirements](#requirements)
- [ติดตั้งและรันในเครื่อง](#ติดตั้งและรันในเครื่อง)
- [ตั้งค่า Firebase](#ตั้งค่า-firebase)
- [Deploy](#deploy)
- [Tech Stack](#tech-stack)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [เอกสารอื่น ๆ](#เอกสารอื่น-ๆ)
- [Team](#team)
- [License](#license)

---

## Requirements

- Node.js v18+, npm v9+
- บัญชี [Firebase](https://firebase.google.com) (ฟรี Spark plan ได้)

---

## ติดตั้งและรันในเครื่อง

```bash
cd flowfight
npm install
cp .env.example .env      # ใส่ Firebase config (ดูหัวข้อถัดไป)
npm run dev               # http://localhost:5173
```

---

## ตั้งค่า Firebase

### 1. สร้าง Firebase Project

1. [Firebase Console](https://console.firebase.google.com) → **Add project**
2. **Project Settings** → **Your apps** → Web (`</>`) → คัดลอก config

### 2. เปิด Authentication

**Authentication** → **Sign-in method** → เปิด **Google** และ/หรือ **Email/Password**

### 3. สร้าง Firestore Database

**Firestore Database** → **Create database** → Start in test mode → Region: `asia-southeast1`

### 4. ใส่ config

**4a.** copy `.firebaserc.example` → `.firebaserc` แล้วแก้ project ID

**4b.** copy `.env.example` → `.env` แล้วใส่ค่าจาก Firebase Console:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

> อย่า commit `.env` และ `.firebaserc` — อยู่ใน `.gitignore` แล้ว

### 5. Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

### 6. ตั้งค่า Admin Account

Firebase Console → Firestore → `users/{uid}` → แก้ field `role` เป็น `"admin"`

Admin สร้าง Teacher Invite Code ได้จาก Admin Dashboard ในแอป

---

## Deploy

```bash
npm run build
firebase deploy --only hosting
```

ครั้งแรก ต้อง `npm install -g firebase-tools && firebase login && firebase init hosting` ก่อน

---

## Tech Stack

| | เวอร์ชัน | บทบาท |
|-|---------|-------|
| React + TypeScript | 19 | UI Framework |
| Vite | 7 | Build Tool + PWA |
| React Flow | 11 | Flowchart Canvas |
| Zustand | 5 | State Management |
| Framer Motion | 12 | UI Animation |
| Firebase | 12 | Auth + Firestore + Hosting |
| Tailwind CSS | 4 | Utility CSS |
| Vitest | 4 | Unit Testing |

---

## โครงสร้างโปรเจกต์

```
src/
├── components/
│   ├── Auth/           — LoginPage, TeacherRegisterPage
│   ├── Battle/         — BattleScreen
│   ├── FlowchartEditor/— canvas + CustomNodes
│   ├── Character/      — CharacterCustomizer
│   ├── Shop/           — ShopScreen, ShopPage
│   ├── Teacher/        — TeacherDashboard
│   ├── Admin/          — AdminDashboard
│   └── UI/             — MainMenu, LevelSelect, Leaderboard,
│                         AchievementsPage, CertificatePage, SandboxMode
├── modes/
│   └── InfinityDev/    — Endless Mode
├── engines/
│   ├── FlowchartEngine.ts  — parse + validate + execute
│   └── ShopEngine.ts       — equipment stat bonuses
├── hooks/              — useBattle, useAuth
├── stores/             — gameStore, battleStore, flowchartStore, shopStore
├── services/           — authService, teacherService, soundManager, firebaseService
├── contexts/           — ThemeContext
├── types/              — game.types.ts
└── utils/              — constants, levelSystem, achievements

public/
├── characters/         — knight.png, mage.png, rogue.png, barbarian.png
├── enemies/            — sprite ศัตรูทุกด่าน (kebab-case .png)
├── backgrounds/        — level_1–20.jpg, infinity_dev.jpg
└── icon-192.svg / icon-512.svg  — PWA icons
```

---

## เอกสารอื่น ๆ

| ไฟล์ | เนื้อหา |
|------|--------|
| [GAMEPLAY.md](GAMEPLAY.md) | วิธีเล่น, Flowchart Blocks, Class Skills, ระบบ Level, ด่านทั้งหมด 30 ด่าน |
| [ROADMAP.md](ROADMAP.md) | แผนพัฒนา Phase 1–5 (LMS Platform) |
| [CHANGELOG.md](CHANGELOG.md) | ประวัติการเปลี่ยนแปลงทุก version |
| [CLAUDE.md](CLAUDE.md) | คำแนะนำสำหรับ AI assistant (workflow, commit policy) |

---

## Team

| บทบาท | ชื่อ |
|-------|------|
| Lead Developer | Ratchanon Semsayan |
| Project & Creative Director | Suppakit Kongthong |
| Lead QA & System Advisor | Phattrawut Nachirit, Watanyu Arjsurin |
| QA Tester | Prapatpong Srikampol, Anon Mongkolwong, Jetsada Longkrathok |

---

## License

MIT License — Copyright (c) 2026 Ratchanon Semsayan
