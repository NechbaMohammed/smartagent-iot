import { Thermometer, GitCompareArrows, Users, Radio, HeartPulse } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber.jsx';
import Sparkline from './Sparkline.jsx';
import { ECART_MAX } from '../hooks/useBuilding.js';
import { heatColor } from '../utils.js';

function Tile({ id, label, Icon, accent, alert, children, value, small, sub, spark }) {
  return (
    <div id={id} className={`card kpi ${alert ? 'alert' : ''}`}>
      <div className="kpi-label"><Icon size={15} color={accent} />{label}</div>
      <div className="kpi-value" style={{ color: alert ? 'var(--crimson)' : '#fff' }}>
        {value}{small && <small>{small}</small>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
        <div className="kpi-sub">{sub}</div>
        {spark}
      </div>
      {children}
    </div>
  );
}

export default function KpiStrip({ rooms, history, rate, rateHistory }) {
  const live = rooms.filter((r) => !r.stale);
  const avg = live.length ? live.reduce((s, r) => s + r.temp, 0) / live.length : null;
  const a = rooms[0]; const b = rooms[1];
  const delta = !a.stale && !b.stale ? Math.abs(a.temp - b.temp) : null;
  const critical = delta !== null && delta > ECART_MAX;
  const occupied = rooms.filter((r) => r.occ).length;
  const healthy = rooms.filter((r) => !r.stale).length;

  const avgSeries = history.slice(-40).map((h) => {
    const v = [h.salleA, h.salleB, h.cuisine].filter((x) => typeof x === 'number');
    return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
  });
  const deltaSeries = history.slice(-40).map((h) => (h.salleA != null && h.salleB != null ? Math.abs(h.salleA - h.salleB) : null));

  return (
    <div className="grid g-kpi">
      <Tile id="kpi-avg" label="Température moyenne" Icon={Thermometer} accent={avg ? heatColor(avg) : '#fff'}
        value={<AnimatedNumber value={avg} />} small="°C" sub="Moyenne des 3 pièces actives"
        spark={<Sparkline data={avgSeries} color={avg ? heatColor(avg) : '#22d3ee'} width={120} />} />
      <Tile id="kpi-delta" label="Écart |A − B|" Icon={GitCompareArrows} accent={critical ? '#f43f5e' : '#34d399'} alert={critical}
        value={<AnimatedNumber value={delta} />} small={`°C / ${ECART_MAX.toFixed(0)} max`}
        sub={critical ? 'Seuil dépassé — rééquilibrage' : 'Dans la politique du coordinateur'}
        spark={<Sparkline data={deltaSeries} color={critical ? '#f43f5e' : '#34d399'} width={120} min={0} max={8} />} />
      <Tile id="kpi-occ" label="Occupation" Icon={Users} accent="#a78bfa"
        value={<span>{occupied}<span style={{ color: 'var(--text-3)' }}>/3</span></span>} small="pièces"
        sub={occupied === 0 ? 'Mode économie d’énergie' : 'Confort actif'} />
      <Tile id="kpi-rate" label="Débit MQTT" Icon={Radio} accent="#22d3ee"
        value={<AnimatedNumber value={rate} decimals={0} />} small="msg/s" sub="9 flux attendus / 5 s"
        spark={<Sparkline data={rateHistory} color="#22d3ee" width={120} min={0} />} />
      <Tile id="kpi-health" label="Santé capteurs" Icon={HeartPulse} accent={healthy === 3 ? '#34d399' : '#f43f5e'} alert={healthy < 3}
        value={<span>{healthy}<span style={{ color: 'var(--text-3)' }}>/3</span></span>} small="en ligne"
        sub={healthy === 3 ? 'Aucun timeout 30 s' : 'UNDEF détecté (timeout 30 s)'} />
    </div>
  );
}
