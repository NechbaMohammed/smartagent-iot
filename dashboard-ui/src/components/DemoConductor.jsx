import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Timer, ChevronRight, Presentation } from 'lucide-react';

const TOTAL = 600;

export const STEPS = [
  { at: 0, range: '0 – 2 min', title: 'Lancement & architecture', action: 'nav:topology', cta: 'Afficher la topologie',
    notes: 'Présenter la chaîne : capteurs → Mosquitto → openHAB / agents RMI → coordinateur. Montrer les paquets qui circulent et la pastille verte du broker.' },
  { at: 120, range: '2 – 3 min', title: 'Mesures en direct', action: 'nav:cockpit', cta: 'Revenir au cockpit',
    notes: 'Montrer la carte thermique, le débit MQTT et le passage LIVE. Pointer que les valeurs viennent du vrai broker, pas d\'un mock.' },
  { at: 180, range: '3 – 5 min', title: 'Automatisation openHAB', action: 'scenario:eco', cta: 'Vider la Salle B',
    notes: 'La pièce passe à « inoccupée » → la règle DSL baisse le thermostat à 18 °C. Désigner la consigne qui change et le critère « Rules » qui se valide.' },
  { at: 300, range: '5 – 7 min', title: 'Équilibrage par le coordinateur', action: 'scenario:rebalance', cta: 'Provoquer ΔT > 4 °C',
    notes: 'Salle A à 27.2 °C vs Salle B à 19.8 °C. Le coordinateur détecte l\'écart, calcule le consensus et appelle setConsigneTemperature() via RMI.' },
  { at: 420, range: '7 – 9 min', title: 'Tolérance aux pannes', action: 'scenario:timeout', cta: 'Couper un capteur',
    notes: 'Après 30 s sans trame, l\'item passe en UNDEF. Puis tuer un agent RMI : le coordinateur capture RemoteException et continue son cycle.' },
  { at: 540, range: '9 – 10 min', title: 'Questions', action: 'scenario:reset', cta: 'Retour à l\'état nominal',
    notes: 'Rétablir le système. Ouvrir le journal des flux pour répondre aux questions avec des preuves concrètes.' },
];

export default function DemoConductor({ onAction, compact = false }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState(0);
  const manual = useRef(false);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setElapsed((e) => Math.min(TOTAL, e + 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || manual.current) return;
    let idx = 0;
    STEPS.forEach((s, i) => { if (elapsed >= s.at) idx = i; });
    setStep(idx);
  }, [elapsed, running]);

  const remaining = TOTAL - elapsed;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const late = running && remaining < 60;

  const reset = () => { setRunning(false); setElapsed(0); setStep(0); manual.current = false; };

  return (
    <div className="card" id="demo-conductor">
      <div className="card-head">
        <div className="card-title">
          <div className="ico" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff' }}><Presentation size={19} /></div>
          <div>
            <h2>Chef d'orchestre de la soutenance</h2>
            <p>Chrono 10 min · notes orales · action en un clic</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="mono" id="demo-timer" style={{ fontSize: '1.6rem', fontWeight: 700, padding: '2px 14px', borderRadius: 12, background: 'rgba(0,0,0,.3)', border: `1px solid ${late ? 'var(--crimson)' : 'var(--line)'}`, color: late ? 'var(--crimson)' : '#fff' }}>
            <Timer size={15} style={{ marginRight: 8, verticalAlign: 'middle', opacity: .6 }} />{mm}:{ss}
          </div>
          <button className="btn sm primary" id="demo-start" onClick={() => { manual.current = false; setRunning((r) => !r); }}>
            {running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : 'Démarrer'}
          </button>
          <button className="btn sm" onClick={reset} aria-label="Réinitialiser"><RotateCcw size={14} /></button>
        </div>
      </div>

      <div style={{ height: 5, borderRadius: 3, background: 'rgba(148,163,184,.15)', marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ width: `${(elapsed / TOTAL) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#22d3ee,#a78bfa)', transition: 'width 1s linear' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = running && elapsed >= (STEPS[i + 1]?.at ?? TOTAL + 1);
          return (
            <div key={s.title} id={`demo-step-${i}`} onClick={() => { manual.current = true; setStep(i); }}
              style={{ padding: '12px 14px', borderRadius: 13, cursor: 'pointer', transition: 'all .25s',
                background: active ? 'rgba(34,211,238,.1)' : 'rgba(255,255,255,.03)', border: `1px solid ${active ? 'rgba(34,211,238,.5)' : 'var(--line)'}`, opacity: done ? 0.55 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ width: 24, height: 24, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: '.78rem', fontWeight: 700, background: active ? 'var(--cyan)' : 'rgba(255,255,255,.08)', color: active ? '#06222b' : 'var(--text-2)' }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{s.title}</div>
                  <div className="mono" style={{ fontSize: '.7rem', color: 'var(--text-3)' }}>{s.range}</div>
                </div>
                {active && (
                  <button className="btn sm primary" id={`demo-action-${i}`} onClick={(e) => { e.stopPropagation(); onAction(s.action); }}>
                    {s.cta}<ChevronRight size={14} />
                  </button>
                )}
              </div>
              {active && !compact && <div style={{ marginTop: 10, paddingLeft: 34, color: 'var(--text-2)', fontSize: '.84rem', lineHeight: 1.55 }}>🎤 {s.notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
