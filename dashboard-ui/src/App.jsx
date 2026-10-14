import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import BuildingFloorPlan from './components/BuildingFloorPlan.jsx';
import RoomCard from './components/RoomCard.jsx';
import CoordinatorPanel from './components/CoordinatorPanel.jsx';
import ArchitectureTopology from './components/ArchitectureTopology.jsx';
import DemoStudio from './components/DemoStudio.jsx';
import TelemetryCharts from './components/TelemetryCharts.jsx';
import LiveConsole from './components/LiveConsole.jsx';

const INITIAL_ROOMS = {
  salleA: {
    id: 'salleA',
    name: 'Salle A (Bureau)',
    type: 'Bureau de travail',
    surface: '22 m²',
    temperature: 21.8,
    luminosite: 390,
    isOccupied: true,
    consigne: 21.0,
    lightState: true,
    isSensorDown: false,
    rmiBinding: 'agent-salleA'
  },
  salleB: {
    id: 'salleB',
    name: 'Salle B (Réunion)',
    type: 'Salle de conférence',
    surface: '45 m²',
    temperature: 20.4,
    luminosite: 430,
    isOccupied: true,
    consigne: 20.5,
    lightState: true,
    isSensorDown: false,
    rmiBinding: 'agent-salleB'
  },
  cuisine: {
    id: 'cuisine',
    name: 'Cuisine (Détente)',
    type: 'Espace repas & café',
    surface: '18 m²',
    temperature: 19.6,
    luminosite: 250,
    isOccupied: false,
    consigne: 18.0,
    lightState: false,
    isSensorDown: false,
    rmiBinding: 'agent-cuisine'
  }
};

