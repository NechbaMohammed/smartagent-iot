import { useState } from 'react';
import { Network, Radio, Server, Cpu, Scale, Thermometer } from 'lucide-react';

const NODE_W = 200; const NODE_H = 88;

const INFO = {
  sensors: { title: 'Capteurs IoT simulés', tech: 'sensor-simulator · CapteurSimulateur (Eclipse Paho)', proto: 'MQTT 3.1.1 · TCP 1883', body: 'Un thread par pièce publie toutes les 5 s : batiment/{piece}/capteur/temperature, luminosite, occupation → 9 flux au total.' },
  broker: { title: 'Broker Eclipse Mosquitto', tech: 'Mosquitto 2.1 · listeners 1883 (TCP) et 9001 (WebSocket)', proto: 'MQTT pub/sub', body: 'Découple capteurs et consommateurs. Le port WebSocket 9001 permet à ce dashboard React de s\'abonner à batiment/# directement depuis le navigateur.' },
  openhab: { title: 'Passerelle openHAB', tech: 'Things MQTT · Items (expire="30s,state=UNDEF") · Rules DSL', proto: 'MQTT binding · REST :8080', body: 'Persiste l\'état du bâtiment, expire les capteurs muets après 30 s et applique les règles : économie d\'énergie quand une pièce est vide, alerte de surchauffe.' },
  agents: { title: 'Agents de pièce (Java RMI)', tech: 'AgentPieceImpl · IAgentPiece · registre :2199', proto: 'Java RMI', body: 'Un objet distant par pièce : getTemperature(), getLuminosite(), isOccupee(), setConsigneTemperature(). Chaque agent s\'abonne au MQTT et publie la consigne sur actuateur/thermostat.' },
  coord: { title: 'Coordinateur d\'étage', tech: 'CoordinateurBatiment · lookup RMI', proto: 'Java RMI · cycle 5 s', body: 'Compare les pièces adjacentes. Si |ΔT| > 4 °C, calcule un consensus et appelle setConsigneTemperature() sur les agents. Capture RemoteException sans s\'arrêter (tolérance aux pannes).' },
};

