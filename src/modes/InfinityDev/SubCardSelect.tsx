import { useInfinityDevStore } from '../../stores/infinityDevStore';
import { SUP_CARDS, PATH_CARDS } from '../../utils/infinityDevConstants';
import type { SupCardId } from '../../utils/infinityDevConstants';

interface Props {
  onDone: () => void;
}

export default function SubCardSelect({ onDone }: Props) {
  const { pendingSupCardChoices, selectedPath, addSupCard, pathSynergyCount } = useInfinityDevStore();
  const pathCard = PATH_CARDS.find((p) => p.id === selectedPath);

  function pick(id: SupCardId) {
    addSupCard(id);
    onDone();
  }

  const choices = pendingSupCardChoices
    .map((id) => SUP_CARDS.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>
          WAVE MILESTONE — เลือก SUP-CARD
        </div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>เลือก 1 การ์ดเสริม</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
          {pathCard && `Synergy กับ ${pathCard.name}: ${pathSynergyCount} ใบ`}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900 }}>
        {choices.map((card) => {
          const isSynergy = card.pathAffinity === selectedPath;
          const pathColor = pathCard?.color ?? '#8b5cf6';
          return (
            <div
              key={card.id}
              onClick={() => pick(card.id)}
              style={{
                flex: '1 1 260px', maxWidth: 280,
                background: isSynergy ? `${pathColor}18` : 'rgba(255,255,255,0.06)',
                border: `2px solid ${isSynergy ? pathColor : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 16, padding: 22, cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSynergy ? `0 0 20px ${pathColor}33` : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
              }}
            >
              {isSynergy && (
                <div style={{
                  background: pathColor, color: '#000', fontSize: 9, fontWeight: 900,
                  borderRadius: 4, padding: '2px 8px', marginBottom: 10, display: 'inline-block',
                }}>
                  ★ SYNERGY
                </div>
              )}
              <div style={{ fontSize: 40, marginBottom: 10 }}>{card.icon}</div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{card.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 10 }}>{card.group}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.5 }}>
                {card.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
