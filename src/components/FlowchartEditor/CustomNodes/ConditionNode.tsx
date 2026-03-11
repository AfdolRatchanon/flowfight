import { Handle, Position } from 'reactflow';
import type { ConditionType } from '../../../types/game.types';
import { useFlowchartStore } from '../../../stores/flowchartStore';

interface ConditionData {
  label: string;
  conditionType?: ConditionType;
  threshold?: number;
  isActive?: boolean;
}

const THRESHOLD_TYPES = new Set([
  'hp_less', 'hp_greater', 'mana_less', 'mana_greater', 'gold_less', 'gold_greater',
]);

export default function ConditionNode({
  id,
  data,
}: {
  id: string;
  data: ConditionData;
}) {
  const { nodes, setNodes } = useFlowchartStore();
  const active = data.isActive;
  const W = 180, H = 80;

  const condType = data.conditionType ?? 'enemy_alive';
  const threshold = data.threshold ?? 50;
  const hasThreshold = THRESHOLD_TYPES.has(condType);

  function adjustThreshold(delta: number) {
    const updated = nodes.map(n => {
      if (n.id !== id) return n;
      const next = { ...n.data, threshold: Math.max(0, Math.min(999, threshold + delta)) };
      // Rebuild label
      const isGreater = condType.endsWith('_greater');
      const subj = condType.startsWith('mana') ? 'MP' : condType.startsWith('gold') ? 'Gold' : 'HP';
      next.label = `${subj} ${isGreater ? '>' : '<'} ${next.threshold}?`;
      return { ...n, data: next };
    });
    setNodes(updated as any);
  }

  const stopProp = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); };

  return (
    <div style={{ position: 'relative', width: W, height: H, userSelect: 'none' }}>
      {/* Diamond SVG */}
      <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <polygon
          points={`${W / 2},2 ${W - 2},${H / 2} ${W / 2},${H - 2} 2,${H / 2}`}
          fill={active ? '#fbbf24' : '#d97706'}
          stroke={active ? '#fff' : '#92400e'}
          strokeWidth={2}
          style={{
            filter: active
              ? 'drop-shadow(0 0 12px rgba(251,191,36,0.8))'
              : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
          }}
        />
      </svg>

      {/* Content */}
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 28px', gap: 4,
        }}
      >
        <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', fontWeight: 700, letterSpacing: 1 }}>
          DECISION
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#1c1917', textAlign: 'center', lineHeight: 1.2 }}>
          {data.label}
        </div>

        {/* Threshold ±10 — only for HP/MP/Gold conditions */}
        {hasThreshold && (
          <div style={{ display: 'flex', gap: 3 }} onMouseDown={stopProp} onClick={stopProp}>
            <button
              onClick={() => adjustThreshold(-10)}
              style={{
                fontSize: 9, fontWeight: 700, padding: '1px 5px',
                borderRadius: 3, border: 'none', cursor: 'pointer',
                background: 'rgba(0,0,0,0.15)', color: '#1c1917',
              }}
            >
              −10
            </button>
            <button
              onClick={() => adjustThreshold(10)}
              style={{
                fontSize: 9, fontWeight: 700, padding: '1px 5px',
                borderRadius: 3, border: 'none', cursor: 'pointer',
                background: 'rgba(0,0,0,0.15)', color: '#1c1917',
              }}
            >
              +10
            </button>
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target" position={Position.Top}
        style={{ top: -4, left: '50%', transform: 'translateX(-50%)', background: '#fde68a', border: '2px solid #fff', width: 10, height: 10 }}
      />
      <Handle
        type="source" id="yes" position={Position.Right}
        style={{ right: -4, top: '50%', transform: 'translateY(-50%)', background: '#4ade80', border: '2px solid #fff', width: 10, height: 10 }}
      />
      <Handle
        type="source" id="no" position={Position.Bottom}
        style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)', background: '#f87171', border: '2px solid #fff', width: 10, height: 10 }}
      />
      <span style={{ position: 'absolute', right: -28, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 800, color: '#4ade80' }}>YES</span>
      <span style={{ position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 9, fontWeight: 800, color: '#f87171' }}>NO</span>
    </div>
  );
}
