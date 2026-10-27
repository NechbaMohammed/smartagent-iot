import { useState } from 'react';
import { Flame, LogOut, WifiOff, RotateCcw, Rocket } from 'lucide-react';
import { useBuilding } from './hooks/useBuilding.js';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import Toasts from './components/Toasts.jsx';
import KpiStrip from './components/KpiStrip.jsx';
import FloorPlan from './components/FloorPlan.jsx';
import CoordinatorCard from './components/CoordinatorCard.jsx';
import RoomControls from './components/RoomControls.jsx';
import TelemetryChart from './components/TelemetryChart.jsx';
import CoverageTracker from './components/CoverageTracker.jsx';
import EventConsole from './components/EventConsole.jsx';
import Topology from './components/Topology.jsx';
import DemoConductor from './components/DemoConductor.jsx';

function QuickScenarios({ run }) {
  const items = [
    { k: 'rebalance', label: 'Surchauffe → équilibrage RMI', Icon: Flame, cls: 'danger' },
    { k: 'eco', label: 'Départ Salle B → règle éco', Icon: LogOut, cls: '' },
    { k: 'timeout', label: 'Panne capteur → UNDEF 30 s', Icon: WifiOff, cls: 'warn' },
    { k: 'reset', label: 'État nominal', Icon: RotateCcw, cls: '' },
  ];
  return (
    <div className="card" id="quick-scenarios">
      <div className="card-head" style={{ marginBottom: 12 }}>
        <div className="card-title">
          <div className="ico" style={{ background: 'rgba(244,63,94,.14)', color: 'var(--pink)' }}><Rocket size={19} /></div>
          <div><h2>Scénarios 1-clic</h2><p>Valident le barème en direct</p></div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(({ k, label, Icon, cls }) => (
          <button key={k} id={`scenario-${k}`} className={`btn ${cls}`} style={{ justifyContent: 'flex-start' }} onClick={() => run(k)}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const b = useBuilding();
  const [view, setView] = useState('cockpit');
  const [selected, setSelected] = useState('salleA');
  const { rooms, history, logs, coverage, actions } = b;

  const onDemoAction = (action) => {
    const [type, arg] = action.split(':');
    if (type === 'nav') setView(arg);
    else actions.runScenario(arg);
  };

  return (
    <>
      <div className="ambient"><div className="ambient-grid" /></div>
      <Toasts toasts={b.toasts} onDismiss={b.dismissToast} />
      <div className="shell">
        <Sidebar view={view} setView={setView} />
        <main className="main">
          <TopBar view={view} source={b.source} setSource={b.setSource} mqttStatus={b.mqttStatus} openhab={b.openhab} coverage={coverage} />

          {view === 'cockpit' && (
            <div className="view-enter">
              <KpiStrip rooms={rooms} history={history} rate={b.rate} rateHistory={b.rateHistory} />
              <div className="grid g-main">
                <FloorPlan rooms={rooms} selected={selected} onSelect={setSelected} rate={b.rate} />
                <div className="grid" style={{ gap: 20 }}>
                  <CoordinatorCard rooms={rooms} logs={logs} source={b.source} autoBalance={b.autoBalance} setAutoBalance={b.setAutoBalance} />
                  <QuickScenarios run={actions.runScenario} />
                </div>
              </div>
              <RoomControls rooms={rooms} history={history} selected={selected} onSelect={setSelected} actions={actions} source={b.source} />
              <div className="grid g-main">
                <TelemetryChart history={history} />
                <CoverageTracker coverage={coverage} />
              </div>
              <EventConsole logs={logs} onClear={actions.clearLogs} />
            </div>
          )}

          {view === 'topology' && (
            <div className="view-enter">
              <Topology rooms={rooms} mqttStatus={b.mqttStatus} openhab={b.openhab} coverage={coverage} rate={b.rate} />
              <div style={{ height: 20 }} />
              <EventConsole logs={logs} onClear={actions.clearLogs} height={200} />
            </div>
          )}

          {/* Toujours monté pour conserver le chrono entre les vues */}
          <div className="view-enter" style={{ display: view === 'demo' ? 'grid' : 'none', gridTemplateColumns: 'minmax(360px, 1fr) minmax(0, 1.5fr)', gap: 20, alignItems: 'start' }}>
            <DemoConductor onAction={onDemoAction} />
            <div className="grid" style={{ gap: 20 }}>
              <FloorPlan rooms={rooms} selected={selected} onSelect={setSelected} rate={b.rate} />
              <div className="grid g-main" style={{ marginBottom: 0 }}>
                <CoordinatorCard rooms={rooms} logs={logs} source={b.source} autoBalance={b.autoBalance} setAutoBalance={b.setAutoBalance} />
                <CoverageTracker coverage={coverage} />
              </div>
            </div>
          </div>

          {view === 'journal' && (
            <div className="view-enter grid g-main">
              <EventConsole logs={logs} onClear={actions.clearLogs} height={640} />
              <CoverageTracker coverage={coverage} />
            </div>
          )}

          <footer style={{ textAlign: 'center', padding: '28px 0 0', color: 'var(--text-3)', fontSize: '.78rem' }}>
            SmartAgent-IoT · Université de Sherbrooke · IFT605 / IFT713 — MQTT · openHAB · Java RMI
          </footer>
        </main>
      </div>
    </>
  );
}
