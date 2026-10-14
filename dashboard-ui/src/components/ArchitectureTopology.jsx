import React, { useState } from 'react';
import { Radio, Server, Cpu, Activity, Flame, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ArchitectureTopology({ rooms, coordinatorStatus, lastAction }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const nodes = {
    sensors: {
      title: "1. Capteurs Physiques & Simulateurs",
      tech: "Java Threaded Simulators (Eclipse Paho MQTT Client)",
      protocol: "MQTT v3.1.1 (TCP 1883)",
      details: "Simule en continu la température (°C), la luminosité ambiante (Lux) et l'occupation (PIR). Publications périodiques sur 'batiment/{piece}/capteur/{type}' avec QoS 0/1."
    },
    broker: {
      title: "2. Broker MQTT Eclipse Mosquitto",
      tech: "Mosquitto 2.1.2 Daemon",
      protocol: "MQTT Topics pub/sub",
      details: "Point focal de découplage temporel et spatial des flux IoT. Distribue les trames télémétriques vers openHAB et les écouteurs de supervision."
    },
    openhab: {
      title: "3. Passerelle Domotique openHAB",
      tech: "Items, Rules DSL, REST API (Port 8080)",
      protocol: "HTTP REST / SSE / MQTT Binding",
      details: "Maintient l'état persistant du bâtiment. Applique le timeout 30s (expire='30s,state=UNDEF') et les règles métier (éco inoccupation, surchauffe)."
    },
    agents: {
      title: "4. Agents de Pièce Java RMI",
      tech: "ca.usherbrooke.smartagent.agent.AgentPieceImpl",
      protocol: "Java RMI (Registry Port 2199)",
      details: "Objets distants autonomes (AgentPieceInterface) exposant getEtatPiece() et setConsigneTemperature(). Dialoguent avec openHAB via REST."
    },
    coordinator: {
      title: "5. Coordinateur Central d'Étage",
      tech: "ca.usherbrooke.smartagent.coordinator.CoordinateurBatiment",
      protocol: "Java RMI Lookup & Invocations",
      details: "Surveille en continu l'équilibre thermique inter-pièces. Si |T_A - T_B| > 4.0°C, déclenche le rééquilibrage automatique par consensus de consigne."
    },
    actuators: {
      title: "6. Actuateurs Bâtiment (Chauffage / Éclairage)",
      tech: "Thermostats Modulants & Relais d'Éclairage",
      protocol: "MQTT 'batiment/{piece}/actuateur/#'",
      details: "Appliquent physiquement les consignes déterminées par les agents et le coordinateur pour optimiser le confort et la sobriété énergétique."
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            🌐 Topologie Répartie & Flux de Données en Temps Réel
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Découplage MQTT, persistance openHAB et coordination multi-agents Java RMI
          </p>
        </div>
        <div className="badge badge-cyan" style={{ padding: '6px 12px' }}>
          <Activity size={14} />
          <span>Flux Asynchrone Actif</span>
        </div>
      </div>

      {/* Interactive Topology Graph SVG */}
      <div style={{
        background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.7) 0%, rgba(8, 12, 21, 0.95) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Node 1: Capteurs */}
          <div
            onClick={() => setSelectedNode('sensors')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: selectedNode === 'sensors' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${selectedNode === 'sensors' ? 'var(--cyan)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--cyan)' }}>
              <Radio size={20} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Capteurs IoT</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>Simulateur Java</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>Temp • Lux • PIR</div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--cyan)' }}>
            <ArrowRight size={22} className="pulse-dot" style={{ animationDuration: '1s' }} />
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MQTT TCP:1883</div>
          </div>

          {/* Node 2: Mosquitto Broker */}
          <div
            onClick={() => setSelectedNode('broker')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: selectedNode === 'broker' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${selectedNode === 'broker' ? 'var(--emerald)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--emerald)' }}>
              <Activity size={20} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Mosquitto Broker</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--emerald)' }}>Pub/Sub Port 1883</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>batiment/#</div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--emerald)' }}>
            <ArrowRight size={22} className="pulse-dot" style={{ animationDuration: '1.2s' }} />
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MQTT Binding</div>
          </div>

          {/* Node 3: openHAB Engine */}
          <div
            onClick={() => setSelectedNode('openhab')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: selectedNode === 'openhab' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${selectedNode === 'openhab' ? 'var(--amber)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--amber)' }}>
              <Server size={20} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>openHAB Server</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--amber)' }}>REST API / 8080</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>Rules DSL & Items</div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--purple)' }}>
            <ArrowRight size={22} className="pulse-dot" style={{ animationDuration: '1.4s' }} />
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>REST Client JSON</div>
          </div>

          {/* Node 4: RMI Agents */}
          <div
            onClick={() => setSelectedNode('agents')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: selectedNode === 'agents' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${selectedNode === 'agents' ? 'var(--purple)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--purple)' }}>
              <Cpu size={20} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Agents RMI</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--purple)' }}>Port 2199 / Registre</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>Salle A, B, Cuisine</div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--cyan)' }}>
            <ArrowRight size={22} className="pulse-dot" style={{ animationDuration: '1.6s' }} />
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RMI Remote Call</div>
          </div>

          {/* Node 5: Coordinator */}
          <div
            onClick={() => setSelectedNode('coordinator')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: selectedNode === 'coordinator' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${selectedNode === 'coordinator' ? 'var(--cyan)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--cyan)' }}>
              <Flame size={20} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Coordinateur</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>Équilibrage ΔT &gt; 4°C</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>Surveillance 5s</div>
          </div>
        </div>

        {/* Selected Node Details Box */}
        {selectedNode && (
          <div style={{
            marginTop: '20px',
            padding: '16px 20px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-focus)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--cyan)" />
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{nodes[selectedNode].title}</strong>
              </div>
              <span className="badge badge-cyan">{nodes[selectedNode].protocol}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Composant : </strong>
              <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{nodes[selectedNode].tech}</code>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {nodes[selectedNode].details}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
