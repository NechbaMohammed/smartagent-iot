import React from 'react';
import { Thermometer, Sun, Users, UserX, Lightbulb, AlertTriangle, Cpu, Radio, RotateCcw, Flame } from 'lucide-react';

export default function RoomCard({ room, onUpdateSetpoint, onTogglePresence, onTriggerOverheat, onToggleSensorFailure, onToggleLight }) {
  const isOverheating = room.temperature > 25.5;

  return (
    <div className="glass-panel" style={{
      padding: '20px',
      border: isOverheating ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
      boxShadow: isOverheating ? '0 0 20px rgba(239, 68, 68, 0.2)' : undefined,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              AGENT RMI : {room.rmiBinding}
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: '2px 0 0 0', fontFamily: 'var(--font-heading)' }}>
              {room.name}
            </h3>
          </div>

          <div className={`badge ${room.isOccupied ? 'badge-emerald' : 'badge-amber'}`}>
            {room.isOccupied ? <Users size={12} /> : <UserX size={12} />}
            <span>{room.isOccupied ? 'Occupée' : 'Inoccupée'}</span>
          </div>
        </div>

        {/* Telemetry Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {/* Temperature */}
          <div style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <Thermometer size={14} color="var(--cyan)" />
              <span>Température</span>
            </div>
            <div style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: room.isSensorDown ? 'var(--crimson)' : isOverheating ? 'var(--crimson)' : '#fff',
              margin: '4px 0'
            }}>
              {room.isSensorDown ? 'UNDEF' : `${room.temperature.toFixed(1)} °C`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Topic: <code>.../temperature</code>
            </div>
          </div>

          {/* Luminosity */}
          <div style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <Sun size={14} color="var(--amber)" />
              <span>Luminosité</span>
            </div>
            <div style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#fff',
              margin: '4px 0'
            }}>
              {room.luminosite} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>Lux</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Topic: <code>.../luminosite</code>
            </div>
          </div>
        </div>

        {/* Consigne Slider */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Consigne Thermostat Cible :
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              {room.consigne.toFixed(1)} °C
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="28"
            step="0.5"
            value={room.consigne}
            onChange={(e) => onUpdateSetpoint(room.id, parseFloat(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>Éco (16°C)</span>
            <span>Standard (21°C)</span>
            <span>Confort (25°C)</span>
          </div>
        </div>
      </div>

      {/* Control Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onTogglePresence(room.id)}
            style={{ fontSize: '0.76rem', padding: '6px 10px' }}
          >
            {room.isOccupied ? <UserX size={13} /> : <Users size={13} />}
            <span>{room.isOccupied ? 'Simuler Sortie' : 'Simuler Présence'}</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onToggleLight(room.id)}
            style={{ fontSize: '0.76rem', padding: '6px 10px' }}
          >
            <Lightbulb size={13} color={room.lightState ? 'var(--amber)' : undefined} />
            <span>{room.lightState ? 'Éteindre' : 'Allumer'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            className="btn btn-danger"
            onClick={() => onTriggerOverheat(room.id)}
            style={{ fontSize: '0.74rem', padding: '6px 10px' }}
            title="Injecte 27.0°C pour tester l'écart thermique > 4°C et le rééquilibrage du coordinateur"
          >
            <Flame size={13} />
            <span>Surchauffe (+5°C)</span>
          </button>

          <button
            className={`btn ${room.isSensorDown ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onToggleSensorFailure(room.id)}
            style={{ fontSize: '0.74rem', padding: '6px 10px' }}
            title="Simule une panne capteur et vérifie l'expiration 30s openHAB"
          >
            <AlertTriangle size={13} color={room.isSensorDown ? '#fff' : 'var(--amber)'} />
            <span>{room.isSensorDown ? 'Rétablir Capteur' : 'Couper Capteur (30s)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
