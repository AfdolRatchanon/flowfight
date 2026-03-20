# FlowFight — SDLC Process

กระบวนการพัฒนาซอฟต์แวร์สำหรับโปรเจกต์นี้
ใช้ **Mini-Scrum** (Agile Lightweight) — Sprint 2 สัปดาห์

---

## บทบาท

| บทบาท | ผู้รับผิดชอบ | หน้าที่ |
|---|---|---|
| **Product Owner** | ผู้ใช้ (User) | กำหนดทิศทาง, ออกคำสั่ง, approve ผลลัพธ์ |
| **PM** (Project Manager) | Claude | จัดลำดับงาน, ติดตาม scope, bump version |
| **SA** (System Analyst) | Claude | วิเคราะห์ระบบ, ออกแบบ solution ก่อนลงมือ |
| **BA** (Business Analyst) | Claude | แปล requirement เป็น technical spec, ถามเมื่อ scope ไม่ชัด |
| **Developer** | Claude | เขียนโค้ด, แก้บัก, refactor |
| **QA / Tester** | Claude | ตรวจสอบ build, รัน unit test, ตรวจ edge case |
| **Release Manager** | Claude | อัปเดต docs, เสนอ commit message, เตรียม release |

> ผู้ใช้เป็น Product Owner เท่านั้น — ออกคำสั่งและ approve
> Claude สวมทุก role ที่เหลือในกระบวนการเดียว

---

## Sprint Cycle (2 สัปดาห์)

```
[Product Owner] ออก requirement / feature request
       |
       v
[BA] วิเคราะห์ requirement — ถามถ้าไม่ชัด
       |
       v
[SA] อ่านไฟล์ที่เกี่ยวข้อง — ออกแบบ solution
       |
       v
[PM] ถ้า scope ใหญ่ → สร้าง todo list — แจ้ง plan ก่อน
       |
       v
[Developer] พัฒนาตาม scope ที่ตกลง
       |
       v
[QA] npm run build + npm test — ตรวจ edge case
       |
       v
[Release Manager] bump version + อัปเดต README/ROADMAP
       |
       v
[PM] เสนอ commit message → Product Owner commit เอง
       |
       v
[Product Owner] review + approve (หรือส่งกลับแก้ไข)
```

---

## Phase รายละเอียด

### Phase 1 — Requirements (BA)

**ทำเมื่อ:** ได้รับคำสั่งใหม่

- ทำความเข้าใจ requirement ให้ชัดก่อนลงมือ
- ถ้า scope ไม่ชัดเจน → ถามก่อน ไม่เดาเอง
- ถ้า scope ใหญ่เกิน 1 ไฟล์ → แจ้ง plan รออนุมัติ
- ระบุสิ่งที่จะทำ และ **สิ่งที่จะไม่ทำ** (out of scope)

### Phase 2 — Analysis & Design (SA)

**ทำเมื่อ:** requirement ชัดแล้ว

- อ่านทุกไฟล์ที่เกี่ยวข้องก่อนลงมือ — ห้ามเดาโครงสร้าง
- ระบุ:
  - ไฟล์ที่ต้องแก้ไข
  - ผลกระทบต่อส่วนอื่น (side effect)
  - ทางเลือก solution (ถ้ามีมากกว่า 1 แนวทาง)

### Phase 3 — Development (Developer)

**ทำเมื่อ:** design อนุมัติแล้ว

- แก้เฉพาะสิ่งที่ถูกขอ — ไม่เพิ่ม feature นอก scope
- ไม่เพิ่ม comment/docstring ในโค้ดที่ไม่ได้แก้
- ไม่แก้ style/format ของโค้ดที่ไม่เกี่ยวข้อง
- Branch naming: `feature/xxx`, `fix/xxx`, `refactor/xxx`

### Phase 4 — Testing & QA (QA / Tester)

**ทำเมื่อ:** development เสร็จ

