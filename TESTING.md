# FlowFight — Manual Test Plan

**Version:** v0.24.0 | **อัปเดต:** มีนาคม 2026

> สำหรับ Manual Testing ทั้งระบบ ให้ทำตามลำดับ Section และ mark ผ่าน/ล้มเหลว
> Auto tests รัน: `npm test` | Firestore rules: `npm run test:rules` (ต้องรัน Emulator ก่อน)

---

## สรุปผลการทดสอบ

| Section | Pass | Fail | Skip | หมายเหตุ |
|---|---|---|---|---|
| 1. Auth | | | | |
| 2. Character | | | | |
| 3. Level Select | | | | |
| 4. Battle — Flowchart Execution | | | | |
| 5. Flowchart Editor | | | | |
| 6. Shop | | | | |
| 7. Achievements | | | | |
| 8. Leaderboard | | | | |
| 9. Teacher Dashboard | | | | |
| 10. Admin Dashboard | | | | |
| 11. Endless Mode | | | | |
| 12. Sandbox Mode | | | | |
| 13. Certificate | | | | |
| 14. Mobile Support | | | | |
| 15. Security | | | | |

---

## 1. Auth (ระบบล็อกอิน)

### 1.1 Login ด้วย Email/Password
- [ ] กรอก email + password ถูกต้อง → เข้าสู่ระบบได้
- [ ] password ผิด → แสดง error message
- [ ] email ไม่มีในระบบ → แสดง error message
- [ ] ไม่กรอก email → validate ก่อน submit

### 1.2 Register ด้วย Email/Password
- [ ] กรอกข้อมูลครบ → สร้างบัญชีสำเร็จ → redirect ไปสร้างตัวละคร
- [ ] email ซ้ำ → แสดง error
- [ ] password สั้นเกิน → แสดง error

### 1.3 Login ด้วย Google
- [ ] กดปุ่ม Google → popup เปิด → เลือกบัญชี → เข้าสู่ระบบได้
- [ ] ปิด popup → ไม่ crash

### 1.4 Login Anonymous
- [ ] กดปุ่ม Guest → เข้าสู่ระบบในฐานะ anonymous user
- [ ] ตัวละครสามารถสร้างและเล่นได้ปกติ

### 1.5 Teacher Register
- [ ] ไปหน้า `/teacher-register` → กรอก invite code ที่ถูกต้อง → role เปลี่ยนเป็น teacher
- [ ] invite code ไม่ถูกต้อง → แสดง error
- [ ] invite code ที่ใช้แล้ว → แสดง error
- [ ] หลัง upgrade → redirect ไป `/teacher` dashboard

### 1.6 Logout
- [ ] กดออกจากระบบ → redirect ไป `/login`
- [ ] กดปุ่ม back browser หลัง logout → ไม่สามารถเข้า protected routes ได้

---

## 2. Character (ตัวละคร)

### 2.1 สร้างตัวละคร
- [ ] ผู้ใช้ใหม่ → redirect ไปสร้างตัวละครก่อนเสมอ
- [ ] เลือก class ได้ทั้ง 4: Knight / Mage / Rogue / Barbarian
- [ ] กรอกชื่อ → บันทึกได้
- [ ] stats เริ่มต้นแต่ละ class แตกต่างกันถูกต้อง

### 2.2 Character Customizer
- [ ] เปลี่ยนสีตัวละครได้ (primary / secondary / accent)
- [ ] เปลี่ยน skin ได้ (ถ้ามี)
- [ ] กด Save → บันทึก Firestore → โหลดกลับมาถูกต้องเมื่อ refresh

### 2.3 Level System
- [ ] ชนะด่าน → ได้รับ XP → XP bar อัปเดต
- [ ] XP เต็ม threshold → level up notification แสดง
- [ ] Level up → stats เพิ่มขึ้น (HP, ATK, DEF)
- [ ] Level สูงสุด 100 → ไม่สามารถ level เกิน 100
- [ ] Passive bonuses unlock ที่ level 2, 4, 6 แสดงถูกต้อง