function Node({ id, x, y, Icon, color, title, sub, status, selected, onClick }) {
  const sc = status === 'ok' ? '#34d399' : status === 'bad' ? '#f43f5e' : status === 'warn' ? '#fbbf24' : '#64748b';
  return (
    <g id={`node-${id}`} transform={`translate(${x},${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect width={NODE_W} height={NODE_H} rx="18" fill="rgba(10,16,34,.95)" stroke={selected ? color : 'rgba(148,163,184,.25)'} strokeWidth={selected ? 2.5 : 1.5}
        style={{ filter: selected ? `drop-shadow(0 0 16px ${color})` : 'none', transition: 'all .25s' }} />
      <rect x="16" y="22" width="44" height="44" rx="13" fill={`${color}24`} />
      <g transform="translate(26,32)"><Icon size={24} color={color} /></g>
      <text x="72" y="40" fill="#fff" fontSize="15" fontWeight="700" className="svg-text">{title}</text>
      <text x="72" y="60" fill="#94a3b8" fontSize="11.5">{sub}</text>
      <circle cx={NODE_W - 18} cy="18" r="5" fill={sc} style={{ filter: `drop-shadow(0 0 5px ${sc})` }} />
    </g>
  );
}

function Edge({ d, color, label, lx, ly, dim, dur = 2.2, packets = 2 }) {
  return (
    <g opacity={dim ? 0.25 : 1}>
      <path d={d} fill="none" stroke={color} strokeOpacity=".4" strokeWidth="2" className={dim ? '' : 'flow'} />
      {!dim && Array.from({ length: packets }).map((_, i) => (
        <circle key={i} r="4.5" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} begin={`${(i * dur) / packets}s`} />
        </circle>
      ))}
      <text x={lx} y={ly} fill={color} fontSize="11" fontWeight="700" textAnchor="middle" className="mono" style={{ paintOrder: 'stroke', stroke: '#070b16', strokeWidth: 4 }}>{label}</text>
    </g>
  );
}

export default function Topology({ rooms, mqttStatus, openhab, coverage, rate }) {
  const [sel, setSel] = useState('broker');
  const brokerSt = mqttStatus === 'connected' ? 'ok' : mqttStatus === 'error' ? 'bad' : 'warn';
  const ohSt = openhab === 'online' ? 'ok' : 'warn';
  const rmiSt = coverage.rmi === 'live' ? 'ok' : 'idle';
  const info = INFO[sel];
  const ys = [40, 206, 372];

  return (
    <div className="card view-enter" id="topology-card">
      <div className="card-head">
        <div className="card-title">
          <div className="ico" style={{ background: 'rgba(167,139,250,.16)', color: 'var(--violet)' }}><Network size={19} /></div>
          <div>
            <h2>Architecture distribuée en fonctionnement</h2>
            <p>Les paquets animés suivent les vrais chemins MQTT et RMI · cliquez un composant pour le détail</p>
          </div>
        </div>
        <span className="chip info mono">{rate} msg/s sur le broker</span>
      </div>

      <svg viewBox="0 0 1000 480" className="svg-fluid">
        {rooms.map((r, i) => (
          <Edge key={r.id} d={`M${20 + NODE_W} ${ys[i] + 44} C 320 ${ys[i] + 44}, 330 250, 400 250`} color="#22d3ee" dim={r.stale || r.muted}
            label={i === 1 ? 'MQTT publish' : ''} lx={310} ly={ys[i] + 38} dur={2 + i * 0.3} />
        ))}
        <Edge d="M600 232 C 690 232, 690 84, 770 84" color="#fbbf24" label="MQTT binding" lx={690} ly={150} />
        <Edge d="M600 252 L770 252" color="#22d3ee" label="subscribe batiment/#" lx={685} ly={242} dur={1.8} />
        <Edge d="M770 276 C 690 276, 690 280, 600 280" color="#34d399" label="actuateur/thermostat" lx={685} ly={300} dur={2.6} />
        <Edge d="M870 296 L870 372" color="#a78bfa" label="RMI" lx={892} ly={338} dur={1.6} />
        <Edge d="M850 372 L850 296" color="#a78bfa" label="" lx={0} ly={0} dur={1.9} />

        {rooms.map((r, i) => (
          <Node key={r.id} id={`sensor-${r.id}`} x={20} y={ys[i]} Icon={Thermometer} color="#22d3ee" title={`Capteurs ${r.name}`}
            sub={r.stale ? 'timeout · UNDEF' : r.muted ? 'coupé (supervision)' : `${r.temp.toFixed(1)} °C · ${r.lum} lux`}
            status={r.stale ? 'bad' : r.muted ? 'warn' : 'ok'} selected={sel === 'sensors'} onClick={() => setSel('sensors')} />
        ))}
        <Node id="broker" x={400} y={200} Icon={Radio} color="#22d3ee" title="Mosquitto" sub="1883 TCP · 9001 WS" status={brokerSt} selected={sel === 'broker'} onClick={() => setSel('broker')} />
        <Node id="openhab" x={770} y={40} Icon={Server} color="#fbbf24" title="openHAB" sub="Items · Rules · REST :8080" status={ohSt} selected={sel === 'openhab'} onClick={() => setSel('openhab')} />
        <Node id="agents" x={770} y={206} Icon={Cpu} color="#a78bfa" title="Agents RMI" sub="agent-salleA · B · cuisine" status={rmiSt} selected={sel === 'agents'} onClick={() => setSel('agents')} />
        <Node id="coord" x={770} y={372} Icon={Scale} color="#34d399" title="Coordinateur" sub="ΔT > 4 °C → consensus" status={rmiSt} selected={sel === 'coord'} onClick={() => setSel('coord')} />
      </svg>

      <div style={{ marginTop: 10, padding: '16px 20px', borderRadius: 14, background: 'rgba(0,0,0,.28)', border: '1px solid var(--line-strong)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{info.title}</strong>
          <span className="chip info">{info.proto}</span>
        </div>
        <div style={{ marginBottom: 6 }}><span className="tag">{info.tech}</span></div>
        <div style={{ color: 'var(--text-2)', fontSize: '.9rem' }}>{info.body}</div>
      </div>
    </div>
  );
}
