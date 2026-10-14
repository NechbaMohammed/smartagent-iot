import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function TelemetryCharts({ history }) {
  // Chart dimensions
  const width = 800;
  const height = 220;
  const padding = 40;

  // Min and max bounds for Y axis (15°C to 30°C)
  const minY = 16;
  const maxY = 29;

  const getY = (val) => {
    if (val === null || val === undefined) return height - padding;
    const clamped = Math.max(minY, Math.min(maxY, val));
    return height - padding - ((clamped - minY) / (maxY - minY)) * (height - 2 * padding);
  };

  const getX = (idx, total) => {
    if (total <= 1) return padding;
    return padding + (idx / (total - 1)) * (width - 2 * padding);
  };

  // Generate SVG path for a room
  const createPath = (key) => {
    if (!history || history.length === 0) return '';
    return history.reduce((acc, pt, idx) => {
      const x = getX(idx, history.length);
      const y = getY(pt[key]);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const pathA = createPath('salleA');
  const pathB = createPath('salleB');
  const pathC = createPath('cuisine');

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={20} color="var(--cyan)" />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            📈 Télémétrie Thermique Dynamique (Historique en Direct)
          </h2>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', background: 'var(--cyan)' }}></span> Salle A (Bureau)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', background: 'var(--amber)' }}></span> Salle B (Réunion)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', background: 'var(--emerald)' }}></span> Cuisine (Détente)
          </span>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: '250px' }}>
          {/* Grid lines */}
          {[18, 21, 24, 27].map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" />
                <text x={padding - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
                  {val}°C
                </text>
              </g>
            );
          })}

          {/* Critical Threshold 26°C line */}
          <line
            x1={padding}
            y1={getY(26)}
            x2={width - padding}
            y2={getY(26)}
            stroke="rgba(239, 68, 68, 0.4)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text x={width - padding - 4} y={getY(26) - 6} fill="var(--crimson)" fontSize="10" textAnchor="end" fontWeight="bold">
            Seuil Alerte (26°C)
          </text>

          {/* Nominal 21°C line */}
          <line
            x1={padding}
            y1={getY(21)}
            x2={width - padding}
            y2={getY(21)}
            stroke="rgba(16, 185, 129, 0.3)"
            strokeWidth="1"
          />

          {/* Temperature Curves */}
          {pathA && <path d={pathA} fill="none" stroke="var(--cyan)" strokeWidth="2.5" strokeLinecap="round" />}
          {pathB && <path d={pathB} fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" />}
          {pathC && <path d={pathC} fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" />}

          {/* Current Latest Point Dots */}
          {history.length > 0 && (
            <>
              <circle cx={getX(history.length - 1, history.length)} cy={getY(history[history.length - 1].salleA)} r="4" fill="var(--cyan)" />
              <circle cx={getX(history.length - 1, history.length)} cy={getY(history[history.length - 1].salleB)} r="4" fill="var(--amber)" />
              <circle cx={getX(history.length - 1, history.length)} cy={getY(history[history.length - 1].cuisine)} r="4" fill="var(--emerald)" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
