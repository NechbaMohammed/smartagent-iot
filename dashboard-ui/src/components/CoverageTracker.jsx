import { Award, CheckCircle2, Circle } from 'lucide-react';

export const RUBRIC = [
  { key: 'mqtt', label: 'MQTT — Pub/Sub', pts: 15, hint: 'Trames capteurs reçues' },
  { key: 'things', label: 'openHAB Things & Items', pts: 10, hint: 'Passerelle joignable' },
  { key: 'rules', label: 'openHAB Rules (DSL)', pts: 10, hint: 'Règle éco déclenchée' },
  { key: 'rmi', label: 'Java RMI — Agents', pts: 20, hint: 'Appel setConsigneTemperature' },
  { key: 'coord', label: 'Coordinateur ΔT > 4 °C', pts: 10, hint: 'Rééquilibrage observé' },
  { key: 'fault', label: 'Tolérance aux pannes', pts: 10, hint: 'Timeout 30 s → UNDEF' },
];
const TOTAL = RUBRIC.reduce((s, r) => s + r.pts, 0);

export default function CoverageTracker({ coverage }) {
  const earned = RUBRIC.filter((r) => coverage[r.key]).reduce((s, r) => s + r.pts, 0);
  const real = RUBRIC.filter((r) => coverage[r.key] === 'live').reduce((s, r) => s + r.pts, 0);
  const C = 2 * Math.PI * 38;

  return (
    <div className="card" id="coverage-card">
      <div className="card-head">
        <div className="card-title">
          <div className="ico" style={{ background: 'rgba(251,191,36,.14)', color: 'var(--amber)' }}><Award size={19} /></div>
          <div>
            <h2>Barème validé en direct</h2>
            <p>Les critères s'allument quand l'événement est observé</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14 }}>
        <svg width="92" height="92" viewBox="0 0 92 92">
          <circle cx="46" cy="46" r="38" fill="none" stroke="rgba(148,163,184,.15)" strokeWidth="9" />
          <circle cx="46" cy="46" r="38" fill="none" stroke="rgba(251,191,36,.35)" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - earned / TOTAL)} transform="rotate(-90 46 46)" style={{ transition: 'stroke-dashoffset .8s ease' }} />
          <circle cx="46" cy="46" r="38" fill="none" stroke="#34d399" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - real / TOTAL)} transform="rotate(-90 46 46)" style={{ transition: 'stroke-dashoffset .8s ease', filter: 'drop-shadow(0 0 6px #34d399)' }} />
          <text x="46" y="51" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800" className="svg-text">{earned}</text>
          <text x="46" y="65" textAnchor="middle" fill="#64748b" fontSize="9">/ {TOTAL} pts</text>
        </svg>
        <div style={{ fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
          <div><span className="dot" style={{ color: '#34d399', display: 'inline-block', marginRight: 7 }} />{real} pts <b style={{ color: '#6ee7b7' }}>réels</b> (broker / openHAB)</div>
          <div><span className="dot" style={{ color: '#fbbf24', display: 'inline-block', marginRight: 7 }} />{earned - real} pts <b style={{ color: '#fcd34d' }}>simulés</b></div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {RUBRIC.map((r) => {
          const st = coverage[r.key];
          const color = st === 'live' ? '#34d399' : st === 'sim' ? '#fbbf24' : '#475569';
          return (
            <div key={r.key} id={`rubric-${r.key}`} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11,
              background: st ? `${color}14` : 'rgba(255,255,255,.03)', border: `1px solid ${st ? `${color}55` : 'var(--line)'}`, transition: 'all .4s',
            }}>
              {st ? <CheckCircle2 size={18} color={color} /> : <Circle size={18} color={color} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.84rem', fontWeight: 600, color: st ? '#fff' : 'var(--text-2)' }}>{r.label}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-3)' }}>{r.hint}</div>
              </div>
              <span className="mono" style={{ fontSize: '.76rem', color: st ? color : 'var(--text-3)', fontWeight: 700 }}>
                {st === 'sim' ? 'SIM ' : ''}{r.pts} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
