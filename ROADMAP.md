# FlowFight — Roadmap & Future Plan

> อัปเดต: มีนาคม 2026 | [README](README.md) | [เล่นออนไลน์](https://project-rpg-flowchart.web.app/)

---

## Vision

FlowFight จะพัฒนาจากเกม RPG + Flowchart สู่ **LMS Platform** สำหรับการสอน Computational Thinking และการเขียน Algorithm ผ่านการเล่นเกม รองรับทุกระดับการศึกษา ตั้งแต่ประถมถึง ปวส. พร้อมระบบบริหารจัดการห้องเรียนสำหรับครู

```
ประถม → มัธยม → ปวช. → ปวส.
   ↓        ↓       ↓      ↓
เล่นเกม + เรียน Flowchart + ครูติดตาม + ระบบประเมิน
```

---

## สิ่งที่ยังขาด (Quick Win — ทำได้ทันที)

- [x] **Flowchart Save/Load per level** — auto-save nodes/edges ต่อด่านใน Firestore (v0.14.0)
- [x] **Learning Objective popup** — หลังชนะแต่ละด่านบอกว่า "คุณเพิ่งเรียนรู้..." พร้อม icon + concept (v0.15.0)
- [x] **Tooltip** — hover บน Action Block แสดงคำอธิบายสั้น ๆ (v0.14.0)
- [x] **Achievement System** — 8 achievements + toast popup + บันทึก Firestore (v0.14.0)
- [x] **Sprite Animation** — hero/enemy idle float + hero กระพริบแดงเมื่อ HP < 30% (v0.16.0)
- [x] **Keyboard Shortcuts** — Space = Run, R = Retry, Esc = Stop (v0.16.0)
- [x] **Flowchart Undo/Redo** — Ctrl+Z / Ctrl+Y, history 50 steps (v0.16.0)
- [x] **Volume Slider** — popup ปรับ BGM/SFX แยก + mute toggle (v0.16.0)
- [ ] **Mobile / Tablet Support** — รองรับ touch screen

---

## Phase 1 — LMS Foundation
> *ทำก่อนอื่น เพื่อให้ครูสามารถใช้ในชั้นเรียนได้จริง*

| ฟีเจอร์ | รายละเอียด | สถานะ |
|---|---|---|
| **Teacher Role** | บัญชีครู แยกจาก student สามารถสร้างห้องเรียนได้ | [ ] |
| **Classroom** | สร้างห้องด้วยโค้ด 6 หลัก นักเรียน join ได้ทันที | [ ] |
| **Student Dashboard (ครู)** | ดู progress นักเรียนแต่ละคน ด่านไหนผ่าน ใช้เวลาเท่าไหร่ | [ ] |
| **Assignment** | ครูกำหนดด่านที่ต้องผ่านพร้อม deadline | [ ] |
| **Flowchart Save/Load** | บันทึก flowchart ต่อด่านใน Firestore | [x] v0.14.0 |

---

## Phase 2 — Multi-Level Curriculum
> *รองรับทุกระดับการศึกษา ปรับ difficulty ตาม target*

| ระดับ | อายุ | เนื้อหา | จำนวนด่าน | สถานะ |
|---|---|---|---|---|
| **ประถม** | 8–12 | Sequence พื้นฐาน, บวก/ลบง่าย ๆ, ศัตรูเป็นสัตว์น่ารัก | 10 ด่าน | [ ] |
| **มัธยม** | 12–18 | Decision, Loop, Counter | 15 ด่าน (ปัจจุบัน) | มีแล้ว |
| **ปวช.** | 15–18 | Algorithm เต็มรูปแบบ, Class Skills, Optimization | 20 ด่าน (ปัจจุบัน) | มีแล้ว |
| **ปวส.** | 18–20 | Nested Loop, Pattern Recognition, Boss Challenge | 10 ด่าน advanced | [ ] |

---

## Phase 3 — Assessment & Analytics
> *ระบบประเมินและวิเคราะห์ผลการเรียนรู้*

| ฟีเจอร์ | รายละเอียด | สถานะ |
|---|---|---|
| **Auto-grading** | ให้คะแนน flowchart ตาม efficiency (จำนวน node, turn, HP เหลือ) | [ ] |
| **Learning Objective Tag** | แต่ละด่าน tag concept ที่สอน (IF/ELSE, LOOP, etc.) | [ ] |
| **Teacher Analytics Dashboard** | กราฟ class average, นักเรียนที่ต้องช่วยเหลือ, concept ที่ทุกคนติด | [ ] |
| **Export Report** | PDF/Excel สรุป progress ส่งผู้ปกครองหรือ ผอ. | [ ] |
| **Badge & Certificate** | ใบประกาศเมื่อผ่านครบ curriculum ระดับ | [ ] |

---

## Phase 4 — Platform & Accessibility
> *ขยายการเข้าถึงให้ครอบคลุมทุกกลุ่มผู้ใช้*

| ฟีเจอร์ | รายละเอียด | สถานะ |
|---|---|---|
| **Mobile / Tablet Support** | Responsive layout สำหรับ touch screen | [ ] |
| **PWA / Offline Mode** | เล่นได้แม้ internet ไม่เสถียร sync ทีหลัง | [ ] |
| **Sandbox Mode** | วาด flowchart อิสระ ไม่มีศัตรู ฝึก logic ล้วน ๆ | [ ] |
| **Multi-language** | ภาษาอังกฤษ สำหรับ international | [ ] |
| **Parent Portal** | ผู้ปกครองดู progress บุตรหลานได้ | [ ] |

---

## Phase 5 — Advanced LMS
> *ฟีเจอร์ขั้นสูงสำหรับ platform เต็มรูปแบบ*

| ฟีเจอร์ | รายละเอียด | สถานะ |
|---|---|---|
| **Custom Level Editor** | ครูสร้างด่านเองได้ กำหนด enemy, allowed blocks, objective | [ ] |
| **Class Competition** | Leaderboard แบบ classroom เทียบกันในห้อง | [ ] |
| **AI Hint System** | แนะนำเมื่อนักเรียนติดนานเกิน N นาที | [ ] |
| **Peer Review** | แชร์ flowchart ให้เพื่อนวิจารณ์และให้ feedback | [ ] |
| **Curriculum Alignment** | เชื่อมโยงกับหลักสูตรแกนกลาง สสวท. / อศจ. | [ ] |

---

## สรุป Priority

```
ทำทันที  →  Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  →  Phase 5
 (bug fix)   (ครู/ห้อง)  (curriculum)  (analytics)  (mobile)   (advanced)
```

---

*FlowFight — Learn to Think, Think to Win*
