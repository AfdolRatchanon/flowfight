import { useState } from 'react';
import { useInfinityDevStore } from '../../stores/infinityDevStore';
import { HARDWARE_ITEMS, PLUGIN_ITEMS, CORRUPTED_FILES, VIRUSES } from '../../utils/infinityDevConstants';
import type { HardwareId, PluginId, CorruptedFileId, VirusId } from '../../utils/infinityDevConstants';

interface Props {
  onClose: () => void;
}

type Tab = 'hardware' | 'plugins' | 'corrupted' | 'viruses';

export default function TheTerminal({ onClose }: Props) {
  const store = useInfinityDevStore();
  const [tab, setTab] = useState<Tab>('hardware');
  const [confirmItem, setConfirmItem] = useState<string | null>(null);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'hardware', label: 'Hardware', icon: '💻' },
    { id: 'plugins', label: 'Plugins', icon: '🔌' },
    { id: 'corrupted', label: 'Corrupted Files', icon: '☠️' },
    { id: 'viruses', label: 'Malicious Viruses', icon: '🦠' },
  ];

  function buyHardware(id: HardwareId, cost: number) {
    if (!store.spendDataFragments(cost)) return;
    store.addHardware(id);
  }

  function buyPlugin(id: PluginId, cost: number) {
    if (!store.spendDataFragments(cost)) return;
    store.addPlugin(id);
  }

  function buyCorrupted(id: CorruptedFileId) {
    setConfirmItem(id);
  }

  function confirmCorrupted(id: CorruptedFileId) {
    store.addCorruptedFile(id);
    setConfirmItem(null);
  }

  function acceptVirus(id: VirusId) {
    store.acceptVirus(id);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9000,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 24, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
        width: '100%', maxWidth: 900,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#00ff88', fontSize: 10, fontWeight: 800, letterSpacing: 3 }}>THE TERMINAL</div>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>ร้านค้าลับ — Wave {store.wave}</div>
        </div>
        <div style={{
          background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)',
          borderRadius: 10, padding: '8px 16px', textAlign: 'center',
        }}>
          <div style={{ color: '#fbbf24', fontSize: 18, fontWeight: 900 }}>💾 {store.dataFragments}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>Data Fragments</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18,
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, width: '100%', maxWidth: 900 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 8px',
              background: tab === t.id ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${tab === t.id ? '#00ff88' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, cursor: 'pointer',
              color: tab === t.id ? '#00ff88' : 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 700,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 900 }}>

        {/* Hardware */}
        {tab === 'hardware' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(400px,1fr))', gap: 16 }}>
            {HARDWARE_ITEMS.map((item) => {
              const owned = store.hardware.includes(item.id);
              const canAfford = store.dataFragments >= item.cost;
              return (
                <div key={item.id} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${owned ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 14, padding: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 32 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{item.name}</div>
                      <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>💾 {item.cost}</div>
                    </div>
                    {owned && <span style={{ color: '#00ff88', fontSize: 12, fontWeight: 800 }}>✓ มีแล้ว</span>}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#4ade80', fontSize: 12, marginBottom: 4 }}>✓ {item.pro}</div>
                    <div style={{ color: '#f87171', fontSize: 12 }}>✗ {item.con}</div>
                  </div>
                  {!owned && (
                    <button
                      onClick={() => buyHardware(item.id, item.cost)}
                      disabled={!canAfford}
                      style={{
                        width: '100%', padding: '8px', borderRadius: 8, border: 'none',
                        background: canAfford ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                        color: canAfford ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                        fontWeight: 800, cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: 13,
                      }}
                    >
                      {canAfford ? 'ซื้อ' : 'DF ไม่พอ'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Plugins */}
        {tab === 'plugins' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {PLUGIN_ITEMS.map((item) => {
              const owned = store.plugins.includes(item.id);
              const canAfford = store.dataFragments >= item.cost;
              return (
                <div key={item.id} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${owned ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 14, padding: 18,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 800 }}>{item.name}</div>
                      <div style={{ color: '#fbbf24', fontSize: 11 }}>💾 {item.cost}</div>
                    </div>
                    {owned && <span style={{ color: '#00ff88', fontSize: 11 }}>✓</span>}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 12 }}>
                    {item.description}
                  </div>
                  {!owned && (
                    <button
                      onClick={() => buyPlugin(item.id, item.cost)}
                      disabled={!canAfford}
                      style={{
                        width: '100%', padding: '7px', borderRadius: 8, border: 'none',
                        background: canAfford ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
                        color: canAfford ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                        fontWeight: 700, cursor: canAfford ? 'pointer' : 'not-allowed', fontSize: 12,
                      }}
                    >
                      {canAfford ? 'ซื้อ' : 'DF ไม่พอ'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Corrupted Files */}
        {tab === 'corrupted' && (
          <div>
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#fca5a5', fontSize: 12,
            }}>
              ⚠️ Corrupted Files มีราคาเป็น Max HP ถาวร — ตัดสินใจให้ดี
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 16 }}>
              {CORRUPTED_FILES.map((item) => {
                const owned = store.corruptedFiles.includes(item.id);
                const hpCost = Math.floor(store.heroMaxHp * (item.maxHpCost / 100));
                return (
                  <div key={item.id} style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: `1px solid ${owned ? 'rgba(0,255,136,0.4)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 14, padding: 20,
                  }}>
                    {confirmItem === item.id ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#f87171', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
                          ยืนยันการซื้อ?
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 16 }}>
                          Max HP จะลดลง {item.maxHpCost}% ({hpCost} HP) ถาวร
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            onClick={() => setConfirmItem(null)}
                            style={{
                              flex: 1, padding: 10, borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.2)', background: 'transparent',
                              color: '#fff', cursor: 'pointer', fontWeight: 700,
                            }}
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={() => confirmCorrupted(item.id)}
                            style={{
                              flex: 1, padding: 10, borderRadius: 8, border: 'none',
                              background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 800,
                            }}
                          >
                            ยืนยัน
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: 32 }}>{item.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#fff', fontWeight: 800 }}>{item.name}</div>
                            <div style={{ color: '#f87171', fontSize: 11, fontWeight: 700 }}>
                              Max HP -{item.maxHpCost}% ({hpCost} HP)
                            </div>
                          </div>
                          {owned && <span style={{ color: '#00ff88', fontSize: 12 }}>✓</span>}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 14 }}>
                          {item.description}
                        </div>
                        {!owned && (
                          <button
                            onClick={() => buyCorrupted(item.id)}
                            style={{
                              width: '100%', padding: 8, borderRadius: 8, border: 'none',
                              background: 'rgba(239,68,68,0.2)', color: '#f87171',
                              fontWeight: 800, cursor: 'pointer', fontSize: 13,
                            }}
                          >
                            ซื้อด้วย Max HP
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Malicious Viruses */}
        {tab === 'viruses' && (
          <div>
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#fca5a5', fontSize: 12,
            }}>
              🦠 รับรางวัลทันที แลกกับผลเสียถาวร — เลือกอย่างระมัดระวัง
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 16 }}>
              {VIRUSES.map((virus) => {
                const infected = store.viruses.includes(virus.id);
                return (
                  <div key={virus.id} style={{
                    background: 'rgba(239,68,68,0.05)',
                    border: `1px solid ${infected ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 14, padding: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <span style={{ fontSize: 32 }}>{virus.icon}</span>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{virus.name}</div>
                        {infected && (
                          <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 800 }}>
                            ⚠️ ติดเชื้อแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div style={{
                        background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
                        borderRadius: 8, padding: '8px 10px',
                      }}>
                        <div style={{ color: '#4ade80', fontSize: 9, fontWeight: 800, marginBottom: 4 }}>รางวัลทันที</div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{virus.reward}</div>
                      </div>
                      <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 8, padding: '8px 10px',
                      }}>
                        <div style={{ color: '#f87171', fontSize: 9, fontWeight: 800, marginBottom: 4 }}>ผลเสียถาวร</div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{virus.penalty}</div>
                      </div>
                    </div>
                    {!infected && (
                      <button
                        onClick={() => acceptVirus(virus.id)}
                        style={{
                          width: '100%', padding: 8, borderRadius: 8,
                          border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.15)',
                          color: '#f87171', fontWeight: 800, cursor: 'pointer', fontSize: 13,
                        }}
                      >
                        รับไวรัส
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
