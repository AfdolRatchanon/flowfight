# FlowFight — Roadmap & Future Plan

> อัปเดต: มีนาคม 2026 | [README](README.md) | [เล่นออนไลน์](https://project-rpg-flowchart.web.app/)

---

## Vision

FlowFight คือ **LMS Platform** สำหรับการสอน Computational Thinking และการเขียน Algorithm ผ่านการเล่นเกม **โฟกัสหลัก: ระดับอาชีวศึกษา (ปวช./ปวส.)** ก่อน — ให้ระบบการศึกษาหลักสมบูรณ์ก่อนขยายไประดับอื่น

```
[โฟกัสตอนนี้]       [ขยายในอนาคต]
ปวช. → ปวส.    →    มัธยม → ประถม
   ↓      ↓
Tutorial + Campaign + Endless
ครูติดตาม + ระบบประเมิน + Curriculum สอศ.
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
- [x] **Mobile / Tablet Support** — รองรับ touch screen v0.21.2

---

## Phase 1 — LMS Foundation ✅ เสร็จสมบูรณ์
> *ทำก่อนอื่น เพื่อให้ครูสามารถใช้ในชั้นเรียนได้จริง*

| ฟีเจอร์ | รายละเอียด | สถานะ |
|---|---|---|
| **Teacher Role** | บัญชีครู แยกจาก student สามารถสร้างห้องเรียนได้ | [x] v0.17.0 |
| **Classroom** | สร้างห้องด้วยโค้ด 6 หลัก นักเรียน join ได้ทันที | [x] v0.17.0 |
| **Student Dashboard (ครู)** | ดู progress นักเรียนแต่ละคน ด่านไหนผ่าน ใช้เวลาเท่าไหร่ | [x] v0.17.0 |
| **Assignment** | ครูกำหนดด่านที่ต้องผ่านพร้อม deadline — นักเรียนเห็นใน MainMenu | [x] v0.18.0 |
| **Flowchart Save/Load** | บันทึก flowchart ต่อด่านใน Firestore | [x] v0.14.0 |

---

## Phase 2 — Curriculum (ปวช./ปวส.)
> *โฟกัสระดับอาชีวศึกษาก่อน — ระดับอื่นรอขยายในอนาคต*

| ระดับ | อายุ | เนื้อหา | จำนวนด่าน | สถานะ |
|---|---|---|---|---|
| **ปวช.** | 15–18 | Sequence → Decision → Loop → Algorithm เต็มรูปแบบ | 20 ด่าน | มีแล้ว |
| **ปวส.** | 18–20 | Nested Loop, Pattern Recognition, Boss Challenge | 10 ด่าน advanced | [x] v0.19.0 |
| **มัธยม** | 12–18 | Decision, Loop, Counter | 15 ด่าน | [ ] DEFER |
| **ประถม** | 8–12 | Sequence พื้นฐาน, ศัตรูเป็นสัตว์น่ารัก | 10 ด่าน | [ ] DEFER |

---

## Phase 3 — Assessment & Analytics
> *ระบบประเมินและวิเคราะห์ผลการเรียนรู้*

| ฟีเจอร์ | รายละเอียด | สถานะ |
|---|---|---|
| **Auto-grading** | ให้คะแนน flowchart ตาม efficiency (จำนวน node, turn, HP เหลือ) | [x] v0.20.0 |
| **Learning Objective Tag** | แต่ละด่าน tag concept ที่สอน (IF/ELSE, LOOP, etc.) | [x] มีอยู่แล้ว (concept field) |
| **Teacher Analytics Dashboard** | กราฟ class average, นักเรียนที่ต้องช่วยเหลือ, concept ที่ทุกคนติด | [x] v0.20.0 |
| **Export Report** | CSV สรุป progress ส่งผู้ปกครองหรือ ผอ. (Teacher Dashboard → Export CSV) | [x] v0.21.0 |
| **Badge & Certificate** | ใบประกาศเมื่อผ่านครบ curriculum ระดับ | [x] v0.21.0 |

---

## Phase 4 — Platform & Accessibility
> *ขยายการเข้าถึงให้ครอบคลุมทุกกลุ่มผู้ใช้*

| ฟีเจอร์ | รายละเอียด | สถานะ |
|---|---|---|
| **Mobile / Tablet Support** | Responsive layout สำหรับ touch screen | [x] v0.21.2 |
| **PWA / Offline Mode** | เล่นได้แม้ internet ไม่เสถียร sync ทีหลัง | [x] v0.21.0 |
| **Sandbox Mode** | วาด flowchart อิสระ ไม่มีศัตรู ฝึก logic ล้วน ๆ | [x] v0.21.0 |
| **Multi-language** | ภาษาอังกฤษ สำหรับ international | [ ] DEFER |
| **Parent Portal** | ผู้ปกครองดู progress บุตรหลานได้ | [ ] DEFER |

---

## Phase 5 — ระบบการศึกษาหลัก (ปวช./ปวส.)
> *ทำให้ระบบการศึกษาสมบูรณ์ก่อน — Advanced LMS features ตามมา*

| ฟีเจอร์ | รายละเอียด | สถานะ |
|---|---|---|
| **Custom Level Editor** | ครูสร้างด่านเองได้ กำหนด enemy, allowed blocks, objective | [x] v0.22.0 |
| **Class Competition** | Leaderboard แบบ classroom เทียบกันในห้อง | [x] v0.23.0 |
| **AI Hint System** | แนะนำเมื่อนักเรียนติดนานเกิน N นาที | [x] v0.24.0 |
| **Curriculum Alignment** | เชื่อมโยงกับหลักสูตร **สอศ.** (ปวช./ปวส.) อย่างเป็นทางการ | [ ] |
| **Concept Glossary** | อธิบาย concept (Loop, Decision, Sequence ฯลฯ) ใน app | [ ] |
| **Loss Analysis Screen** | หลังแพ้บอกว่า flowchart จบตรงไหน + ทำไมถึงแพ้ | [ ] |
| **Peer Review** | แชร์ flowchart ให้เพื่อนวิจารณ์และให้ feedback | [ ] DEFER |
| **Infinity Dev Terminal Shop** | rollShopInventory() — items ใน Terminal ตาม wave | [ ] DEFER |

---

## สรุป Priority (มีนาคม 2026)

> **โฟกัส: ปวช./ปวส. ก่อน** — ระบบหลักต้องสมบูรณ์ก่อนขยายขอบเขต

```
[เสร็จแล้ว]  Phase 1–4 (LMS, Analytics, Mobile, Sandbox)

[กำลังทำ]   Phase 5 — ระบบการศึกษาหลัก ปวช./ปวส.
              1. Tutorial + Campaign ที่สมบูรณ์
              2. Endless Mode (ไม่ซับซ้อน)
              3. Concept Glossary
              4. Loss Analysis Screen
              5. Curriculum Alignment (สอศ. ปวช./ปวส.)

[DEFER]      ประถม / มัธยม curriculum
             Parent Portal
             Multi-language
             Infinity Dev Terminal Shop (rollShopInventory)
             Peer Review
```

---

*FlowFight — Learn to Think, Think to Win*
