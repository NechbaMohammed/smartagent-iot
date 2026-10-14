import React, { useState, useEffect } from 'react';
import { Activity, Radio, Cpu, Server, Play, Pause, Layers, ShieldCheck, Clock } from 'lucide-react';

export default function Header({ isSimulating, setIsSimulating, activeView, setActiveView, stats }) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-CA'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('fr-CA'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="glass-panel" style={{
      padding: '16px 28px',
      marginBottom: '24px',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
      borderTop: '2px solid rgba(56, 189, 248, 0.4)'
    }}>
      {/* Brand & Project Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
        }}>
          <Activity size={26} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #f8fafc 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              SmartAgent-IoT
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
              v1.0 Pro
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Superviseur Intelligent d'Étage</span>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <span style={{ color: 'var(--cyan)' }}>Systèmes Répartis & Multi-Agents</span>
          </div>
        </div>
      </div>

      {/* Cluster Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div className="badge badge-emerald" title="Broker MQTT Eclipse Mosquitto">
          <span className="pulse-dot" style={{ background: 'var(--emerald)' }}></span>
          <Radio size={13} />
          <span>MQTT :1883</span>
        </div>

        <div className="badge badge-purple" title="Registre RMI & Agents de Pièce">
          <span className="pulse-dot" style={{ background: 'var(--purple)' }}></span>
          <Cpu size={13} />
          <span>RMI :2199</span>
        </div>

        <div className="badge badge-cyan" title="openHAB REST API & DSL Rules">
          <span className="pulse-dot" style={{ background: 'var(--cyan)' }}></span>
          <Server size={13} />
          <span>openHAB REST</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)'
        }}>
          <Clock size={14} color="var(--cyan)" />
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Actions & View Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          className={`btn ${isSimulating ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setIsSimulating(!isSimulating)}
          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
        >
          {isSimulating ? <Pause size={14} /> : <Play size={14} />}
          <span>{isSimulating ? 'Pause Flux' : 'Démarrer Flux'}</span>
        </button>

        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '2px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveView('cockpit')}
            style={{
              background: activeView === 'cockpit' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeView === 'cockpit' ? 'var(--cyan)' : 'var(--text-secondary)',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={13} />
            <span>Cockpit</span>
          </button>
          <button
            onClick={() => setActiveView('topology')}
            style={{
              background: activeView === 'topology' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeView === 'topology' ? 'var(--cyan)' : 'var(--text-secondary)',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Server size={13} />
            <span>Topologie Réseau</span>
          </button>
        </div>
      </div>
    </header>
  );
}
