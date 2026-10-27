import { Scale, ShieldCheck } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber.jsx';
import { ECART_MAX } from '../hooks/useBuilding.js';
import { CAT_COLORS } from '../utils.js';

const CX = 130; const CY = 130; const R = 100; const MAXV = 8;
const pt = (v, r = R) => {
  const th = Math.PI * (1 - Math.min(v, MAXV) / MAXV);
  return [CX + r * Math.cos(th), CY - r * Math.sin(th)];
};
const arc = (v0, v1) => {
  const [x0, y0] = pt(v0); const [x1, y1] = pt(v1);
  return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`;
};

export default function CoordinatorCard({ rooms, logs, source, autoBalance, setAutoBalance }) {
  const a = rooms[0]; const b = rooms[1];
  const ok = !a.stale && !b.stale;
  const delta = ok ? Math.abs(a.temp - b.temp) : 0;
  const critical = ok && delta > ECART_MAX;
  const color = critical ? '#f43f5e' : delta > 3 ? '#fbbf24' : '#34d399';
  const [nx, ny] = pt(delta, R - 26);
  const decisions = logs.filter((l) => ['COORD', 'RMI', 'ALERT'].includes(l.cat)).slice(0, 4);

  return (
    <div className="card" id="coordinator-card" style={critical ? { boxShadow: 'var(--shadow), 0 0 0 1px rgba(244,63,94,.5), 0 0 36px -8px rgba(244,63,94,.5)' } : undefined}>
      <div className="card-head" style={{ marginBottom: 6 }}>
        <div className="card-title">
          <div className="ico" style={{ background: 'rgba(52,211,153,.14)', color: 'var(--emerald)' }}><Scale size={19} /></div>
          <div>
            <h2>Coordinateur RMI</h2>
            <p>Politique : |T<sub>A</sub> − T<sub>B</sub>| &gt; {ECART_MAX.toFixed(1)} °C → consensus</p>
          </div>
        </div>
        <span className={`chip ${critical ? 'bad' : 'ok'}`}>{critical ? 'DÉSÉQUILIBRE' : 'ÉQUILIBRÉ'}</span>
      </div>

      <div style={{ display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 260 160" style={{ width: '100%', maxWidth: 320 }}>
          <path d={arc(0, MAXV)} fill="none" stroke="rgba(148,163,184,.15)" strokeWidth="16" strokeLinecap="round" />
          <path d={arc(0, ECART_MAX)} fill="none" stroke="rgba(52,211,153,.18)" strokeWidth="16" strokeLinecap="round" />
          <path d={arc(ECART_MAX, MAXV)} fill="none" stroke="rgba(244,63,94,.2)" strokeWidth="16" strokeLinecap="round" />
          {delta > 0.05 && <path d={arc(0, delta)} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'all .6s ease' }} />}
          <line x1={CX} y1={CY - R - 14} x2={CX} y2={CY - R + 14} stroke="#fff" strokeWidth="2" strokeDasharray="3 3" />
          <text x={CX} y={CY - R - 20} textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="700">SEUIL 4 °C</text>
          <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="#fff" strokeWidth="3" strokeLinecap="round" style={{ transition: 'all .6s ease' }} />
          <circle cx={CX} cy={CY} r="7" fill="#fff" />
          <text x={CX} y={CY + 30} textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff" className="svg-text">
            {ok ? delta.toFixed(1) : '—'}<tspan fontSize="13" fill="#94a3b8" fontWeight="500"> °C</tspan>
          </text>
        </svg>
      </div>

      <hr className="divider" />

      {source === 'sim' ? (
        <button id="btn-autobalance" className={`btn sm ${autoBalance ? 'on' : ''}`} style={{ width: '100%' }} onClick={() => setAutoBalance(!autoBalance)}>
          <ShieldCheck size={14} />{autoBalance ? 'Surveillance automatique active' : 'Surveillance en pause'}
        </button>
      ) : (
        <div className="chip violet" style={{ width: '100%', justifyContent: 'center' }}>Piloté par CoordinateurBatiment (Java RMI)</div>
      )}

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', color: 'var(--text-3)' }}>DERNIÈRES DÉCISIONS</div>
        {decisions.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: '.82rem' }}>Aucune intervention — le système est stable.</div>}
        {decisions.map((d) => (
          <div key={d.id} style={{ display: 'flex', gap: 8, fontSize: '.78rem', alignItems: 'baseline' }}>
            <span className="mono" style={{ color: CAT_COLORS[d.cat], fontWeight: 700, flex: 'none' }}>{d.cat}</span>
            <span style={{ color: 'var(--text-2)' }}>{d.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