| กรณี | action |
|---|---|
| แก้ game logic / engine | `npm test` ผ่านก่อนส่ง |
| แก้ Firestore rules | `firebase deploy --only firestore:rules` |
| ทุกกรณี | `npm run build` ผ่าน — ห้ามส่งถ้า build error |
| แก้ logic ใหม่ที่ยังไม่มี test | เขียน test ใน `src/engines/*.test.ts` ด้วย |

**Definition of Done (DoD)** — feature ถือว่า "เสร็จ" เมื่อ:
- [ ] Build ผ่านโดยไม่มี error
- [ ] Unit test ผ่าน (ถ้ามี test ที่เกี่ยวข้อง)
- [ ] ไม่มี TypeScript error (`tsc --noEmit`)
- [ ] ทดสอบ manual ใน dev server แล้ว
- [ ] ไม่มี regression ในส่วนอื่น

### Phase 5 — Release (Release Manager + PM)

**ทำเมื่อ:** QA ผ่านแล้ว

1. **Bump version** ใน `package.json` ตาม Semantic Versioning:
   - `patch` (x.x.**1**) — bugfix, เปลี่ยนเล็กน้อย
   - `minor` (x.**1**.0) — feature ใหม่ backward compatible
   - `major` (**1**.0.0) — breaking change ใหญ่

2. **อัปเดต README.md** — changelog section
3. **อัปเดต ROADMAP.md** — mark feature ที่ทำเสร็จ
4. **เสนอ commit message** ตามรูปแบบใน CLAUDE.md
5. Product Owner commit เอง — Claude ไม่ commit อัตโนมัติ

---

## Bug Lifecycle

```
[Product Owner] รายงาน bug หรือ QA พบเจอ
       |
       v
[BA] จำแนก severity:
     - Critical  : build พัง / data loss / security
     - Major     : feature ใช้งานไม่ได้
     - Minor     : UI ผิด / ข้อความผิด
     - Trivial   : cosmetic เล็กน้อย
       |
       v
[SA] วิเคราะห์ root cause — อ่านโค้ดที่เกี่ยวข้อง
       |
       v
[Developer] แก้ไข + เพิ่ม regression test (ถ้าเหมาะสม)
       |
       v
[QA] verify fix — ตรวจว่า bug หาย และไม่เกิด regression
       |
       v
[Release Manager] bump patch version + changelog
       |
       v
[Product Owner] approve + commit
```

**Severity → Version bump:**
| Severity | Version bump |
|---|---|
| Critical / Major | `patch` ทันที |
| Minor / Trivial | รวมกับ release ถัดไป |

---

## Backlog & Prioritization

เมื่อมี feature หลายอย่างรอทำ Claude จะจัด priority ตาม:

1. **Critical bug** — แก้ก่อนทุกอย่าง
2. **Core gameplay** — กระทบประสบการณ์ผู้เล่นโดยตรง
3. **UX/UI polish** — ดูดีขึ้นโดยไม่เปลี่ยน mechanic
4. **Technical debt** — refactor, test coverage
5. **Nice-to-have** — feature เสริมที่ไม่เร่งด่วน

---

## Agile Values ที่ยึดถือ

| หลักการ | การปฏิบัติ |
|---|---|
| Working software over documentation | build ต้องผ่านก่อนส่งเสมอ |
| Responding to change over following a plan | ปรับ scope ได้ถ้า Product Owner เห็นชอบ |
| Simplicity | แก้เฉพาะที่ถูกขอ ไม่ over-engineer |
| Continuous improvement | ทุก release มี retrospective สั้น ๆ |

---

## ข้อมูลที่เกี่ยวข้อง

- [CLAUDE.md](CLAUDE.md) — Working Agreement (กฎการทำงานรายวัน)
- [ROADMAP.md](ROADMAP.md) — แผนพัฒนาระยะยาว
- [README.md](README.md) — เอกสารโปรเจกต์และ changelog
