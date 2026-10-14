import React, { useState } from 'react';
import { PlayCircle, Flame, Leaf, AlertOctagon, RotateCcw, Sparkles } from 'lucide-react';

export default function DemoStudio({ onRunScenario }) {
  const [activeScenario, setActiveScenario] = useState(null);

  const scenarios = [
    {
      id: 'overheat_rebalance',
      title: 'Scénario 1 : Surchauffe & Équilibrage RMI',
      subtitle: 'Valide le rééquilibrage automatique quand |T_A - T_B| > 4°C',
      icon: Flame,
      color: 'var(--crimson)',
      badge: 'Multi-Agents RMI',
      action: () => {
        setActiveScenario('overheat_rebalance');
        onRunScenario('overheat_rebalance');
      }
    },
    {
      id: 'eco_departure',
      title: 'Scénario 2 : Règle openHAB Éco Énergie',
      subtitle: 'Simule le départ des occupants (consigne 18°C & extinction)',
      icon: Leaf,
      color: 'var(--emerald)',
      badge: 'openHAB DSL',
      action: () => {
        setActiveScenario('eco_departure');
        onRunScenario('eco_departure');
      }
    },
    {
      id: 'sensor_timeout',
      title: 'Scénario 3 : Panne Capteur & Timeout 30s',
      subtitle: 'Vérifie la clause expire="30s,state=UNDEF" et la résilience',
      icon: AlertOctagon,
      color: 'var(--amber)',
      badge: 'Tolérance aux Pannes',
      action: () => {
        setActiveScenario('sensor_timeout');
        onRunScenario('sensor_timeout');
      }
    },
    {
      id: 'reset_nominal',
      title: 'Scénario 4 : Rétablissement Nominal',
      subtitle: 'Rétablit l\'état d\'équilibre standard (21°C, capteurs actifs)',
      icon: RotateCcw,
      color: 'var(--cyan)',
      badge: 'Réinitialisation',
      action: () => {
        setActiveScenario(null);
        onRunScenario('reset_nominal');
      }
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              🎬 Studio Démonstration Professeur (1-Clic)
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Scénarios préconfigurés pour valider 100% des exigences du sujet IFT605 en direct
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isActive = activeScenario === sc.id;

          return (
            <div
              key={sc.id}
              onClick={sc.action}
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isActive ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${sc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc.color }}>
                    <Icon size={18} />
                  </div>
                  <span className="badge" style={{ background: `${sc.color}20`, color: sc.color, border: `1px solid ${sc.color}40`, fontSize: '0.68rem' }}>
                    {sc.badge}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', marginBottom: '4px' }}>
                  {sc.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                  {sc.subtitle}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.78rem', padding: '6px 12px', background: isActive ? 'rgba(56, 189, 248, 0.2)' : undefined }}
              >
                <PlayCircle size={14} color={sc.color} />
                <span>Exécuter le Scénario</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
