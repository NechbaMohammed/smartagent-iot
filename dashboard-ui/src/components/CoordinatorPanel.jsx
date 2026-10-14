import React from 'react';
import { Cpu, ShieldCheck, AlertCircle, RefreshCw, Scale, Flame, ArrowRightLeft } from 'lucide-react';

export default function CoordinatorPanel({ rooms, onForceRebalance, autoBalanceActive, setAutoBalanceActive }) {
  const tempA = rooms.salleA.temperature;
  const tempB = rooms.salleB.temperature;
  const tempC = rooms.cuisine.temperature;

  const validTemps = [tempA, tempB, tempC].filter(t => t !== null && !isNaN(t));
  const avgTemp = validTemps.length > 0 ? (validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1) : '21.0';

  const diffAB = (tempA !== null && tempB !== null) ? Math.abs(tempA - tempB).toFixed(1) : '0.0';
  const isCriticalDiff = parseFloat(diffAB) > 4.0;

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      marginBottom: '24px',
      border: isCriticalDiff ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
      background: isCriticalDiff
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, var(--bg-card) 100%)'
        : 'var(--bg-card)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: isCriticalDiff ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isCriticalDiff ? 'var(--crimson)' : 'var(--cyan)'
          }}>
            <Scale size={22} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              ⚖️ Superviseur d'Équilibrage Multi-Agents (RMI)
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Classe Java : <code style={{ color: 'var(--cyan)' }}>ca.usherbrooke.smartagent.coordinator.CoordinateurBatiment</code>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`btn ${autoBalanceActive ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAutoBalanceActive(!autoBalanceActive)}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <ShieldCheck size={14} />
            <span>{autoBalanceActive ? 'Surveillance Auto Active' : 'Surveillance Manuelle'}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={onForceRebalance}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <RefreshCw size={14} />
            <span>Cycle Forcé (5s)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Differential Gauge */}
        <div style={{
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '10px',
          border: `1px solid ${isCriticalDiff ? 'var(--crimson)' : 'var(--border-subtle)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Écart Thermique |Salle A - Salle B|
            </span>
            <span className={`badge ${isCriticalDiff ? 'badge-crimson' : 'badge-emerald'}`}>
              {isCriticalDiff ? 'DÉSEQUILIBRE' : 'STABLE'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: isCriticalDiff ? 'var(--crimson)' : 'var(--emerald)'
            }}>
              {diffAB} °C
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              / Seuil max: <strong>4.0 °C</strong>
            </span>
          </div>

          {/* Progress bar towards 4°C limit */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (parseFloat(diffAB) / 4.0) * 100)}%`,
              height: '100%',
              background: isCriticalDiff ? 'var(--crimson)' : 'var(--emerald)',
              transition: 'all 0.4s ease'
            }}></div>
          </div>
        </div>

        {/* Moyenne Bâtiment */}
        <div style={{
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Température Moyenne de l'Étage
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff' }}>
            {avgTemp} °C
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Consigne globale nominale : 21.0 °C
          </div>
        </div>

        {/* Algorithme d'arbitrage */}
        <div style={{
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Consensus Multi-Agents RMI
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {isCriticalDiff ? (
              <span style={{ color: 'var(--crimson)', fontWeight: 600 }}>
                ⚠️ Écart &gt; 4.0°C détecté ! Appel RMI <code>setConsigneTemperature({((tempA + tempB) / 2).toFixed(1)}°C)</code> envoyé.
              </span>
            ) : (
              <span style={{ color: 'var(--emerald)' }}>
                ✓ Gradient thermique dans les normes d'ingénierie (&lt; 4°C). Aucune régulation d'urgence requise.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
