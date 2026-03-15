import { Handle, Position } from 'reactflow';
import { useFlowchartStore } from '../../../stores/flowchartStore';

export default function LoopNode({ id, data }: {
  id: string;
  data: { label: string; loopType?: string; loopCount?: number; isActive?: boolean }
}) {
  const activeHandleKey = useFlowchartStore((s) => s.activeHandleKey);
  const setActiveHandleKey = useFlowchartStore((s) => s.setActiveHandleKey);
  const active = data.isActive;
  const W = 160, H = 72;

  const loopLabel =
    data.loopType === 'repeat'
      ? `🔁 Repeat ${data.loopCount ?? 3}x`
      : data.loopType === 'while_alive'
      ? '🔁 While Alive'
      : `🔁 ${data.label}`;

  return (
    <div style={{ position: 'relative', width: W, height: H, userSelect: 'none' }}>
      {/* Diamond SVG — orange (ต่างจาก condition สีเหลือง) */}
      <svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <polygon
          points={`${W / 2},2 ${W - 2},${H / 2} ${W / 2},${H - 2} 2,${H / 2}`}
          fill={active ? '#fb923c' : '#c2410c'}
          stroke={active ? '#fff' : '#7c2d12'}
          strokeWidth={2}
          style={{
            filter: active
              ? 'drop-shadow(0 0 12px rgba(251,146,60,0.9))'
              : 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
          }}
        />
      </svg>

      {/* Label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, color: 'white',
        textAlign: 'center', padding: '0 24px', lineHeight: 1.3,
      }}>
        {loopLabel}
      </div>

      {/* IN — top (target) */}
      <Handle type="target" id="in" position={Position.Top}
        className={`flow-handle${activeHandleKey === `${id}::in` ? ' flow-handle--active' : ''}`}
        onContextMenu={(e) => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::in`)}
        style={{ top: -4, left: '50%', transform: 'translateX(-50%)', background: '#fed7aa', border: '2px solid #fff', width: 10, height: 10 }}
      />

      {/* LOOP — right (continue looping, orange) */}
      <Handle type="source" id="loop" position={Position.Right}
        className={`flow-handle${activeHandleKey === `${id}::loop` ? ' flow-handle--active' : ''}`}
        onContextMenu={(e) => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::loop`)}
        style={{ right: -4, top: '50%', transform: 'translateY(-50%)', background: '#fb923c', border: '2px solid #fff', width: 10, height: 10 }}
      />

      {/* NEXT — bottom (exit loop, blue) */}
      <Handle type="source" id="next" position={Position.Bottom}
        className={`flow-handle${activeHandleKey === `${id}::next` ? ' flow-handle--active' : ''}`}
        onContextMenu={(e) => e.stopPropagation()} onMouseDown={() => setActiveHandleKey(`${id}::next`)}
        style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)', background: '#60a5fa', border: '2px solid #fff', width: 10, height: 10 }}
      />

      {/* Labels */}
      <span style={{
        position: 'absolute', right: -34, top: '50%', transform: 'translateY(-50%)',
        fontSize: 8, fontWeight: 800, color: '#fb923c',
      }}>LOOP</span>
      <span style={{
        position: 'absolute', bottom: -15, left: '50%', transform: 'translateX(-50%)',
        fontSize: 8, fontWeight: 800, color: '#60a5fa',
      }}>NEXT</span>
    </div>
  );
}
