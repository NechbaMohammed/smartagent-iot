import React from 'react';
import { Users, UserX, Sun, Thermometer, Wind, Zap } from 'lucide-react';

export default function BuildingFloorPlan({ rooms, selectedRoomId, setSelectedRoomId }) {
  // Helper for thermal color
  const getThermalGlow = (temp) => {
    if (temp === null || temp === undefined) return 'rgba(100, 116, 139, 0.2)';
    if (temp < 19) return 'rgba(56, 189, 248, 0.35)'; // Cool cyan
    if (temp <= 22.5) return 'rgba(16, 185, 129, 0.35)'; // Emerald ideal
    if (temp <= 25) return 'rgba(245, 158, 11, 0.45)'; // Warm amber
    return 'rgba(239, 68, 68, 0.6)'; // Hot alert crimson
  };

  const getBorderColor = (temp, isSelected) => {
    if (isSelected) return 'var(--cyan)';
    if (temp > 25) return 'var(--crimson)';
    if (temp > 22.5) return 'var(--amber)';
    return 'var(--border-subtle)';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            🗺️ Plan d'Étage 2.5D & Gradient Thermique
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Visualisation spatiale en temps réel : température, luminosité ambiante et présence
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span> &lt;19°C
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> 20-22°C (Idéal)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> 23-25°C
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> &gt;25°C (Alerte)
          </span>
        </div>
      </div>

      {/* 2.5D Floor Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        padding: '20px',
        background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.6) 0%, rgba(5, 8, 15, 0.95) 100%)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)'
      }}>
        {Object.entries(rooms).map(([id, room]) => {
          const isSelected = selectedRoomId === id;
          const thermalBg = getThermalGlow(room.temperature);
          const borderColor = getBorderColor(room.temperature, isSelected);

          return (
            <div
              key={id}
              onClick={() => setSelectedRoomId(id)}
              style={{
                position: 'relative',
                borderRadius: '12px',
                padding: '20px',
                background: `linear-gradient(135deg, ${thermalBg} 0%, rgba(15, 23, 42, 0.85) 100%)`,
                border: `2px solid ${borderColor}`,
                boxShadow: isSelected
                  ? '0 0 25px rgba(56, 189, 248, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.2)'
                  : room.temperature > 25
                  ? '0 0 25px rgba(239, 68, 68, 0.4)'
                  : '0 8px 24px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                overflow: 'hidden'
              }}
            >
              {/* Header of Room */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Zone {id.toUpperCase()}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    {room.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {room.type} • {room.surface}
                  </div>
                </div>

                <div className={`badge ${room.isOccupied ? 'badge-emerald' : 'badge-amber'}`}>
                  {room.isOccupied ? <Users size={12} /> : <UserX size={12} />}
                  <span>{room.isOccupied ? 'Occupée' : 'Inoccupée'}</span>
                </div>
              </div>

              {/* Central Metrics Display */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {/* Temp box */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <Thermometer size={14} color={room.temperature > 25 ? 'var(--crimson)' : 'var(--cyan)'} />
                    <span>Température</span>
                  </div>
                  <div style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    color: room.isSensorDown ? 'var(--crimson)' : room.temperature > 25 ? 'var(--crimson)' : '#fff'
                  }}>
                    {room.isSensorDown ? 'UNDEF' : `${room.temperature.toFixed(1)}°C`}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Consigne : <strong style={{ color: 'var(--cyan)' }}>{room.consigne.toFixed(1)}°C</strong>
                  </div>
                </div>

                {/* Lux box */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <Sun size={14} color="var(--amber)" />
                    <span>Luminosité</span>
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff' }}>
                    {room.luminosite} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>Lux</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Éclairage : <strong style={{ color: room.lightState ? 'var(--amber)' : 'var(--text-secondary)' }}>{room.lightState ? 'ALLUMÉ' : 'ÉTEINT'}</strong>
                  </div>
                </div>
              </div>

              {/* Actuator Status Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '6px',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wind size={13} color="var(--cyan)" />
                  <span style={{ color: 'var(--text-secondary)' }}>Actuateur :</span>
                  <span style={{
                    fontWeight: 600,
                    color: room.temperature > room.consigne + 0.5 ? 'var(--cyan)' : room.temperature < room.consigne - 0.5 ? 'var(--amber)' : 'var(--emerald)'
                  }}>
                    {room.temperature > room.consigne + 0.5 ? 'CLIMATISATION' : room.temperature < room.consigne - 0.5 ? 'CHAUFFAGE' : 'VEILLE RÉGULÉE'}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {isSelected ? '▶ Sélectionnée' : 'Cliquer pour régler'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