---

## 3. Level Select

### 3.1 Campaign Levels (30 ด่าน)
- [ ] ด่าน 1 unlock ตั้งแต่เริ่ม
- [ ] ด่าน 2 unlock หลังชนะด่าน 1 (unlock progression ถูกต้อง)
- [ ] ด่านที่ยังไม่ unlock → cursor: not-allowed, กดไม่ได้
- [ ] ด่านที่ผ่านแล้ว → แสดง checkmark สีเขียว
- [ ] แสดง enemy name, concept, difficulty ถูกต้องทุกด่าน

### 3.2 Daily Farm Reset Strip
- [ ] แสดง countdown timer ถึงเที่ยงคืน UTC+7
- [ ] timer นับถอยหลังถูกต้อง

### 3.3 Custom Levels (ด่านของครู)
- [ ] นักเรียนที่อยู่ใน classroom เห็น section "ด่านของครู"
- [ ] เฉพาะด่านที่ published เท่านั้นที่แสดง
- [ ] กดเล่น → navigate ไป `/custom-battle/:levelId`
- [ ] นักเรียนที่ไม่ได้อยู่ใน classroom → ไม่เห็น section นี้

---

## 4. Battle — Flowchart Execution

### 4.1 Planning Phase
- [ ] หน้า battle โหลดสำเร็จ — เห็น battle arena (บน) + flowchart editor (ล่าง)
- [ ] แสดง Hero HP, Enemy HP ถูกต้อง
- [ ] Turn counter เริ่มที่ 1
- [ ] Budget (💎) แสดงถูกต้อง (3 ต่อ turn ปกติ)

### 4.2 Run Flowchart
- [ ] กด ▶ Run หรือ Space → รัน flowchart
- [ ] แต่ละ action node ถูก execute ตามลำดับ
- [ ] Hero HP ลดเมื่อถูกโจมตี
- [ ] Enemy HP ลดเมื่อ hero โจมตี
- [ ] Battle log แสดง action ทุกรอบ

### 4.3 Speed Control
- [ ] ปุ่ม x1, x2, x4 เปลี่ยน animation speed ได้
- [ ] เปลี่ยน speed ระหว่าง battle ได้
- [ ] Mobile: ปุ่ม speed มีขนาดใหญ่พอกดได้

### 4.4 Win/Lose
- [ ] Enemy HP = 0 → Victory overlay แสดง
- [ ] Hero HP = 0 → Defeat overlay แสดง
- [ ] Victory: แสดง XP ที่ได้, score 0–100, gold reward
- [ ] Defeat: แสดงปุ่ม Retry
- [ ] ชนะด่านครั้งแรก → บันทึก progress ใน Firestore

### 4.5 Reset Flowchart
- [ ] กดปุ่ม ↺ Reset Flowchart → canvas เหลือแค่ Start + End
- [ ] กด R key → reset ทำงานได้ (ทั้งระหว่าง planning และหลัง battle)
- [ ] reset ระหว่าง execution (⏹ หยุดก่อน) → reset สำเร็จ

### 4.6 Required Blocks
- [ ] ด่านที่กำหนด required blocks → missing blocks แสดงเป็นสีแดง/warning
- [ ] รัน flowchart โดยไม่มี required block → แสดง validation error

### 4.7 Enemy Shield
- [ ] ด่านที่ศัตรูมี Shield → hero attack ธรรมดาไม่ทะลุ
- [ ] ใช้ action ที่ถูกต้อง (ตาม requiredBlocks) → ทะลุ Shield ได้

### 4.8 Enemy AI
- [ ] ศัตรูโจมตี hero ทุก turn
- [ ] ศัตรูที่มี heal → heal เมื่อ HP ต่ำ
- [ ] ศัตรูที่มี ailment strikes → ใส่ burn/freeze/poison ให้ hero

