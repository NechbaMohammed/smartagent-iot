import { useId } from 'react';

export default function Sparkline({ data, color = '#22d3ee', width = 160, height = 44, min, max }) {
  const gid = useId().replace(/:/g, '');
  const pts = data.filter((v) => typeof v === 'number');
  if (pts.length < 2) return <svg width={width} height={height} />;
  const lo = min ?? Math.min(...pts);
  const hi = max ?? Math.max(...pts);
  const span = hi - lo || 1;
  const step = width / (data.length - 1);
  const coords = data.map((v, i) => [i * step, height - 4 - (((v ?? lo) - lo) / span) * (height - 8)]);
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const [lx, ly] = coords[coords.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.5" fill={color} />
      <circle cx={lx} cy={ly} r="7" fill={color} opacity="0.25" />
    </svg>
  );
}
