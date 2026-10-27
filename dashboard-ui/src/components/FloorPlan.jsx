import { Map as MapIcon } from 'lucide-react';
import { heatColor } from '../utils.js';

const L = {
  salleA: { x: 30, y: 30, w: 400, h: 230, occupants: 2 },
  salleB: { x: 450, y: 30, w: 420, h: 230, occupants: 4 },
  cuisine: { x: 30, y: 280, w: 400, h: 130, occupants: 1 },
};
const HUB = { x: 450, y: 280, w: 420, h: 130 };

function Furniture({ id, r }) {
  const c = 'rgba(148,163,184,0.16)';
  if (id === 'salleA') return (
    <g fill={c}>
      <rect x={r.x + 40} y={r.y + 150} width="90" height="38" rx="6" />
      <rect x={r.x + 160} y={r.y + 150} width="90" height="38" rx="6" />
      <rect x={r.x + 285} y={r.y + 150} width="70" height="38" rx="6" />
    </g>
  );
  if (id === 'salleB') return <ellipse cx={r.x + r.w / 2 + 40} cy={r.y + 165} rx="130" ry="30" fill={c} />;
  return (
    <g fill={c}>
      <rect x={r.x + 20} y={r.y + 92} width="170" height="22" rx="5" />
      <rect x={r.x + 250} y={r.y + 82} width="100" height="34" rx="6" />
    </g>
  );
}