### 4.9 Score / Auto-grading
- [ ] คะแนน = HP% × 0.6 + Node Efficiency × 0.4
- [ ] ชนะด้วย HP เต็ม + น้อย node → score สูง
- [ ] score บันทึกใน Firestore (ตรวจ `users/{uid}/levelScores`)

---

## 5. Flowchart Editor

### 5.1 เพิ่ม Node
- [ ] คลิก canvas → เปิด context menu 3 ระดับ
- [ ] Process → Combat → Attack → วาง node ได้
- [ ] Process → Support → Heal → วาง node ได้
- [ ] Decision → HP → HP < 50? → วาง node ได้
- [ ] Loop → วาง loop node ได้
- [ ] Class Skills → แสดง skills ของ class ตัวเอง

### 5.2 เชื่อม Edge
- [ ] ลากจาก handle ของ node ไปยัง node อื่น → เชื่อมได้
- [ ] Decision node: YES edge (สีเขียว), NO edge (สีแดง)
- [ ] Loop node: LOOP edge (สีส้ม), NEXT edge (สีฟ้า)

### 5.3 ลบ Node/Edge
- [ ] กด Backspace หรือ Delete เมื่อ select node → ลบได้ (ยกเว้น Start/End)
- [ ] Start/End node → ลบไม่ได้
- [ ] Right-click node → context menu → Delete → ลบได้
- [ ] Right-click edge → Delete edge → ลบได้

### 5.4 Undo/Redo
- [ ] เพิ่ม node → Ctrl+Z → node หายไป
- [ ] Ctrl+Y → node กลับมา
- [ ] ลบ node → Ctrl+Z → node กลับมา
- [ ] เชื่อม edge → Ctrl+Z → edge หายไป
- [ ] เปลี่ยน action type → Ctrl+Z → กลับเป็น type เดิม
- [ ] Undo หลายครั้งต่อเนื่อง → ถูกต้องทุก step
- [ ] Redo หลังจาก Undo → ถูกต้อง
- [ ] ทำอะไรหลัง Undo → _future ล้าง (ไม่ Redo กลับไปได้)
- [ ] **Mobile:** ปุ่ม ↩ (undo) และ ↪ (redo) ใน footer ทำงานได้

### 5.5 Save/Load Flowchart
- [ ] วาด flowchart → auto-save ทุก 1.5 วินาที (เห็น "☁️ บันทึกแล้ว ✓")
- [ ] Refresh หน้า → โหลด flowchart กลับมาจาก Firestore
- [ ] เปลี่ยนไปด่านอื่น → flowchart แต่ละด่าน save แยกกัน

### 5.6 Node Limit
- [ ] ด่านที่กำหนด nodeLimit → เพิ่ม node เกินไม่ได้ (flash warning)
- [ ] ปุ่ม node ใน menu disable เมื่อถึง limit

### 5.7 Budget Validation
- [ ] flowchart ที่ใช้ budget เกินต่อ turn → แสดง warning สีแดง
- [ ] ไม่สามารถรันจนกว่าจะแก้ budget

### 5.8 Tutorial Guide
- [ ] ด่าน 1–20 → คู่มือ (TutorialGuide) แสดงอัตโนมัติ
- [ ] กด X → ปิดคู่มือได้
- [ ] กด "ถัดไป" → step ถัดไปของคู่มือ
- [ ] Desktop: คู่มืออยู่มุมขวาล่าง
- [ ] **Mobile: คู่มืออยู่บน-กลาง ไม่บัง footer bar**

### 5.9 AI Hint System
- [ ] idle ใน planning phase นาน 3 นาที → popup 💡 คำใบ้แสดง
- [ ] คำใบ้มาจาก level.objectives
- [ ] กดปุ่ม "คำใบ้ถัดไป" → hint ถัดไป
- [ ] กด "เข้าใจแล้ว" หรือ ✕ → popup หาย ไม่แสดงอีกในด่านนั้น
- [ ] กด ▶ Run → popup หายทันที
- [ ] เพิ่ม node → timer รีเซ็ต (hint เลื่อนออกไปอีก 3 นาที)
- [ ] Endless mode → hint ไม่แสดง

