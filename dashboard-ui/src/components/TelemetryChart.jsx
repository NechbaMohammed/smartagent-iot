import { useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { SERIES } from '../utils.js';

const W = 900; const H = 300; const PL = 46; const PR = 16; const PT = 16; const PB = 30;
const KEYS = ['salleA', 'salleB', 'cuisine'];

function segments(points) {
  const segs = []; let cur = [];
  points.forEach((p) => { if (p) cur.push(p); else { if (cur.length) segs.push(cur); cur = []; } });
  if (cur.length) segs.push(cur);
  return segs;
}
function smooth(seg) {
  if (seg.length === 1) return `M ${seg[0][0]} ${seg[0][1]}`;
  let d = `M ${seg[0][0]} ${seg[0][1]}`;
  for (let i = 0; i < seg.length - 1; i += 1) {
    const p0 = seg[i - 1] || seg[i]; const p1 = seg[i]; const p2 = seg[i + 1]; const p3 = seg[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6; const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6; const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export default function TelemetryChart({ history }) {
  const [hidden, setHidden] = useState({});
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  const data = history.slice(-90);
  const vals = data.flatMap((h) => KEYS.map((k) => h[k])).filter((v) => typeof v === 'number');
  const lo = Math.floor(Math.min(15, ...vals) - 0.5);
  const hi = Math.ceil(Math.max(29, ...vals) + 0.5);
  const x = (i) => PL + (i / Math.max(1, data.length - 1)) * (W - PL - PR);
  const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const ticks = []; for (let v = Math.ceil(lo / 3) * 3; v <= hi; v += 3) ticks.push(v);

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PL) / (W - PL - PR)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const hp = hover != null ? data[hover] : null;
  const tipX = hover != null ? Math.min(x(hover), W - 190) : 0;

  return (
    <div className="card" id="chart-card">
      <div className="card-head">
        <div className="card-title">
          <div className="ico" style={{ background: 'rgba(96,165,250,.14)', color: 'var(--blue)' }}><TrendingUp size={19} /></div>
          <div>
            <h2>Télémétrie thermique</h2>
            <p>3 pièces · fenêtre glissante de 3 minutes · survol pour le détail</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {KEYS.map((k) => (
            <button key={k} className={`btn sm ${hidden[k] ? '' : 'on'}`} style={hidden[k] ? { opacity: .5 } : { color: SERIES[k].color, borderColor: `${SERIES[k].color}77`, background: `${SERIES[k].color}1c` }}
              onClick={() => setHidden((h) => ({ ...h, [k]: !h[k] }))}>
              <span className="dot" style={{ color: SERIES[k].color }} />{SERIES[k].label}
            </button>
          ))}
        </div>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="svg-fluid" onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }}>
        <defs>
          {KEYS.map((k) => (
            <linearGradient key={k} id={`area-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[k].color} stopOpacity=".28" /><stop offset="100%" stopColor={SERIES[k].color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {ticks.map((v) => (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke="rgba(148,163,184,.1)" />
            <text x={PL - 10} y={y(v) + 4} textAnchor="end" fill="#64748b" fontSize="11" className="mono">{v}°</text>
          </g>
        ))}

        {/* zone de confort + seuil d'alerte */}
        <rect x={PL} y={y(23)} width={W - PL - PR} height={y(19) - y(23)} fill="rgba(52,211,153,.07)" />
        <text x={W - PR - 6} y={y(23) + 14} textAnchor="end" fill="#34d399" fontSize="10" opacity=".7">zone de confort 19–23 °C</text>
        <line x1={PL} x2={W - PR} y1={y(26)} y2={y(26)} stroke="rgba(244,63,94,.55)" strokeDasharray="5 5" />
        <text x={PL + 8} y={y(26) - 6} fill="#fb7185" fontSize="10" fontWeight="700">ALERTE 26 °C</text>

        {data.map((h, i) => (h.ev ? (
          <g key={`ev-${h.t}`}>
            <line x1={x(i)} x2={x(i)} y1={PT} y2={H - PB} stroke="rgba(167,139,250,.5)" strokeDasharray="3 4" />
            <rect x={x(i) - 28} y={PT} width="56" height="16" rx="8" fill="rgba(167,139,250,.9)" />
            <text x={x(i)} y={PT + 11.5} textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="700">{h.ev}</text>
          </g>
        ) : null))}

        {KEYS.filter((k) => !hidden[k]).map((k) => {
          const pts = data.map((h, i) => (typeof h[k] === 'number' ? [x(i), y(h[k])] : null));
          return segments(pts).map((seg, si) => {
            const line = smooth(seg);
            const area = `${line} L ${seg[seg.length - 1][0]} ${H - PB} L ${seg[0][0]} ${H - PB} Z`;
            return (
              <g key={`${k}-${si}`}>
                <path d={area} fill={`url(#area-${k})`} />
                <path d={line} fill="none" stroke={SERIES[k].color} strokeWidth="2.6" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${SERIES[k].color}88)` }} />
              </g>
            );
          });
        })}

        {hp && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,.35)" />
            {KEYS.filter((k) => !hidden[k] && typeof hp[k] === 'number').map((k) => (
              <circle key={k} cx={x(hover)} cy={y(hp[k])} r="5" fill={SERIES[k].color} stroke="#fff" strokeWidth="1.5" />
            ))}
            <g transform={`translate(${tipX + 12},${PT + 22})`}>
              <rect width="170" height="86" rx="10" fill="rgba(8,13,28,.96)" stroke="rgba(148,163,184,.3)" />
              <text x="12" y="20" fill="#94a3b8" fontSize="11" className="mono">{new Date(hp.t).toLocaleTimeString('fr-CA')}</text>
              {KEYS.map((k, i) => (
                <g key={k} transform={`translate(12,${40 + i * 17})`}>
                  <circle r="4" cy="-4" fill={SERIES[k].color} />
                  <text x="12" fill="#cbd5e1" fontSize="12">{SERIES[k].label}</text>
                  <text x="146" textAnchor="end" fill="#fff" fontSize="12" fontWeight="700" className="mono">{typeof hp[k] === 'number' ? `${hp[k].toFixed(1)} °C` : 'UNDEF'}</text>
                </g>
              ))}
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