export default function FloorPlan({ rooms, selected, onSelect, rate }) {
  const hubC = { x: HUB.x + HUB.w / 2, y: HUB.y + HUB.h / 2 };

  return (
    <div className="card" id="floorplan">
      <div className="card-head">
        <div className="card-title">
          <div className="ico" style={{ background: 'rgba(34,211,238,.14)', color: 'var(--cyan)' }}><MapIcon size={19} /></div>
          <div>
            <h2>Plan d'étage — carte thermique en direct</h2>
            <p>Clic sur une pièce pour la sélectionner · chaque message MQTT fait pulser son capteur</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.74rem', color: 'var(--text-3)' }}>
          <span>16°</span>
          <div style={{ width: 120, height: 8, borderRadius: 4, background: 'linear-gradient(90deg,hsl(205 88% 56%),hsl(158 88% 56%),hsl(85 88% 56%),hsl(35 88% 56%),hsl(0 88% 56%))' }} />
          <span>28°C</span>
        </div>
      </div>

      <svg viewBox="0 0 900 440" className="svg-fluid" role="img" aria-label="Plan de l'étage avec 3 pièces">
        <defs>
          <radialGradient id="lightglow"><stop offset="0%" stopColor="#fde68a" stopOpacity=".55" /><stop offset="100%" stopColor="#fde68a" stopOpacity="0" /></radialGradient>
          <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(244,63,94,.35)" strokeWidth="2" /></pattern>
          {rooms.map((r) => (
            <radialGradient key={r.id} id={`heat-${r.id}`} cx="50%" cy="55%" r="75%">
              <stop offset="0%" stopColor={r.stale ? '#475569' : heatColor(r.temp, 90, 55, 0.62)} />
              <stop offset="100%" stopColor={r.stale ? '#1e293b' : heatColor(r.temp, 90, 40, 0.06)} />
            </radialGradient>
          ))}
        </defs>

        {/* data bus */}
        {rooms.map((r) => {
          const g = L[r.id];
          return (
            <line key={`bus-${r.id}`} className="flow" x1={g.x + g.w / 2} y1={g.y + g.h / 2} x2={hubC.x} y2={hubC.y}
              stroke={r.stale ? 'rgba(100,116,139,.4)' : 'rgba(34,211,238,.55)'} strokeWidth="2" />
          );
        })}

        {/* hub */}
        <g>
          <rect x={HUB.x} y={HUB.y} width={HUB.w} height={HUB.h} rx="16" fill="rgba(10,16,32,.92)" stroke="rgba(167,139,250,.5)" strokeDasharray="6 6" />
          <text x={hubC.x} y={hubC.y - 22} textAnchor="middle" className="svg-text" fill="#c4b5fd" fontSize="13" fontWeight="700" letterSpacing="2">HUB IoT · MOSQUITTO</text>
          <text x={hubC.x} y={hubC.y + 16} textAnchor="middle" className="svg-text" fill="#fff" fontSize="40" fontWeight="800">{rate}<tspan fontSize="16" fill="#94a3b8" fontWeight="500"> msg/s</tspan></text>
          <text x={hubC.x} y={hubC.y + 42} textAnchor="middle" fill="#64748b" fontSize="12">topics batiment/+/capteur/#  ·  actuateur/thermostat</text>
        </g>

        {/* rooms */}
        {rooms.map((r) => {
          const g = L[r.id];
          const sel = selected === r.id;
          const hot = !r.stale && r.temp > 25.5;
          const lightR = 50 + r.lum / 9;
          return (
            <g key={r.id} onClick={() => onSelect(r.id)} style={{ cursor: 'pointer' }} id={`room-${r.id}`}>
              <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="18" fill="#0a1226"
                stroke={sel ? '#22d3ee' : hot ? '#f43f5e' : 'rgba(148,163,184,.3)'} strokeWidth={sel || hot ? 2.5 : 1.5}
                style={{ filter: sel ? 'drop-shadow(0 0 14px rgba(34,211,238,.6))' : hot ? 'drop-shadow(0 0 16px rgba(244,63,94,.6))' : 'none', transition: 'all .3s' }} />
              <rect className="heat-pulse" x={g.x} y={g.y} width={g.w} height={g.h} rx="18" fill={`url(#heat-${r.id})`} />
              {r.stale && <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="18" fill="url(#hatch)" />}
              <Furniture id={r.id} r={g} />
              {r.occ && !r.stale && (
                <circle cx={g.x + g.w / 2} cy={g.y + g.h / 2 + 10} r={lightR} fill="url(#lightglow)" opacity={Math.min(0.9, r.lum / 600)} />
              )}
              {r.occ && !r.stale && Array.from({ length: g.occupants }).map((_, i) => (
                <g key={i} className="occupant" style={{ transformOrigin: 'center' }}>
                  <circle cx={g.x + g.w - 90 + i * 20} cy={g.y + g.h - 60 + (i % 2) * 18} r="8" fill="#e0f2fe" />
                  <circle cx={g.x + g.w - 90 + i * 20} cy={g.y + g.h - 60 + (i % 2) * 18} r="14" fill="none" stroke="rgba(224,242,254,.4)" />
                </g>
              ))}

              <text x={g.x + 24} y={g.y + 34} className="svg-text" fill="#e2e8f0" fontSize="15" fontWeight="700" letterSpacing="1.5">{r.name.toUpperCase()}</text>
              <text x={g.x + 24} y={g.y + 52} fill="#94a3b8" fontSize="12">{r.label} · {r.surface}</text>

              {r.stale ? (
                <>
                  <text x={g.x + 24} y={g.y + 108} className="svg-text" fill="#fb7185" fontSize="44" fontWeight="800">UNDEF</text>
                  <text x={g.x + 24} y={g.y + 132} fill="#fda4af" fontSize="12">timeout 30 s — aucune trame MQTT</text>
                </>
              ) : (
                <>
                  <text x={g.x + 24} y={g.y + 108} className="svg-text" fill="#fff" fontSize="54" fontWeight="800" style={{ textShadow: '0 0 20px rgba(0,0,0,.6)' }}>
                    {r.temp.toFixed(1)}<tspan fontSize="22" fill="#cbd5e1" fontWeight="500">°C</tspan>
                  </text>
                  <text x={g.x + 24} y={g.y + 132} fill="#cbd5e1" fontSize="13">
                    consigne <tspan fill="#22d3ee" fontWeight="700">{r.consigne.toFixed(1)}°C</tspan>
                    {r.muted ? <tspan fill="#fbbf24" fontWeight="700"> · UNDEF dans {r.undefIn}s</tspan> : null}
                  </text>
                </>
              )}

              <g transform={`translate(${g.x + g.w - 130},${g.y + 24})`}>
                <rect width="106" height="26" rx="13" fill={r.occ ? 'rgba(52,211,153,.18)' : 'rgba(251,191,36,.16)'} stroke={r.occ ? 'rgba(52,211,153,.5)' : 'rgba(251,191,36,.45)'} />
                <text x="53" y="17.5" textAnchor="middle" fill={r.occ ? '#6ee7b7' : '#fcd34d'} fontSize="11" fontWeight="700" letterSpacing="1">{r.occ ? 'OCCUPÉE' : 'INOCCUPÉE'}</text>
              </g>
              <text x={g.x + g.w - 24} y={g.y + 82} textAnchor="end" fill="#fde68a" fontSize="13">☀ {r.lum} lux</text>

              {/* sensor node */}
              <g transform={`translate(${g.x + g.w - 20},${g.y + 20})`}>
                <circle r="4" fill={r.stale ? '#f43f5e' : r.silent ? '#fbbf24' : '#22d3ee'} />
                {!r.stale && <circle key={r.lastMsg} className="ping" r="4" fill="none" stroke="#22d3ee" strokeWidth="1.5" />}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
