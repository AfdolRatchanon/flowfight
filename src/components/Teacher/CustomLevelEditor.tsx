import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { CustomLevel, CustomLevelFormData, EnemyBehavior } from '../../types/game.types';
import { createCustomLevel, updateCustomLevel } from '../../services/customLevelService';

const ALL_BEHAVIORS: { value: EnemyBehavior; label: string }[] = [
  { value: 'attack',        label: 'Attack — โจมตีธรรมดา' },
  { value: 'poison_strike', label: 'Poison Strike — วางพิษ' },
  { value: 'freeze_strike', label: 'Freeze Strike — แช่แข็ง' },
  { value: 'burn_strike',   label: 'Burn Strike — เผา' },
  { value: 'power_strike',  label: 'Power Strike — โจมตีหนัก (cost 2)' },
  { value: 'cast_spell',    label: 'Cast Spell — เวทย์ (cost 2)' },
  { value: 'heal',          label: 'Heal — ฟื้น HP (cost 2)' },
];

const BLOCK_OPTIONS = [
  { value: 'attack',       label: 'Attack' },
  { value: 'heal',         label: 'Heal' },
  { value: 'dodge',        label: 'Dodge' },
  { value: 'cast_spell',   label: 'Cast Spell' },
  { value: 'power_strike', label: 'Power Strike' },
  { value: 'condition',    label: 'Condition (If/Else)' },
  { value: 'loop',         label: 'Loop' },
  { value: 'hp_less',      label: 'If HP < N' },
  { value: 'enemy_alive',  label: 'If Enemy Alive' },
  { value: 'turn_gte',     label: 'If Turn >= N' },
];

const DEFAULT_FORM: CustomLevelFormData = {
  name: '',
  description: '',
  concept: '',
  difficulty: 2,
  enemy: { name: '', hp: 200, atk: 15, def: 5, behaviors: ['attack'], budgetPerTurn: 1, shield: false },
  allowedBlocks: [],
  requiredBlocks: [],
  nodeLimit: '',
  objectives: 'กำจัดศัตรู',
  bonusObjective: '',
  published: false,
};

interface Props {
  classroomCode: string;
  teacherUid: string;
  existing?: CustomLevel;
  onSaved: () => void;
  onCancel: () => void;
}

