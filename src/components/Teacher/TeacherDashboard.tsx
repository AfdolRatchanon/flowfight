import { useState, useEffect } from 'react';
import { logout } from '../../services/authService';
import {
  createClassroom, getTeacherClassrooms, getClassroomStudents,
  createAssignment, getClassroomAssignments, deleteAssignment,
} from '../../services/teacherService';
import { getClassroomCustomLevels, deleteCustomLevel, publishCustomLevel } from '../../services/customLevelService';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import type { Assignment, Classroom, CustomLevel, StudentProgress } from '../../types/game.types';
import { LEVELS } from '../../utils/constants';
import VolumeButton from '../UI/VolumeButton';
import CustomLevelEditor from './CustomLevelEditor';

function exportClassroomCSV(className: string, students: StudentProgress[]) {
  const levelHeaders = LEVELS.map((l) => `D${l.number} Score`).join(',');
  const header = `ชื่อ-นามสกุล,Username,Email,Role,ด่านที่ผ่าน,Avg Score,${levelHeaders},เล่นล่าสุด\n`;
  const rows = students.map((s) => {
    const displayName = s.firstName && s.surname ? `${s.firstName} ${s.surname}` : s.username;
    const scores = Object.values(s.levelScores ?? {});
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : '';
    const levelScores = LEVELS.map((l) => s.levelScores?.[l.id] ?? '').join(',');
    const lastActive = s.lastActive ? new Date(s.lastActive).toLocaleDateString('th-TH') : '';
    return `"${displayName}","${s.username}","${s.email ?? ''}","${s.role ?? 'student'}",${s.levelsCompleted.length},${avg},${levelScores},"${lastActive}"`;
  }).join('\n');
  const bom = '\uFEFF'; // UTF-8 BOM สำหรับ Excel
  const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${className}_report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TeacherDashboard() {
  const { colors } = useTheme();
  const { player } = useGameStore();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'analytics' | 'custom'>('students');
  const [customLevels, setCustomLevels] = useState<CustomLevel[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CustomLevel | undefined>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newAssTitle, setNewAssTitle] = useState('');
  const [newAssLevels, setNewAssLevels] = useState<string[]>([]);
  const [newAssDeadline, setNewAssDeadline] = useState('');
  const [creatingAss, setCreatingAss] = useState(false);

  useEffect(() => {
    if (!player?.id) return;
    getTeacherClassrooms(player.id).then((rooms) => {
      setClassrooms(rooms);
      if (rooms.length > 0) setSelectedRoom(rooms[0].roomCode);
      setLoading(false);
    });
  }, [player?.id]);

  useEffect(() => {
    if (!selectedRoom) return;
    setStudents([]);
    getClassroomStudents(selectedRoom).then(setStudents);
    getClassroomAssignments(selectedRoom).then(setAssignments);
    getClassroomCustomLevels(selectedRoom).then(setCustomLevels);
  }, [selectedRoom]);

  function refreshCustomLevels() {
    if (selectedRoom) getClassroomCustomLevels(selectedRoom).then(setCustomLevels);
  }

  async function handleCreateClassroom() {
    if (!newClassName.trim() || !player) return;
    setCreating(true);
    try {
      const code = await createClassroom(player.id, player.username, newClassName.trim());
      const updated = await getTeacherClassrooms(player.id);
      setClassrooms(updated);
      setSelectedRoom(code);
      setNewClassName('');
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateAssignment() {
    if (!newAssTitle.trim() || newAssLevels.length === 0 || !newAssDeadline || !player || !selectedRoom) return;
    const deadlineMs = new Date(newAssDeadline).getTime();
    if (deadlineMs <= Date.now()) {
      alert('กรุณากำหนดวันส่งงานในอนาคต');
      return;
    }
    setCreatingAss(true);
    try {
      await createAssignment(selectedRoom, player.id, newAssTitle.trim(), newAssLevels, deadlineMs);
      setAssignments(await getClassroomAssignments(selectedRoom));
      setNewAssTitle(''); setNewAssLevels([]); setNewAssDeadline('');
    } finally { setCreatingAss(false); }
  }

  async function handleDeleteAssignment(id: string) {
    await deleteAssignment(id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  function toggleLevel(id: string) {
    setNewAssLevels((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selected = classrooms.find((c) => c.roomCode === selectedRoom);
  const totalLevels = LEVELS.length;

  const cardStyle: React.CSSProperties = {
    background: colors.bgSurface, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: '14px 16px',
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bgGrad, padding: 24, position: 'relative' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Cinzel', serif", color: '#FBBF24', fontSize: 24, margin: 0 }}>
            Teacher Dashboard
          </h1>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: '4px 0 0' }}>
            {player?.username}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <VolumeButton variant="header" />
          <button onClick={() => logout()} style={{
            padding: '8px 16px', borderRadius: 10,
            border: `1px solid ${colors.borderSubtle}`, background: 'transparent',
            color: colors.textMuted, fontSize: 13, cursor: 'pointer',
          }}>ออกจากระบบ</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Sidebar — classroom list */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ color: colors.textSub, fontWeight: 700, fontSize: 13, margin: 0 }}>ห้องเรียนของฉัน</p>

          {loading ? (
            <p style={{ color: colors.textMuted, fontSize: 13 }}>กำลังโหลด...</p>
          ) : classrooms.map((room) => (
            <button key={room.roomCode} onClick={() => setSelectedRoom(room.roomCode)} style={{
              ...cardStyle, cursor: 'pointer', textAlign: 'left',
              borderColor: selectedRoom === room.roomCode ? 'rgba(251,191,36,0.5)' : colors.borderSubtle,
              background: selectedRoom === room.roomCode ? 'rgba(251,191,36,0.08)' : colors.bgSurface,
            }}>
              <p style={{ color: colors.text, fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>{room.className}</p>
              <p style={{ color: '#FBBF24', fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: 2 }}>
                {room.roomCode}
              </p>
              <p style={{ color: colors.textMuted, fontSize: 11, margin: '2px 0 0' }}>
                {room.students.length} นักเรียน
              </p>
            </button>
          ))}

          {/* Create new classroom */}
          <div style={{ ...cardStyle, marginTop: 8 }}>
            <p style={{ color: colors.textSub, fontSize: 12, fontWeight: 700, margin: '0 0 8px' }}>+ สร้างห้องใหม่</p>
            <input
              placeholder="ชื่อห้องเรียน"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateClassroom(); }}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                background: 'rgba(0,0,0,0.3)', border: `1px solid ${colors.borderSubtle}`,
                color: colors.text, fontSize: 13, marginBottom: 8,
              }}
            />
            <button onClick={handleCreateClassroom} disabled={creating || !newClassName.trim()} style={{
              width: '100%', padding: '8px', borderRadius: 8,
              border: '1px solid rgba(251,191,36,0.35)',
              background: 'rgba(251,191,36,0.1)', color: '#FBBF24',
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>
              {creating ? 'กำลังสร้าง...' : 'สร้างห้องเรียน'}
            </button>
          </div>
        </div>

        {/* Main — student list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              {/* Room info */}
              <div style={{ ...cardStyle, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ color: colors.text, fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
                    {selected.className}
                  </h2>
                  <p style={{ color: colors.textMuted, fontSize: 12, margin: 0 }}>
                    {selected.students.length} นักเรียน · {totalLevels} ด่าน
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted, fontSize: 11, margin: '0 0 4px' }}>รหัสเข้าห้อง</p>
                  <button onClick={() => copyCode(selected.roomCode)} style={{
                    background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)',
                    borderRadius: 10, padding: '8px 20px', cursor: 'pointer',
                    color: '#FBBF24', fontWeight: 900, fontSize: 22, letterSpacing: 4,
                  }}>
                    {selected.roomCode}
                  </button>
                  <p style={{ color: colors.textMuted, fontSize: 10, margin: '4px 0 0' }}>
                    {copied ? 'คัดลอกแล้ว!' : 'คลิกเพื่อคัดลอก'}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12, alignItems: 'center' }}>
                {([
                  { key: 'students', label: `นักเรียน (${students.length})` },
                  { key: 'assignments', label: `งาน (${assignments.length})` },
                  { key: 'analytics', label: 'Analytics' },
                  { key: 'custom', label: `ด่านของฉัน (${customLevels.length})` },
                ] as const).map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveTab(key)} style={{
                    padding: '6px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: activeTab === key ? '1px solid rgba(251,191,36,0.5)' : `1px solid ${colors.borderSubtle}`,
                    background: activeTab === key ? 'rgba(251,191,36,0.1)' : 'transparent',
                    color: activeTab === key ? '#FBBF24' : colors.textMuted,
                  }}>{label}</button>
                ))}
                <div style={{ flex: 1 }} />
                {students.length > 0 && (
                  <button
                    onClick={() => exportClassroomCSV(selected.className, students)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: '1px solid rgba(74,222,128,0.4)', background: 'rgba(74,222,128,0.08)',
                      color: '#4ade80',
                    }}
                  >Export CSV</button>
                )}
              </div>

              {activeTab === 'students' ? (
                students.length === 0 ? (
                  <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
                    <p style={{ color: colors.textMuted, fontSize: 14 }}>
                      ยังไม่มีนักเรียนในห้อง แชร์รหัส <strong style={{ color: '#FBBF24' }}>{selected.roomCode}</strong> ให้นักเรียน
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 120px 80px', gap: 12, padding: '6px 16px' }}>
                      {['ชื่อ-นามสกุล', 'อีเมล / UID', 'ด่านที่ผ่าน', 'Progress', 'เล่นล่าสุด'].map((h) => (
                        <span key={h} style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700 }}>{h}</span>
                      ))}
                    </div>
                    {students.map((s) => {
                      const pct = Math.round((s.levelsCompleted.length / totalLevels) * 100);
                      const displayName = s.firstName && s.surname ? `${s.firstName} ${s.surname}` : s.username;
                      const scores = Object.values(s.levelScores ?? {});
                      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                      const lastActive = s.lastActive
                        ? new Date(s.lastActive).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                        : '—';
                      return (
                        <div key={s.uid} style={{
                          ...cardStyle, display: 'grid',
                          gridTemplateColumns: '1fr 140px 100px 120px 80px', gap: 12, alignItems: 'center',
                        }}>
                          <div>
                            <span style={{ color: colors.text, fontWeight: 600, fontSize: 13 }}>{displayName}</span>
                            {avgScore !== null && (
                              <span style={{
                                marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 4,
                                background: avgScore >= 70 ? 'rgba(74,222,128,0.15)' : avgScore >= 50 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                                color: avgScore >= 70 ? '#4ade80' : avgScore >= 50 ? '#fbbf24' : '#f87171',
                                fontWeight: 700,
                              }}>avg {avgScore}</span>
                            )}
                          </div>
                          <span style={{ color: colors.textMuted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.email || s.uid.slice(0, 10) + '…'}
                          </span>
                          <span style={{ color: '#FBBF24', fontWeight: 700, fontSize: 14 }}>
                            {s.levelsCompleted.length}/{totalLevels}
                          </span>
                          <div>
                            <div style={{ height: 6, background: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 3, width: pct + '%',
                                background: pct >= 80 ? '#16A34A' : pct >= 40 ? '#FBBF24' : '#DC2626',
                                transition: 'width 0.4s ease',
                              }} />
                            </div>
                            <span style={{ color: colors.textMuted, fontSize: 10 }}>{pct}%</span>
                          </div>
                          <span style={{ color: colors.textMuted, fontSize: 12 }}>{lastActive}</span>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : activeTab === 'analytics' ? (
                (() => {
                  // คำนวณ avg score ต่อด่าน จากนักเรียนทุกคนในห้อง
                  const levelAvgs = LEVELS.map((lv) => {
                    const scores = students.map((s) => s.levelScores?.[lv.id]).filter((v): v is number => v !== undefined);
                    return {
                      id: lv.id, number: lv.number, name: lv.name, concept: lv.concept,
                      avg: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
                      completedCount: students.filter((s) => s.levelsCompleted.includes(lv.id)).length,
                    };
                  });
                  const needHelp = students.filter((s) => {
                    const scores = Object.values(s.levelScores ?? {});
                    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                    return avg !== null && avg < 60;
                  });
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Summary */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[
                          { label: 'นักเรียนทั้งหมด', value: students.length },
                          { label: 'ต้องช่วยเหลือ (avg < 60)', value: needHelp.length },
                          { label: 'ผ่านทุกด่าน', value: students.filter((s) => s.levelsCompleted.length >= totalLevels).length },
                        ].map((s) => (
                          <div key={s.label} style={{ ...cardStyle, flex: 1, minWidth: 110 }}>
                            <p style={{ color: '#FBBF24', fontSize: 22, fontWeight: 800, margin: 0 }}>{s.value}</p>
                            <p style={{ color: colors.textMuted, fontSize: 11, margin: '2px 0 0' }}>{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Per-level score bar */}
                      <div style={{ ...cardStyle }}>
                        <p style={{ color: colors.textSub, fontWeight: 700, fontSize: 13, margin: '0 0 10px' }}>คะแนนเฉลี่ยต่อด่าน</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {levelAvgs.map((lv) => (
                            <div key={lv.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: colors.textMuted, fontSize: 10, width: 28, flexShrink: 0 }}>D{lv.number}</span>
                              <div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                                {lv.avg !== null && (
                                  <div style={{
                                    height: '100%', borderRadius: 3, width: lv.avg + '%',
                                    background: lv.avg >= 70 ? '#16A34A' : lv.avg >= 50 ? '#FBBF24' : '#DC2626',
                                    transition: 'width 0.4s ease',
                                  }} />
                                )}
                              </div>
                              <span style={{ color: colors.textMuted, fontSize: 10, width: 36, textAlign: 'right', flexShrink: 0 }}>
                                {lv.avg !== null ? `${lv.avg}` : '—'}
                              </span>
                              <span style={{ color: colors.textMuted, fontSize: 10, width: 50, flexShrink: 0 }}>
                                {lv.completedCount}/{students.length}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* นักเรียนที่ต้องช่วย */}
                      {needHelp.length > 0 && (
                        <div style={{ ...cardStyle, borderColor: 'rgba(248,113,113,0.3)' }}>
                          <p style={{ color: '#f87171', fontWeight: 700, fontSize: 13, margin: '0 0 10px' }}>นักเรียนที่ต้องช่วยเหลือ</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {needHelp.map((s) => {
                              const scores = Object.values(s.levelScores ?? {});
                              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                              const displayName = s.firstName && s.surname ? `${s.firstName} ${s.surname}` : s.username;
                              return (
                                <div key={s.uid} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ color: colors.text, fontSize: 13, flex: 1 }}>{displayName}</span>
                                  <span style={{ color: colors.textMuted, fontSize: 11 }}>{s.levelsCompleted.length}/{totalLevels} ด่าน</span>
                                  <span style={{ color: '#f87171', fontWeight: 700, fontSize: 12 }}>avg {avg}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : activeTab === 'custom' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: colors.textSub, fontSize: 13, margin: 0 }}>
                      ด่านที่สร้างสำหรับห้องนี้ — นักเรียนเล่นได้ผ่านแท็บ "ด่านของครู" ใน LevelSelect
                    </p>
                    <button onClick={() => { setEditingLevel(undefined); setShowEditor(true); }} style={{
                      padding: '6px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', fontWeight: 700, fontSize: 13,
                    }}>+ สร้างด่านใหม่</button>
                  </div>
                  {customLevels.length === 0 ? (
                    <div style={{ ...cardStyle, textAlign: 'center', padding: 32 }}>
                      <p style={{ color: colors.textMuted, fontSize: 13 }}>ยังไม่มีด่าน — กด "สร้างด่านใหม่" เพื่อเริ่ม</p>
                    </div>
                  ) : (
                    customLevels.map((lv) => (
                      <div key={lv.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ color: colors.text, fontWeight: 700, fontSize: 14 }}>{lv.name}</span>
                            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 5, fontWeight: 700,
                              background: lv.published ? 'rgba(74,222,128,0.2)' : 'rgba(100,116,139,0.2)',
                              color: lv.published ? '#4ade80' : colors.textMuted }}>
                              {lv.published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                            </span>
                            <span style={{ color: colors.textMuted, fontSize: 11 }}>ยาก Lv.{lv.difficulty}</span>
                          </div>
                          <p style={{ color: colors.textMuted, fontSize: 12, margin: 0 }}>
                            {lv.concept} — HP {lv.enemy.hp} / ATK {lv.enemy.atk} / {lv.enemy.behaviors.join(', ')}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => publishCustomLevel(lv.id, !lv.published).then(refreshCustomLevels)} style={{
                            padding: '4px 10px', borderRadius: 8, border: `1px solid ${colors.border}`,
                            background: colors.bgSurface, color: colors.textSub, cursor: 'pointer', fontSize: 12,
                          }}>{lv.published ? 'ซ่อน' : 'เผยแพร่'}</button>
                          <button onClick={() => { setEditingLevel(lv); setShowEditor(true); }} style={{
                            padding: '4px 10px', borderRadius: 8, border: 'none',
                            background: 'rgba(59,130,246,0.2)', color: '#60a5fa', cursor: 'pointer', fontSize: 12,
                          }}>แก้ไข</button>
                          <button onClick={() => { if (confirm('ลบด่านนี้?')) deleteCustomLevel(lv.id).then(refreshCustomLevels); }} style={{
                            padding: '4px 10px', borderRadius: 8, border: 'none',
                            background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontSize: 12,
                          }}>ลบ</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Create assignment form */}
                  <div style={{ ...cardStyle }}>
                    <p style={{ color: colors.textSub, fontWeight: 700, fontSize: 13, margin: '0 0 10px' }}>+ มอบหมายงานใหม่</p>
                    <input
                      placeholder="ชื่องาน เช่น ด่าน 1-5 ภายใน 7 วัน"
                      value={newAssTitle}
                      onChange={(e) => setNewAssTitle(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 10,
                        background: 'rgba(0,0,0,0.3)', border: `1px solid ${colors.borderSubtle}`,
                        color: colors.text, fontSize: 13,
                      }}
                    />
                    <p style={{ color: colors.textMuted, fontSize: 11, margin: '0 0 6px' }}>
                      เลือกด่าน ({newAssLevels.length} ด่าน)
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {LEVELS.map((l) => (
                        <button key={l.id} onClick={() => toggleLevel(l.id)} style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                          border: newAssLevels.includes(l.id) ? '1px solid rgba(251,191,36,0.6)' : `1px solid ${colors.borderSubtle}`,
                          background: newAssLevels.includes(l.id) ? 'rgba(251,191,36,0.15)' : 'transparent',
                          color: newAssLevels.includes(l.id) ? '#FBBF24' : colors.textMuted,
                          fontWeight: newAssLevels.includes(l.id) ? 700 : 400,
                        }}>D{l.number}</button>
                      ))}
                    </div>
                    <p style={{ color: colors.textMuted, fontSize: 11, margin: '0 0 4px' }}>วันกำหนดส่ง</p>
                    <input
                      type="datetime-local"
                      value={newAssDeadline}
                      onChange={(e) => setNewAssDeadline(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 10,
                        background: 'rgba(0,0,0,0.3)', border: `1px solid ${colors.borderSubtle}`,
                        color: colors.text, fontSize: 13, colorScheme: 'dark',
                      }}
                    />
                    <button
                      onClick={handleCreateAssignment}
                      disabled={creatingAss || !newAssTitle.trim() || newAssLevels.length === 0 || !newAssDeadline}
                      style={{
                        width: '100%', padding: '8px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.1)', color: '#FBBF24',
                        opacity: (!newAssTitle.trim() || newAssLevels.length === 0 || !newAssDeadline) ? 0.4 : 1,
                      }}
                    >{creatingAss ? 'กำลังสร้าง...' : 'มอบหมายงาน'}</button>
                  </div>

                  {/* Assignment list */}
                  {assignments.length === 0 ? (
                    <p style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>ยังไม่มีงานที่มอบหมาย</p>
                  ) : assignments.map((a) => {
                    const now = Date.now();
                    const overdue = a.deadline < now;
                    const deadlineStr = new Date(a.deadline).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={a.id} style={{ ...cardStyle }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: colors.text, fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{a.title}</p>
                            <p style={{ color: colors.textMuted, fontSize: 11, margin: '0 0 4px' }}>
                              ด่าน: {a.levelIds.map((id) => LEVELS.find((l) => l.id === id)?.number).filter(Boolean).join(', ')}
                            </p>
                            <p style={{ color: overdue ? '#f87171' : '#4ade80', fontSize: 11, margin: 0 }}>
                              {overdue ? 'หมดเวลา' : 'ส่งภายใน'}: {deadlineStr}
                            </p>
                          </div>
                          <button onClick={() => handleDeleteAssignment(a.id)} style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                            border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)',
                            color: '#f87171', flexShrink: 0,
                          }}>ลบ</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', padding: 60 }}>
              <p style={{ color: colors.textMuted, fontSize: 14 }}>สร้างหรือเลือกห้องเรียนด้านซ้าย</p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Level Editor Modal */}
      {showEditor && selectedRoom && player && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <CustomLevelEditor
            classroomCode={selectedRoom}
            teacherUid={player.id}
            existing={editingLevel}
            onSaved={() => { setShowEditor(false); setEditingLevel(undefined); refreshCustomLevels(); setActiveTab('custom'); }}
            onCancel={() => { setShowEditor(false); setEditingLevel(undefined); }}
          />
        </div>
      )}
    </div>
  );
}