export default function App() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState('salleA');
  const [activeView, setActiveView] = useState('cockpit'); // 'cockpit' | 'topology'
  const [isSimulating, setIsSimulating] = useState(true);
  const [autoBalanceActive, setAutoBalanceActive] = useState(true);

  // Telemetry chart history
  const [history, setHistory] = useState([
    { time: '12:00', salleA: 21.5, salleB: 20.2, cuisine: 19.4 },
    { time: '12:01', salleA: 21.6, salleB: 20.3, cuisine: 19.5 },
    { time: '12:02', salleA: 21.8, salleB: 20.4, cuisine: 19.6 }
  ]);

  // Event stream logs
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString('fr-CA'), category: 'COORD', message: 'CoordinateurBatiment RMI initialisé (surveillance inter-pièces active).' },
    { time: new Date().toLocaleTimeString('fr-CA'), category: 'RMI', message: 'Registre RMI démarré sur le port 2199. 3 agents liés (salleA, salleB, cuisine).' },
    { time: new Date().toLocaleTimeString('fr-CA'), category: 'openHAB', message: 'openHAB REST Client connecté sur http://localhost:8080/rest/items' },
    { time: new Date().toLocaleTimeString('fr-CA'), category: 'MQTT', message: 'Mosquitto Broker TCP:1883 écoute sur batiment/+/capteur/#' }
  ]);

  const addLog = (category, message) => {
    const time = new Date().toLocaleTimeString('fr-CA');
    setLogs((prev) => [{ time, category, message }, ...prev.slice(0, 80)]);
  };

  // Periodic simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setRooms((prev) => {
        const next = { ...prev };
        for (const key of ['salleA', 'salleB', 'cuisine']) {
          const room = next[key];
          if (room.isSensorDown) continue;

          // Convergence toward target setpoint consigne + noise
          const drift = (room.consigne - room.temperature) * 0.15;
          const noise = (Math.random() - 0.5) * 0.1;
          const newTemp = Math.round((room.temperature + drift + noise) * 10) / 10;
          next[key] = { ...room, temperature: newTemp };
        }

        // Check coordinator rebalance algorithm
        const tA = next.salleA.temperature;
        const tB = next.salleB.temperature;
        const diff = Math.abs(tA - tB);

        if (autoBalanceActive && diff > 4.0 && !next.salleA.isSensorDown && !next.salleB.isSensorDown) {
          const consensus = Math.round(((tA + tB) / 2) * 10) / 10;
          addLog('ALERT', `⚠️ Écart thermique critique détecté : |${tA}°C - ${tB}°C| = ${diff.toFixed(1)}°C > 4.0°C !`);
          addLog('COORD', `Algorithme RMI : calcul consensus T_cible = (${tA} + ${tB}) / 2 = ${consensus}°C`);

          if (tA > tB) {
            next.salleA = { ...next.salleA, consigne: consensus };
            addLog('RMI', `Invoque remote method: agent-salleA.setConsigneTemperature(${consensus}°C)`);
            addLog('MQTT', `Agent A publie ordre actuateur : batiment/salleA/actuateur/thermostat -> ${consensus}`);
          } else {
            next.salleB = { ...next.salleB, consigne: consensus };
            addLog('RMI', `Invoque remote method: agent-salleB.setConsigneTemperature(${consensus}°C)`);
            addLog('MQTT', `Agent B publie ordre actuateur : batiment/salleB/actuateur/thermostat -> ${consensus}`);
          }
        }

        return next;
      });

      // Update history
      setHistory((prev) => {
        const time = new Date().toLocaleTimeString('fr-CA', { minute: '2-digit', second: '2-digit' });
        return [
          ...prev.slice(-20),
          {
            time,
            salleA: rooms.salleA.isSensorDown ? null : rooms.salleA.temperature,
            salleB: rooms.salleB.isSensorDown ? null : rooms.salleB.temperature,
            cuisine: rooms.cuisine.isSensorDown ? null : rooms.cuisine.temperature
          }
        ];
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isSimulating, autoBalanceActive, rooms]);

  // Handlers
  const handleUpdateSetpoint = (roomId, consigne) => {
    setRooms((prev) => ({
      ...prev,
      [roomId]: { ...prev[roomId], consigne }
    }));
    addLog('RMI', `Modification manuelle : setConsigneTemperature(${roomId}, ${consigne}°C)`);
    addLog('MQTT', `batiment/${roomId}/actuateur/thermostat -> ${consigne}`);
  };

  const handleTogglePresence = (roomId) => {
    setRooms((prev) => {
      const room = prev[roomId];
      const newOcc = !room.isOccupied;
      const newConsigne = newOcc ? 21.0 : 18.0;
      const newLight = newOcc;

      addLog('MQTT', `PUBLISH batiment/${roomId}/capteur/occupation -> ${newOcc ? 'ON' : 'OFF'}`);
      addLog('openHAB', `Règle DSL déclenchée: Pièce ${roomId} ${newOcc ? 'occupée -> Consigne confort 21°C' : 'inoccupée -> Consigne éco 18°C & extinction'}`);

      return {
        ...prev,
        [roomId]: {
          ...room,
          isOccupied: newOcc,
          consigne: newConsigne,
          lightState: newLight
        }
      };
    });
  };

  const handleTriggerOverheat = (roomId) => {
    setRooms((prev) => ({
      ...prev,
      [roomId]: { ...prev[roomId], temperature: 26.8 }
    }));
    addLog('MQTT', `PUBLISH batiment/${roomId}/capteur/temperature -> 26.8°C (Pic Surchauffe)`);
    addLog('ALERT', `🚨 ALERTE SURCHAUFFE : Température de ${roomId} dépasse le seuil max (26.0°C) !`);
  };

  const handleToggleSensorFailure = (roomId) => {
    setRooms((prev) => {
      const isDown = !prev[roomId].isSensorDown;
      if (isDown) {
        addLog('ALERT', `⚠️ Panne simulée du capteur de ${roomId}. Arrêt des trames MQTT.`);
        addLog('openHAB', `Démarrage du délai d'expiration openHAB: expire="30s,state=UNDEF"`);
      } else {
        addLog('MQTT', `Rétablissement de la sonde ${roomId}. Reprise de la publication MQTT.`);
        addLog('openHAB', `État ${roomId} rétabli : sonde opérationnelle.`);
      }
      return {
        ...prev,
        [roomId]: { ...prev[roomId], isSensorDown: isDown }
      };
    });
  };

  const handleToggleLight = (roomId) => {
    setRooms((prev) => {
      const newLight = !prev[roomId].lightState;
      addLog('MQTT', `PUBLISH batiment/${roomId}/actuateur/lumiere -> ${newLight ? 'ON' : 'OFF'}`);
      return {
        ...prev,
        [roomId]: { ...prev[roomId], lightState: newLight }
      };
    });
  };

  const handleForceRebalance = () => {
    const tA = rooms.salleA.temperature;
    const tB = rooms.salleB.temperature;
    const consensus = Math.round(((tA + tB) / 2) * 10) / 10;
    addLog('COORD', `Cycle de rééquilibrage forcé par l'administrateur.`);
    addLog('RMI', `Consensus appliqué : T_cible = ${consensus}°C sur Salle A et Salle B.`);
    setRooms((prev) => ({
      ...prev,
      salleA: { ...prev.salleA, consigne: consensus },
      salleB: { ...prev.salleB, consigne: consensus }
    }));
  };

  const handleRunScenario = (scenarioId) => {
    if (scenarioId === 'overheat_rebalance') {
      addLog('ALERT', `[SCÉNARIO 1 LANCÉ] Injection surchauffe Salle A (27.2°C) vs Salle B (19.8°C). Différentiel = 7.4°C`);
      setRooms((prev) => ({
        ...prev,
        salleA: { ...prev.salleA, temperature: 27.2 },
        salleB: { ...prev.salleB, temperature: 19.8 }
      }));
    } else if (scenarioId === 'eco_departure') {
      addLog('openHAB', `[SCÉNARIO 2 LANCÉ] Départ général des occupants. Activation du mode éco bâtiment.`);
      setRooms((prev) => {
        const next = { ...prev };
        for (const k of ['salleA', 'salleB', 'cuisine']) {
          next[k] = { ...next[k], isOccupied: false, consigne: 18.0, lightState: false };
        }
        return next;
      });
    } else if (scenarioId === 'sensor_timeout') {
      addLog('ALERT', `[SCÉNARIO 3 LANCÉ] Coupure du capteur Salle B. Test de la clause expire="30s,state=UNDEF".`);
      setRooms((prev) => ({
        ...prev,
        salleB: { ...prev.salleB, isSensorDown: true }
      }));
    } else if (scenarioId === 'reset_nominal') {
      addLog('COORD', `[SCÉNARIO 4 LANCÉ] Restauration complète des paramètres nominaux d'équilibre.`);
      setRooms(INITIAL_ROOMS);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Top Header */}
      <Header
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main View Switch */}
      {activeView === 'topology' ? (
        <ArchitectureTopology
          rooms={rooms}
          coordinatorStatus={autoBalanceActive}
        />
      ) : (
        <>
          {/* 1-Click Professor Demo Studio */}
          <DemoStudio onRunScenario={handleRunScenario} />

          {/* 2.5D Building Floor Plan */}
          <BuildingFloorPlan
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
          />

          {/* Coordinator Multi-Agent Panel */}
          <CoordinatorPanel
            rooms={rooms}
            onForceRebalance={handleForceRebalance}
            autoBalanceActive={autoBalanceActive}
            setAutoBalanceActive={setAutoBalanceActive}
          />

          {/* 3 Individual Room Telemetry & Controls */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {Object.values(rooms).map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onUpdateSetpoint={handleUpdateSetpoint}
                onTogglePresence={handleTogglePresence}
                onTriggerOverheat={handleTriggerOverheat}
                onToggleSensorFailure={handleToggleSensorFailure}
                onToggleLight={handleToggleLight}
              />
            ))}
          </div>

          {/* Real-Time SVG Telemetry Charts */}
          <TelemetryCharts history={history} />
        </>
      )}

      {/* Live Distributed Network Log Console */}
      <LiveConsole
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px 0',
        color: 'var(--text-muted)',
        fontSize: '0.78rem',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div>
          Projet SmartAgent-IoT • Université de Sherbrooke • IFT605 / IFT713 Systèmes répartis et multiagents
        </div>
        <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
          Architecture distribuée : MQTT Broker (1883) + openHAB REST (8080) + Java RMI (2199)
        </div>
      </footer>
    </div>
  );
}
