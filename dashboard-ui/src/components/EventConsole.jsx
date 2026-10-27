import { useState } from 'react';
import { Terminal, Trash2, Search } from 'lucide-react';
import { CAT_COLORS } from '../utils.js';

const CATS = ['ALL', 'MQTT', 'RMI', 'openHAB', 'COORD', 'ALERT'];

export default function EventConsole({ logs, onClear, height = 260 }) {
  const [filter, setFilter] = useState('ALL');
  const [q, setQ] = useState('');
  const counts = logs.reduce((m, l) => ({ ...m, [l.cat]: (m[l.cat] || 0) + 1 }), {});
  const shown = logs.filter((l) => (filter === 'ALL' || l.cat === filter) && (!q || l.msg.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="card" id="console-card">
      <div className="card-head">
        <div className="card-title">
          <div className="ico" style={{ background: 'rgba(52,211,153,.14)', color: 'var(--emerald)' }}><Terminal size={19} /></div>
          <div>
            <h2>Journal des flux répartis</h2>
            <p>{logs.length} événements · MQTT, RMI, openHAB, coordinateur</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {CATS.map((c) => (
            <button key={c} id={`log-filter-${c}`} className={`btn sm ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}
              style={filter !== c && c !== 'ALL' ? { color: CAT_COLORS[c] } : undefined}>
              {c === 'ALL' ? 'Tous' : c}{c !== 'ALL' && counts[c] ? <span className="mono" style={{ opacity: .7 }}>{counts[c]}</span> : null}
            </button>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 9, border: '1px solid var(--line)', background: 'rgba(0,0,0,.25)' }}>
            <Search size={13} color="var(--text-3)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer…" style={{ background: 'none', border: 0, outline: 0, color: '#fff', width: 110, fontSize: '.8rem' }} />
          </label>
          <button className="btn sm" onClick={onClear}><Trash2 size={13} />Vider</button>
        </div>
      </div>

      <div className="console" style={{ height }}>
        {shown.length === 0 && <div style={{ color: 'var(--text-3)', textAlign: 'center', paddingTop: height / 2 - 20 }}>Aucun événement.</div>}
        {shown.map((l) => (
          <div key={l.id} className="log-line">
            <span className="t">{l.time}</span>
            <span className="c" style={{ color: CAT_COLORS[l.cat] }}>[{l.cat}]</span>
            <span style={{ color: l.cat === 'ALERT' ? '#fda4af' : '#dbe4f0' }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