---

## 6. Shop

### 6.1 เปิด Shop
- [ ] กดปุ่ม Shop ใน battle screen → Shop panel เปิดได้
- [ ] แสดง Gold ของผู้เล่นถูกต้อง
- [ ] แสดงรายการ items ทั้งหมด

### 6.2 ซื้อ Item
- [ ] Gold พอ → กด Buy → item ไปอยู่ใน inventory
- [ ] Gold ไม่พอ → ปุ่ม disable หรือ error
- [ ] Gold ลดลงหลังซื้อ

### 6.3 Equip Item
- [ ] กด Equip → item ไปอยู่ใน Equipment slot
- [ ] stats ของ hero เปลี่ยนตาม item
- [ ] ใส่ item ใหม่ใน slot เดิม → item เก่ากลับไป inventory
- [ ] Unequip → item กลับ inventory, stats กลับค่าเดิม

### 6.4 Potion/Antidote
- [ ] ใช้ Potion ใน battle → HP ฟื้นขึ้น
- [ ] ใช้ Antidote → ailment หายไป (burn/poison/freeze)
- [ ] จำนวน Potion ลดลงหลังใช้
- [ ] หมด Potion → ปุ่มใช้ disable

---

## 7. Achievements

| Achievement | Unlock Condition | ทดสอบ |
|---|---|---|
| first_blood | ชนะด่านแรก | [ ] |
| speed_demon | ชนะภายใน 5 turns | [ ] |
| iron_will | ชนะด้วย HP < 10% | [ ] |
| untouchable | ชนะโดยไม่รับ damage | [ ] |
| loop_master | ผ่าน level_11 (Loop ด่านแรก) | [ ] |
| campaign_complete | ผ่านครบ 20 ด่าน campaign | [ ] |
| endless_wave_10 | Endless Mode ถึง wave 10 | [ ] |
| class_skill_user | ใช้ Class Skill ในการชนะ | [ ] |

- [ ] Achievement unlock → toast notification แสดง
- [ ] ไปหน้า Achievements → แสดง badge ทุกอันที่ unlock
- [ ] Achievement ที่ยังไม่ unlock → แสดงสีเทา (lock state)
- [ ] Achievement ไม่ unlock ซ้ำถ้ามีอยู่แล้ว

---

## 8. Leaderboard

### 8.1 Global Leaderboard
- [ ] ไปหน้า `/leaderboard` → แสดงรายชื่อผู้เล่น
- [ ] เรียงตาม levelsCompleted → experience → totalKills
- [ ] แถวของตัวเอง highlight

### 8.2 Per-Level Leaderboard
- [ ] กดดู Level board จาก victory screen หรือ leaderboard page
- [ ] แสดง best time, damage dealt, HP remaining ต่อด่าน
- [ ] เรียง score ถูกต้อง

### 8.3 Classroom Leaderboard
- [ ] MainMenu เมื่ออยู่ใน classroom → เห็นปุ่มสีเขียว "อันดับห้องเรียน"
- [ ] กดปุ่ม → ไปหน้า `/classroom-leaderboard`
- [ ] แสดงเฉพาะสมาชิกในห้องเรียนเดียวกัน
- [ ] เรียง: ด่านผ่าน → avg score → XP
- [ ] แถวตัวเอง highlight สีม่วง
- [ ] Progress bar แสดง % ด่านที่ผ่านจากทั้งหมด 30 ด่าน
- [ ] ยังไม่มีข้อมูล → แสดงข้อความแนะนำ
- [ ] ไม่ได้อยู่ใน classroom → แสดงข้อความ "ยังไม่ได้เข้าร่วมห้องเรียน"
- [ ] ชนะด่าน → กลับมาดู leaderboard → ข้อมูลอัปเดต

### 8.4 Endless Leaderboard
- [ ] ชนะ Endless Mode → score บันทึกถูกต้อง
- [ ] Leaderboard แสดง wave สูงสุดและ score

---

