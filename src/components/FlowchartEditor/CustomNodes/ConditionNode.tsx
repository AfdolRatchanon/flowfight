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
  'hp_less', 'hp_greater', 'gold_less', 'gold_greater', 'turn_gte',
]);

export default function ConditionNode({
  id,
  data,
}: {
  id: string;
  data: ConditionData;
}) {
  const { nodes, setNodes, visitedNodeIds, visitedConditionResults, shieldGlowTypes } = useFlowchartStore();
  const active = data.isActive;
  const wasVisited = visitedNodeIds.includes(id);
  const traceResult = wasVisited ? visitedConditionResults[id] : undefined; // true=YES, false=NO, undefined=not visited
  const W = 180, H = 80;

  const condType = data.conditionType ?? 'enemy_alive';
  const isShieldTarget = shieldGlowTypes.includes('condition') || shieldGlowTypes.includes(condType);
  const threshold = data.threshold ?? 50;
  const hasThreshold = THRESHOLD_TYPES.has(condType);

  function adjustThreshold(delta: number) {
    const updated = nodes.map(n => {
      if (n.id !== id) return n;
      const next = { ...n.data, threshold: Math.max(1, Math.min(999, threshold + delta)) };
      // Rebuild label based on condition type
      if (condType === 'turn_gte') {
        next.label = `Turn ≥ ${next.threshold}?`;
      } else {
        const isGreater = condType.endsWith('_greater');
        const subj = condType.startsWith('gold') ? 'Gold' : 'HP';
        next.label = `${subj} ${isGreater ? '>' : '<'} ${next.threshold}?`;
      }
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
          fill={active ? '#fbbf24' : wasVisited ? '#d97706' : '#d97706'}
          stroke={active ? '#fff' : isShieldTarget ? '#fb923c' : wasVisited ? 'rgba(74,222,128,0.8)' : '#92400e'}
          strokeWidth={isShieldTarget ? 3 : 2}
          style={{
            filter: active
              ? 'drop-shadow(0 0 12px rgba(251,191,36,0.8))'
              : isShieldTarget ? undefined
              : wasVisited ? 'drop-shadow(0 0 8px rgba(74,222,128,0.5))' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
            animation: isShieldTarget ? 'shieldPulseSvg 1.4s ease-in-out infinite' : undefined,
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

        {/* Threshold buttons — ±1 for turn_gte, ±10 for HP/Gold conditions */}
        {hasThreshold && (() => {
          const step = condType === 'turn_gte' ? 1 : 10;
          return (
            <div style={{ display: 'flex', gap: 3 }} onMouseDown={stopProp} onClick={stopProp}>
              <button
                onClick={() => adjustThreshold(-step)}
                style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px',
                  borderRadius: 3, border: 'none', cursor: 'pointer',
                  background: 'rgba(0,0,0,0.15)', color: '#1c1917',
                }}
              >
                −{step}
              </button>
              <button
                onClick={() => adjustThreshold(step)}
                style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 5px',
                  borderRadius: 3, border: 'none', cursor: 'pointer',
                  background: 'rgba(0,0,0,0.15)', color: '#1c1917',
                }}
              >
                +{step}
              </button>
            </div>
          );
        })()}
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
      <span style={{
        position: 'absolute', right: -28, top: '50%', transform: 'translateY(-50%)',
        fontSize: 9, fontWeight: 800,
        color: traceResult === true ? '#fff' : '#4ade80',
        background: traceResult === true ? '#16a34a' : 'transparent',
        borderRadius: 3, padding: traceResult === true ? '1px 4px' : 0,
      }}>YES</span>
      <span style={{
        position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
        fontSize: 9, fontWeight: 800,
        color: traceResult === false ? '#fff' : '#f87171',
        background: traceResult === false ? '#dc2626' : 'transparent',
        borderRadius: 3, padding: traceResult === false ? '1px 4px' : 0,
      }}>NO</span>
    </div>
  );
}
