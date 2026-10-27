import { Flame, Users, UserX, WifiOff, Wifi, Thermometer, Sun, Cpu } from 'lucide-react';
import Sparkline from './Sparkline.jsx';
import { heatColor } from '../utils.js';

export default function RoomControls({ rooms, history, selected, onSelect, actions, source }) {
  return (
    <div className="grid g-rooms">
      {rooms.map((r) => {
        const series = history.slice(-40).map((h) => h[r.id]);
        const hot = !r.stale && r.temp > 25.5;
        const col = r.stale ? '#f43f5e' : heatColor(r.temp);
        return (
          <div key={r.id} id={`ctl-${r.id}`} className={`card room-card ${selected === r.id ? 'selected' : ''} ${hot ? 'hot' : ''}`} onClick={() => onSelect(r.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="mono" style={{ fontSize: '.72rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Cpu size={12} />{r.rmi}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
                  {r.name} <span style={{ color: 'var(--text-3)', fontWeight: 500, fontSize: '.95rem' }}>· {r.label}</span>
                </h3>
              </div>
              <span className={`chip ${r.stale ? 'bad' : r.occ ? 'ok' : 'warn'}`}>
                {r.stale ? <WifiOff size={13} /> : r.occ ? <Users size={13} /> : <UserX size={13} />}
                {r.stale ? 'UNDEF' : r.occ ? 'Occupée' : 'Inoccupée'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
              <div className="mini-metric">
                <div className="k"><Thermometer size={13} color={col} />Température</div>
                <div className="v" style={{ color: r.stale ? 'var(--crimson)' : '#fff' }}>
                  {r.stale ? 'UNDEF' : <>{r.temp.toFixed(1)}<small>°C</small></>}
                </div>
                <div style={{ marginTop: 4 }}><Sparkline data={series} color={col} width={150} height={30} min={15} max={29} /></div>
              </div>
              <div className="mini-metric">
                <div className="k"><Sun size={13} color="var(--amber)" />Luminosité</div>
                <div className="v">{r.lum}<small>lux</small></div>
                <div className="kpi-sub" style={{ marginTop: 6 }}>{r.silent && !r.stale ? <span style={{ color: 'var(--amber)' }}>silence {r.undefIn}s avant UNDEF</span> : 'flux actif'}</div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: '.8rem', color: 'var(--text-2)', fontWeight: 600 }}>Consigne thermostat</span>
                <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cyan)' }}>{r.consigne.toFixed(1)} °C</span>
              </div>
              <input type="range" min="15" max="28" step="0.5" value={r.consigne} id={`slider-${r.id}`}
                onChange={(e) => actions.setConsigne(r.id, parseFloat(e.target.value))} onClick={(e) => e.stopPropagation()} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--text-3)', marginTop: 4 }}>
                <span>Éco 15°</span><span>Confort 21°</span><span>28°</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} onClick={(e) => e.stopPropagation()}>
              <button className="btn sm" id={`presence-${r.id}`} onClick={() => actions.togglePresence(r.id)}>
                {r.occ ? <UserX size={14} /> : <Users size={14} />}{r.occ ? 'Simuler départ' : 'Simuler arrivée'}
              </button>
              <button className="btn sm danger" id={`overheat-${r.id}`} onClick={() => actions.triggerOverheat(r.id)}>
                <Flame size={14} />Surchauffe
              </button>
              <button className={`btn sm ${r.muted ? 'warn' : ''}`} id={`cut-${r.id}`} style={{ gridColumn: '1 / -1' }} onClick={() => actions.toggleSensor(r.id)}>
                {r.muted ? <Wifi size={14} /> : <WifiOff size={14} />}
                {r.muted ? `Rétablir le capteur (UNDEF dans ${r.undefIn}s)` : 'Couper le capteur (test timeout 30 s)'}
              </button>
            </div>
            {source === 'live' && <div style={{ fontSize: '.7rem', color: 'var(--text-3)' }}>LIVE : les injections sont publiées sur le vrai broker pendant ~20 s.</div>}
          </div>
        );
      })}
    </div>
  );
}
