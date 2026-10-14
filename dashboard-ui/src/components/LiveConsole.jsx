import React, { useState } from 'react';
import { Terminal, Filter, Trash2, ShieldAlert } from 'lucide-react';

export default function LiveConsole({ logs, onClearLogs }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filter !== 'ALL' && log.category !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'MQTT': return 'var(--cyan)';
      case 'RMI': return 'var(--purple)';
      case 'openHAB': return 'var(--amber)';
      case 'COORD': return 'var(--emerald)';
      case 'ALERT': return 'var(--crimson)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={18} color="var(--emerald)" />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            📡 Journal des Flux Réseau & Décisions Multi-Agents
          </h2>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'MQTT', 'RMI', 'openHAB', 'COORD', 'ALERT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                background: filter === cat ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filter === cat ? 'var(--cyan)' : 'var(--text-secondary)',
                border: `1px solid ${filter === cat ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-subtle)'}`,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {cat === 'ALL' ? 'Tous' : cat}
            </button>
          ))}

          <input
            type="text"
            placeholder="Filtrer message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: '#fff',
              fontSize: '0.75rem',
              outline: 'none',
              width: '120px'
            }}
          />

          <button
            className="btn btn-secondary"
            onClick={onClearLogs}
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            title="Vider le journal"
          >
            <Trash2 size={12} />
            <span>Effacer</span>
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div style={{
        background: '#040711',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        padding: '12px 16px',
        height: '220px',
        overflowY: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        lineHeight: 1.6
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', paddingTop: '80px' }}>
            Aucun événement pour ce filtre.
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', borderBottom: '1px solid rgba(255, 255, 255, 0.02)', paddingBottom: '2px' }}>
              <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>[{log.time}]</span>
              <span style={{
                color: getCategoryColor(log.category),
                fontWeight: 700,
                minWidth: '70px',
                display: 'inline-block'
              }}>
                [{log.category}]
              </span>
              <span style={{ color: log.category === 'ALERT' ? 'var(--crimson)' : 'var(--text-primary)' }}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
