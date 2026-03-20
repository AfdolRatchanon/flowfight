import { useState, useEffect } from 'react';
import { logout } from '../../services/authService';
import {
  createClassroom, getTeacherClassrooms, getClassroomStudents,
  createAssignment, getClassroomAssignments, deleteAssignment,
} from '../../services/teacherService';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import type { Assignment, Classroom, StudentProgress } from '../../types/game.types';
import { LEVELS } from '../../utils/constants';
import VolumeButton from '../UI/VolumeButton';

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
  const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('students');
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
  }, [selectedRoom]);

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
    setCreatingAss(true);
    try {
      await createAssignment(selectedRoom, player.id, newAssTitle.trim(), newAssLevels, new Date(newAssDeadline).getTime());
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
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {(['students', 'assignments'] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: '6px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: activeTab === tab ? '1px solid rgba(251,191,36,0.5)' : `1px solid ${colors.borderSubtle}`,
                    background: activeTab === tab ? 'rgba(251,191,36,0.1)' : 'transparent',
                    color: activeTab === tab ? '#FBBF24' : colors.textMuted,
                  }}>
                    {tab === 'students' ? `นักเรียน (${students.length})` : `งานที่มอบหมาย (${assignments.length})`}
                  </button>
                ))}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px', gap: 12, padding: '6px 16px' }}>
                      {['นักเรียน', 'ด่านที่ผ่าน', 'Progress', 'เล่นล่าสุด'].map((h) => (
                        <span key={h} style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700 }}>{h}</span>
                      ))}
                    </div>
                    {students.map((s) => {
                      const pct = Math.round((s.levelsCompleted.length / totalLevels) * 100);
                      const lastActive = s.lastActive
                        ? new Date(s.lastActive).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                        : '—';
                      return (
                        <div key={s.uid} style={{
                          ...cardStyle, display: 'grid',
                          gridTemplateColumns: '1fr 100px 120px 100px', gap: 12, alignItems: 'center',
                        }}>
                          <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{s.username}</span>
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
    </div>
  );
}