## 9. Teacher Dashboard

### 9.1 Classroom Management
- [ ] สร้างห้องเรียน → ได้ roomCode 6 หลัก
- [ ] นักเรียน join ด้วย roomCode → ชื่อแสดงใน student list
- [ ] ดู student list → เห็นชื่อ, email, ด่านผ่าน, avg score

### 9.2 Assignments
- [ ] สร้าง assignment → เลือก level IDs, deadline, title
- [ ] นักเรียนใน classroom เห็น assignment ใน MainMenu
- [ ] assignment หมดอายุ → แสดงสถานะ expired
- [ ] ลบ assignment → หายจาก student view

### 9.3 Analytics
- [ ] Tab Analytics → แสดง class average score
- [ ] Bar chart per level แสดงถูกต้อง
- [ ] รายชื่อนักเรียนที่ avg < 60 (ต้องช่วย) แสดง
- [ ] Export CSV → ดาวน์โหลดไฟล์ได้ (มีข้อมูลถูกต้อง)

### 9.4 Custom Level Editor
- [ ] Tab "ด่านของฉัน" → กดสร้างด่านใหม่ → form เปิด
- [ ] กรอกข้อมูลครบ: ชื่อ, คำอธิบาย, concept, difficulty, enemy config
- [ ] บันทึก → ด่านปรากฏใน list (published = false)
- [ ] กดปุ่ม Publish → published เปลี่ยนเป็น true
- [ ] นักเรียน refresh LevelSelect → เห็น custom level ใหม่
- [ ] กด Edit → form โหลดข้อมูลเดิม → แก้แล้วบันทึกได้
- [ ] กด Delete → ยืนยัน → ด่านหาย

---

## 10. Admin Dashboard

### 10.1 Access Control
- [ ] Login เป็น admin → เห็นเมนู Admin Panel ใน MainMenu
- [ ] Login เป็น student → ไป `/admin` → redirect กลับ `/`

### 10.2 Stats Overview
- [ ] แสดงจำนวน users ทั้งหมด, จำนวนห้องเรียน
- [ ] แสดงจำนวน invite codes (ว่าง / ใช้แล้ว)

### 10.3 Teacher Invite Codes
- [ ] สร้าง invite code ใหม่ → ปรากฏใน list
- [ ] ลบ code ที่ยังว่าง → หายจาก list
- [ ] code ที่ใช้แล้ว → ไม่มีปุ่มลบ, แสดง UID ผู้ใช้

### 10.4 User List
- [ ] Tab ผู้ใช้ทั้งหมด → แสดง list พร้อม role/email/score
- [ ] Role color ถูกต้อง: admin(ม่วง), teacher(เหลือง), student(เทา)
- [ ] กดปุ่ม ← กลับ → navigate ไปหน้าหลัก

---

## 11. Endless Mode

- [ ] เลือก Endless Mode จาก mode select → เข้าด่าน endless
- [ ] Wave 1: ศัตรูอ่อน, wave สูงขึ้น: ศัตรูแข็งขึ้น
- [ ] ชนะ wave → wave counter เพิ่ม
- [ ] แพ้ → แสดงสรุป: wave ที่ถึง, score, damage
- [ ] Score = wave × HP%
- [ ] Score บันทึก Endless Leaderboard
- [ ] Achievement `endless_wave_10` unlock ที่ wave 10

---

## 12. Sandbox Mode

- [ ] ไปหน้า `/sandbox` จาก MainMenu → โหลดสำเร็จ
- [ ] วาด flowchart อิสระได้ (ไม่มี enemy, ไม่มีการสู้)
- [ ] ทุก node type ใช้ได้ (ไม่มี restriction)
- [ ] Undo/Redo ทำงานได้
- [ ] ไม่มีปุ่ม Run / battle phase

---

## 13. Certificate

- [ ] ไปหน้า `/certificate` → โหลดสำเร็จ
- [ ] แสดงชื่อผู้เล่น, ด่านที่ผ่าน, avg score, badge ที่ได้รับ
- [ ] กด Print → browser print dialog เปิด (ใช้ @media print)
- [ ] badge icon แสดงถูกต้อง