export default function CustomLevelEditor({ classroomCode, teacherUid, existing, onSaved, onCancel }: Props) {
  const { colors } = useTheme();
  const [form, setForm] = useState<CustomLevelFormData>(() => {
    if (!existing) return DEFAULT_FORM;
    return {
      name: existing.name,
      description: existing.description,
      concept: existing.concept,
      difficulty: existing.difficulty,
      enemy: { ...existing.enemy },
      allowedBlocks: existing.allowedBlocks ?? [],
      requiredBlocks: existing.requiredBlocks ?? [],
      nodeLimit: existing.nodeLimit ?? '',
      objectives: existing.objectives.join('\n'),
      bonusObjective: existing.bonusObjective ?? '',
      published: existing.published,
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setField<K extends keyof CustomLevelFormData>(key: K, val: CustomLevelFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function setEnemy<K extends keyof CustomLevelFormData['enemy']>(key: K, val: CustomLevelFormData['enemy'][K]) {
    setForm((f) => ({ ...f, enemy: { ...f.enemy, [key]: val } }));
  }
  function toggleBehavior(b: EnemyBehavior) {
    setForm((f) => {
      const has = f.enemy.behaviors.includes(b);
      const next = has ? f.enemy.behaviors.filter((x) => x !== b) : [...f.enemy.behaviors, b];
      return { ...f, enemy: { ...f.enemy, behaviors: next.length ? next : [b] } };
    });
  }
  function toggleBlock(arr: 'allowedBlocks' | 'requiredBlocks', val: string) {
    setForm((f) => {
      const has = f[arr].includes(val);
      return { ...f, [arr]: has ? f[arr].filter((x) => x !== val) : [...f[arr], val] };
    });
  }

  async function handleSave() {
    if (!form.name.trim()) return setError('กรุณาใส่ชื่อด่าน');
    if (!form.enemy.name.trim()) return setError('กรุณาใส่ชื่อศัตรู');
    if (form.enemy.behaviors.length === 0) return setError('เลือก behavior ศัตรูอย่างน้อย 1');
    setSaving(true); setError('');
    try {
      if (existing) await updateCustomLevel(existing.id, form);
      else await createCustomLevel(classroomCode, teacherUid, form);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally { setSaving(false); }
  }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: colors.bgSurface, border: `1px solid ${colors.border}`,
    color: colors.text, borderRadius: 8, padding: '6px 10px', fontSize: 13, width: '100%',
    boxSizing: 'border-box', outline: 'none',
    ...extra,
  });
  const sectionTitle = (txt: string) => (
    <div style={{ color: colors.text, fontSize: 13, fontWeight: 800, borderBottom: `1px solid ${colors.border}`, paddingBottom: 6, marginBottom: 12, marginTop: 4 }}>{txt}</div>
  );
  const lbl = (txt: string) => (
    <div style={{ color: colors.textSub, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{txt}</div>
  );

  return (
    <div style={{ background: colors.bg, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 24, maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: colors.text, margin: 0, fontSize: 18, fontWeight: 800 }}>
          {existing ? 'แก้ไขด่าน' : 'สร้างด่านใหม่'}
        </h2>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>x</button>
      </div>

      {/* Basic Info */}
      {sectionTitle('ข้อมูลด่าน')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          {lbl('ชื่อด่าน *')}
          <input style={inp()} value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="เช่น ทดสอบ Sequence" />
        </div>
        <div>
          {lbl('แนวคิดที่สอน')}
          <input style={inp()} value={form.concept} onChange={(e) => setField('concept', e.target.value)} placeholder="เช่น Sequence, Loop, If/Else" />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        {lbl('คำอธิบาย')}
        <input style={inp()} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="อธิบายสั้น ๆ" />
      </div>
      <div style={{ marginBottom: 16 }}>
        {lbl('ระดับความยาก')}
        <div style={{ display: 'flex', gap: 6 }}>
          {([1, 2, 3, 4, 5] as const).map((d) => (
            <button key={d} onClick={() => setField('difficulty', d)} style={{
              padding: '4px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: form.difficulty === d ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : colors.bgSurface,
              color: form.difficulty === d ? '#fff' : colors.textSub,
            }}>{d}</button>
          ))}
          <span style={{ color: colors.textMuted, fontSize: 11, alignSelf: 'center', marginLeft: 4 }}>1=ง่าย 5=ยากมาก</span>
        </div>
      </div>

      {/* Enemy */}
      {sectionTitle('ศัตรู')}
      <div style={{ marginBottom: 12 }}>
        {lbl('ชื่อศัตรู *')}
        <input style={inp()} value={form.enemy.name} onChange={(e) => setEnemy('name', e.target.value)} placeholder="เช่น Slime King" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <div>{lbl('HP (50–1000)')}<input style={inp()} type="number" min={50} max={1000} value={form.enemy.hp} onChange={(e) => setEnemy('hp', +e.target.value)} /></div>
        <div>{lbl('ATK (5–80)')}<input style={inp()} type="number" min={5} max={80} value={form.enemy.atk} onChange={(e) => setEnemy('atk', +e.target.value)} /></div>
        <div>{lbl('DEF (0–30)')}<input style={inp()} type="number" min={0} max={30} value={form.enemy.def} onChange={(e) => setEnemy('def', +e.target.value)} /></div>
        <div>{lbl('Budget/Turn (1–3)')}<input style={inp()} type="number" min={1} max={3} value={form.enemy.budgetPerTurn} onChange={(e) => setEnemy('budgetPerTurn', +e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 12 }}>
        {lbl('Behaviors ศัตรู (เลือกได้หลายอย่าง)')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_BEHAVIORS.map((b) => {
            const on = form.enemy.behaviors.includes(b.value);
            return (
              <button key={b.value} onClick={() => toggleBehavior(b.value)} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: 'none', fontWeight: 600,
                background: on ? 'rgba(239,68,68,0.85)' : colors.bgSurface,
                color: on ? '#fff' : colors.textSub,
              }}>{b.label}</button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <input type="checkbox" id="shield" checked={form.enemy.shield ?? false} onChange={(e) => setEnemy('shield', e.target.checked)} />
        <label htmlFor="shield" style={{ color: colors.textSub, fontSize: 12, cursor: 'pointer' }}>
          มี Shield (นักเรียนต้องวาง Required Block ก่อนโจมตีได้)
        </label>
      </div>

      {/* Constraints */}
      {sectionTitle('เงื่อนไข Flowchart')}
      <div style={{ marginBottom: 12 }}>
        {lbl('อนุญาตเฉพาะ Blocks นี้ (ว่าง = ทุก block)')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {BLOCK_OPTIONS.map((b) => {
            const on = form.allowedBlocks.includes(b.value);
            return (
              <button key={b.value} onClick={() => toggleBlock('allowedBlocks', b.value)} style={{
                padding: '3px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: 'none',
                background: on ? 'rgba(59,130,246,0.85)' : colors.bgSurface,
                color: on ? '#fff' : colors.textSub,
              }}>{b.label}</button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16, alignItems: 'start' }}>
        <div>
          {lbl('Required Blocks (ต้องใช้เพื่อทะลุ Shield)')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {BLOCK_OPTIONS.map((b) => {
              const on = form.requiredBlocks.includes(b.value);
              return (
                <button key={b.value} onClick={() => toggleBlock('requiredBlocks', b.value)} style={{
                  padding: '3px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: 'none',
                  background: on ? 'rgba(124,58,237,0.85)' : colors.bgSurface,
                  color: on ? '#fff' : colors.textSub,
                }}>{b.label}</button>
              );
            })}
          </div>
        </div>
        <div style={{ minWidth: 130 }}>
          {lbl('จำกัด Nodes (ว่าง = ไม่จำกัด)')}
          <input style={inp({ width: 120 })} type="number" min={1} max={20} value={form.nodeLimit}
            placeholder="ไม่จำกัด"
            onChange={(e) => setField('nodeLimit', e.target.value === '' ? '' : Number(e.target.value) as unknown as '')} />
        </div>
      </div>

      {/* Objectives */}
      {sectionTitle('วัตถุประสงค์')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          {lbl('Objectives (แต่ละบรรทัด = 1 ข้อ)')}
          <textarea style={{ ...inp(), height: 72, resize: 'vertical' } as React.CSSProperties}
            value={form.objectives} onChange={(e) => setField('objectives', e.target.value)} />
        </div>
        <div>
          {lbl('Bonus Objective (ไม่บังคับ)')}
          <input style={inp()} value={form.bonusObjective} onChange={(e) => setField('bonusObjective', e.target.value)} placeholder="เช่น ชนะโดยใช้น้อยกว่า 5 nodes" />
        </div>
      </div>

      {/* Publish */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '10px 14px', background: colors.bgSurface, borderRadius: 10, border: `1px solid ${colors.border}` }}>
        <input type="checkbox" id="published" checked={form.published} onChange={(e) => setField('published', e.target.checked)} />
        <label htmlFor="published" style={{ color: colors.text, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
          เผยแพร่ให้นักเรียนในห้องเรียนเห็นและเล่นได้
        </label>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 12px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bgSurface, color: colors.textSub, cursor: 'pointer', fontSize: 13 }}>ยกเลิก</button>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '8px 24px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13,
          cursor: saving ? 'not-allowed' : 'pointer',
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', opacity: saving ? 0.6 : 1,
        }}>{saving ? 'กำลังบันทึก...' : (existing ? 'บันทึกการแก้ไข' : 'สร้างด่าน')}</button>
      </div>
    </div>
  );
}
