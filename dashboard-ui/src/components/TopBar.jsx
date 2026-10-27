import { useEffect, useState } from 'react';
import { Radio, Cpu, Server, Maximize2, Clock, FlaskConical, Zap } from 'lucide-react';

const TITLES = {
  cockpit: ['Cockpit du bâtiment', 'Supervision temps réel · MQTT + openHAB + Java RMI'],
  topology: ['Topologie répartie', 'Flux de données entre capteurs, broker, agents et coordinateur'],
  demo: ['Démo guidée', 'Script de soutenance de 10 minutes, étape par étape'],
  journal: ['Journal des flux', 'Chaque message MQTT, appel RMI et règle openHAB'],
};

export default function TopBar({ view, source, setSource, mqttStatus, openhab, coverage, agentsSeen }) {
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const [title, sub] = TITLES[view];

  const mqttChip = mqttStatus === 'connected' ? 'ok' : mqttStatus === 'error' ? 'bad' : 'warn';
  const mqttText = mqttStatus === 'connected' ? 'MQTT :1883 · WS :9001' : mqttStatus === 'error' ? 'Broker hors ligne' : 'Connexion…';
  const ohChip = openhab === 'online' ? 'ok' : openhab === 'offline' ? 'warn' : '';
  const ohText = openhab === 'online' ? 'openHAB :8080' : openhab === 'offline' ? 'openHAB simulé' : 'openHAB …';
  const rmiOk = coverage.rmi === 'live' || agentsSeen;

  return (
    <header className="topbar">
      <div className="title-block">
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="top-actions">
        <span className={`chip ${mqttChip}`} id="chip-mqtt"><span className="dot pulse" /><Radio size={13} />{mqttText}</span>
        <span className={`chip ${ohChip}`} id="chip-openhab"><span className="dot" /><Server size={13} />{ohText}</span>
        <span className={`chip ${rmiOk ? 'violet' : ''}`} id="chip-rmi"><span className="dot" /><Cpu size={13} />RMI :2199</span>
        <span className="chip mono"><Clock size={13} />{clock.toLocaleTimeString('fr-CA')}</span>
        <div className="seg" role="group" aria-label="Source de données">
          <button id="src-live" className={source === 'live' ? 'on-live' : ''} onClick={() => setSource('live')}>
            <Zap size={14} />LIVE
          </button>
          <button id="src-sim" className={source === 'sim' ? 'on-sim' : ''} onClick={() => setSource('sim')}>
            <FlaskConical size={14} />SIMULATION
          </button>
        </div>
        <button className="btn sm" id="btn-fullscreen" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())} title="Plein écran">
          <Maximize2 size={14} />
        </button>
      </div>
    </header>
  );
}