---

## 14. Mobile Support

> ทดสอบบน Chrome DevTools → Toggle Device Toolbar (iPhone SE หรือ Pixel 5)

### 14.1 Layout
- [ ] หน้า MainMenu แสดงสวยงาม ไม่ overflow
- [ ] หน้า battle: battle arena (บน) + flowchart editor (ล่าง) ไม่ซ้อนทับกัน
- [ ] ปุ่ม speed (x1/x2/x4) มีขนาด 36px กดได้ง่าย
- [ ] ปุ่ม ↩ ↪ (undo/redo) ใน footer กดได้

### 14.2 Touch Interaction
- [ ] ลาก node บน canvas ได้ (ReactFlow touch drag)
- [ ] Pinch to zoom ใน canvas ได้
- [ ] tap canvas → context menu เปิดได้
- [ ] long-press หรือ tap node → context menu แสดง

### 14.3 Hint & Guide Position
- [ ] TutorialGuide อยู่ด้านบน-กลาง (ไม่บัง footer)
- [ ] AI Hint popup อยู่มุมขวาล่าง เหนือ footer (ไม่บัง Reset button)

---

## 15. Security

> ทดสอบ Firestore rules ด้วย `npm run test:rules` (ต้องรัน Emulator ก่อน)
> หรือทดสอบ manual ด้วย browser console:
> `firebase.firestore().collection('users').get()`

### 15.1 Firestore Rules (Manual)
- [ ] Login เป็น student → `db.collection('users').get()` → PERMISSION_DENIED (ไม่สามารถ list ได้)
- [ ] Login เป็น student → `db.doc('users/อื่น').get()` → PERMISSION_DENIED
- [ ] Login เป็น student → `db.collection('teacher_codes').get()` → PERMISSION_DENIED (ไม่สามารถ list)
- [ ] Login เป็น student → `db.doc('teacher_codes/SOMECODE').get()` → อ่านได้ (สำหรับ verify)
- [ ] Login เป็น student → `db.collection('classrooms').get()` → PERMISSION_DENIED (ไม่สามารถ list)
- [ ] Login เป็น student → `db.doc('classrooms/ROOM01').get()` → อ่านได้ (สำหรับ join)

### 15.2 Role Escalation Prevention
- [ ] student ไม่สามารถแก้ `role` field ของตัวเองเป็น `admin` ผ่าน client ได้
- [ ] student → teacher (ผ่าน invite code) → ทำงานได้ปกติ
- [ ] teacher → admin (ผ่าน client) → PERMISSION_DENIED

### 15.3 Custom Level Access
- [ ] นักเรียน write ไปยัง `customLevels` → PERMISSION_DENIED
- [ ] ครู write ไปยัง `customLevels` ของครูอื่น → PERMISSION_DENIED

### 15.4 Classroom Board
- [ ] นักเรียนเขียน entry ของตัวเองใน `classroomBoards` → สำเร็จ
- [ ] นักเรียนเขียน entry ของคนอื่น → PERMISSION_DENIED
- [ ] avgScore > 100 → PERMISSION_DENIED (field validation)

---

## Regression Checklist (ทำหลัง Deploy)

- [ ] เปิดหน้าหลัก → BGM เล่น
- [ ] เปลี่ยน theme (Dark/Light) → UI เปลี่ยนทั้งระบบ
- [ ] Volume control → ปรับ BGM/SFX แยกกัน
- [ ] ปิด tab → เปิดใหม่ → session ยังอยู่ (Auth persistent)
- [ ] ใช้ URL โดยตรง `/battle/level_99` (ไม่มีในระบบ) → redirect กลับ `/levels`
- [ ] ใช้ URL `/admin` เป็น student → redirect กลับ `/`
- [ ] ใช้ URL `/teacher` เป็น student → redirect กลับ `/`

---

*FlowFight — Learn to Think, Think to Win*
