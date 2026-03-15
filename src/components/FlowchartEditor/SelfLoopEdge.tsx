import { EdgeLabelRenderer } from 'reactflow';
import type { EdgeProps } from 'reactflow';

// Self-loop edge that draws a wider rectangular path to the right of the node.
// loopOffset controls how far right the path extends (= length of top/bottom horizontal segments).
const LOOP_OFFSET = 80;  // horizontal distance to the right of the handle
const CORNER_Y   = 28;   // vertical drop/rise before going horizontal

export default function SelfLoopEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  markerEnd,
  style,
  label,
  labelStyle,
  labelBgStyle,
}: EdgeProps) {
  const rx = sourceX + LOOP_OFFSET;

  // Path: source → down → right → up → target (all straight/step style)
  const d = [
    `M ${sourceX} ${sourceY}`,
    `L ${sourceX} ${sourceY + CORNER_Y}`,
    `L ${rx} ${sourceY + CORNER_Y}`,
    `L ${rx} ${targetY - CORNER_Y}`,
    `L ${targetX} ${targetY - CORNER_Y}`,
    `L ${targetX} ${targetY}`,
  ].join(' ');

  // Label position: midpoint of right vertical segment
  const labelX = rx + 10;
  const labelY = (sourceY + CORNER_Y + targetY - CORNER_Y) / 2;

  return (
    <>
      {/* Visible path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={d}
        style={style}
        markerEnd={markerEnd}
        fill="none"
      />
      {/* Invisible wider hit area (easier to click/delete) */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        style={{ cursor: 'pointer' }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              fontSize: 11,
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: 4,
              background: (labelBgStyle as React.CSSProperties | undefined)?.fill?.toString() ?? 'rgba(0,0,0,0.7)',
              ...(labelStyle as React.CSSProperties | undefined),
            }}
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
