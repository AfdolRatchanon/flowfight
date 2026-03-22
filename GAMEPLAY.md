# FlowFight — Gameplay Guide

คู่มือการเล่นฉบับสมบูรณ์

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

### Keyboard Shortcuts

| ปุ่ม | ความหมาย |
|------|----------|
| Space | Execute Turn |
| R | Retry (เริ่มด่านใหม่) |
| Esc | Stop |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |

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

### Level System

- **Max Level: 100**
- XP ได้จากการชนะด่าน (Diminishing Returns เมื่อ clear ซ้ำ)

| Level | XP รวมที่ต้องการ |
|-------|-----------------|
| 2 | 100 |
| 3 | 250 |
| 5 | 700 |
| 10 | 3,200 |
| 20 | 15,700 |
| 30 | 38,200 |
| 50 | 138,700 |
| 75 | 299,200 |
| 100 (MAX) | 475,700 |

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
- บางชิ้นมีเงื่อนไข `requiredLevel`

---

## ด่านทั้งหมด (30 ด่าน + Endless)

ด่านออกแบบให้สอน Flowchart แบบสะสมตามลำดับ:
**Sequence → Decision → Loop → Combine → Mastery → ปวส. Advanced**

> แต่ละด่านมี **requiredBlocks** — ถ้าไม่มี block ที่กำหนด ศัตรูจะ Shield ป้องกันการโจมตีทุกครั้ง

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

### หมวด 8: ปวส. Advanced (ด่าน 21–30)

| # | ชื่อด่าน | Concept |
|---|---------|---------|
| 21 | Nested Decisions | if/else ซ้อนกัน 2 ชั้น (Ailment + HP พร้อมกัน) |
| 22 | Counter Intelligence | Multi-Condition Loop (Turn + HP ใน Loop เดียวกัน) |
| 23 | Tri-Ailment Dragon | จัดการ Burn + Poison + Freeze ทั้ง 3 พร้อมกัน |
| 24 | Skill Optimizer | Class Skill Timing เจาะ Armor สูง |
| 25 | Priority Protocol | เรียงลำดับ Condition ให้ถูกต้อง (Priority Queue) |
| 26 | Infinite Regress | Dual Exit Condition Loop (enemy_alive + turn_gte) |
| 27 | Enrage Protocol | รับมือ Enemy State Change (Enrage < 40% HP) |
| 28 | Efficiency Challenge | ออกแบบ Flowchart ใช้ Node น้อยที่สุด |
| 29 | The Architect's Trial | **Sub-Boss** — ใช้ทุก Condition Type |
| 30 | Grand Architect | **ปวส. Final Boss** (Void Emperor, 1000 HP, 4 💎/turn) |

### Endless Mode

| Mode | รายละเอียด |
|------|-----------|
| Endless / Infinity Dev | Survival wave ไม่จำกัด — score = Wave × HP% |

---

## Achievement System

ปลดล็อก achievement หลังชนะด่าน — ดูได้ที่หน้า `/achievements`

### Curriculum Badges

| Badge | เงื่อนไข |
|-------|---------|
| Algorithm Apprentice (🥉) | ผ่านด่าน 1–10 ครบ |
| Algorithm Expert (🥈) | ผ่านด่าน 1–20 ครบ |
| Algorithm Master (🥇) | ผ่านด่าน 1–30 ครบ |

รับ **ใบประกาศนียบัตร** ได้ที่หน้า `/certificate` เมื่อมี Badge แล้ว

---

## Scoring System

คะแนนต่อด่าน (0–100):

```
score = (HP% × 0.6) + (NodeEfficiency × 0.4)
```

- **HP%** — เปอร์เซ็นต์ HP ที่เหลือหลังชนะ × 60
- **NodeEfficiency** — `max(0, 40 - max(0, จำนวน node - 3) × 4)`
- แพ้ = 0 คะแนน
- เก็บเฉพาะ **คะแนนสูงสุด** ต่อด่าน
