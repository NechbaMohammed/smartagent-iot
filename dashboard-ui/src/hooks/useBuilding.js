import { useCallback, useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt';

export const BROKER_WS = 'ws://localhost:9001';
export const OPENHAB_URL = 'http://localhost:8080/';
export const TIMEOUT_MS = 30000;
export const ECART_MAX = 4.0;
export const ROOM_ORDER = ['salleA', 'salleB', 'cuisine'];
export const ROOM_META = {
  salleA: { name: 'Salle A', label: 'Bureau', surface: '22 m²', rmi: 'agent-salleA' },
  salleB: { name: 'Salle B', label: 'Réunion', surface: '45 m²', rmi: 'agent-salleB' },
  cuisine: { name: 'Cuisine', label: 'Détente', surface: '18 m²', rmi: 'agent-cuisine' },
};

const INITIAL = {
  salleA: { temp: 21.8, lum: 390, occ: true, consigne: 21.0 },
  salleB: { temp: 20.4, lum: 430, occ: true, consigne: 20.5 },
  cuisine: { temp: 19.6, lum: 250, occ: false, consigne: 18.0 },
};

const round1 = (v) => Math.round(v * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hhmmss = () => new Date().toLocaleTimeString('fr-CA');

const makeRooms = () =>
  Object.fromEntries(
    ROOM_ORDER.map((id) => [id, { id, ...ROOM_META[id], ...INITIAL[id], lastSeen: Date.now(), lastMsg: 0, muted: false }])
  );

const seedHistory = () => {
  const now = Date.now();
  return Array.from({ length: 45 }, (_, i) => ({
    t: now - (45 - i) * 2000,
    salleA: round1(INITIAL.salleA.temp + Math.sin(i / 6) * 0.2),
    salleB: round1(INITIAL.salleB.temp + Math.cos(i / 7) * 0.2),
    cuisine: round1(INITIAL.cuisine.temp + Math.sin(i / 9) * 0.15),
  }));
};

export function useBuilding() {
  const [rooms, setRooms] = useState(makeRooms);
  const [history, setHistory] = useState(seedHistory);
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [coverage, setCoverage] = useState({});
  const [source, setSourceState] = useState('sim');
  const [mqttStatus, setMqttStatus] = useState('connecting');
  const [openhab, setOpenhab] = useState('unknown');
  const [autoBalance, setAutoBalance] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [rate, setRate] = useState(0);
  const [rateHistory, setRateHistory] = useState(() => Array(30).fill(0));

  const roomsRef = useRef(rooms);
  const sourceRef = useRef(source);
  const clientRef = useRef(null);
  const userForcedRef = useRef(false);
  const idRef = useRef(0);
  const msgCountRef = useRef(0);
  const lastCountRef = useRef(0);
  const staleRef = useRef({});
  const selfRef = useRef(new Set());
  const injRef = useRef({});
  const debRef = useRef({});
  const pendingEvRef = useRef(null);
  const lastRebalanceRef = useRef(0);
  const lastEcoRef = useRef(0);
  const lastOverheatRef = useRef(0);
  const autoBalanceRef = useRef(autoBalance);

  useEffect(() => { roomsRef.current = rooms; }, [rooms]);
  useEffect(() => { sourceRef.current = source; }, [source]);
  useEffect(() => { autoBalanceRef.current = autoBalance; }, [autoBalance]);

  /* ------------------------------ helpers ------------------------------ */
  const log = useCallback((cat, msg) => {
    idRef.current += 1;
    setLogs((prev) => [{ id: idRef.current, time: hhmmss(), cat, msg }, ...prev].slice(0, 300));
  }, []);

  const toast = useCallback((kind, title, msg) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((prev) => [...prev, { id, kind, title, msg }].slice(-4));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5200);
  }, []);
  const dismissToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  const mark = useCallback((key, forceLevel) => {
    setCoverage((c) => {
      const level = forceLevel || (sourceRef.current === 'live' ? 'live' : 'sim');
      if (c[key] === 'live' || c[key] === level) return c;
      return { ...c, [key]: level };
    });
  }, []);

  const markEvent = useCallback((label) => { pendingEvRef.current = label; }, []);

  const patchRoom = useCallback((id, patch) => {
    setRooms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  /* ------------------------------ MQTT out ------------------------------ */
  const publish = useCallback((topic, payload) => {
    const c = clientRef.current;
    if (!c || !c.connected) return false;
    selfRef.current.add(`${topic}|${payload}`);
    setTimeout(() => selfRef.current.delete(`${topic}|${payload}`), 3000);
    c.publish(topic, String(payload));
    return true;
  }, []);

  const inject = useCallback((room, type, value, secs = 22) => {
    const key = `${room}/${type}`;
    clearInterval(injRef.current[key]);
    const topic = `batiment/${room}/capteur/${type}`;
    publish(topic, value);
    let n = 0;
    injRef.current[key] = setInterval(() => {
      n += 1;
      publish(topic, value);
      if (n >= secs) clearInterval(injRef.current[key]);
    }, 1000);
  }, [publish]);

  const stopInjections = useCallback(() => {
    Object.values(injRef.current).forEach(clearInterval);
    injRef.current = {};
  }, []);

  /* ------------------------------ MQTT in ------------------------------ */
  const handleMessage = useCallback((topic, text) => {
    if (sourceRef.current !== 'live') return;
    msgCountRef.current += 1;
    const m = topic.match(/^batiment\/([^/]+)\/(capteur|actuateur)\/(.+)$/);
    if (!m) return;
    const [, id, kind, type] = m;
    const meta = ROOM_META[id];
    if (!meta) return;
    const room = roomsRef.current[id];
    const own = selfRef.current.has(`${topic}|${text}`);
    const t = Date.now();

    if (kind === 'capteur') {
      if (room.muted) return;
      mark('mqtt', 'live');
      if (type === 'temperature') {
        const v = parseFloat(text);
        if (Number.isNaN(v)) return;
        patchRoom(id, { temp: v, lastSeen: t, lastMsg: t });
        log('MQTT', `${topic} → ${v.toFixed(1)} °C${own ? '  (injecté)' : ''}`);
      } else if (type === 'luminosite') {
        const v = parseInt(text, 10);
        if (Number.isNaN(v)) return;
        patchRoom(id, { lum: v, lastSeen: t });
      } else if (type === 'occupation') {
        const occ = /^(true|on|1)$/i.test(text.trim());
        patchRoom(id, { occ, lastSeen: t });
        if (occ !== room.occ) log('MQTT', `${topic} → ${occ ? 'OCCUPÉE' : 'VIDE'}${own ? '  (injecté)' : ''}`);
      }
    } else if (kind === 'actuateur' && type === 'thermostat') {
      const v = parseFloat(text);
      if (Number.isNaN(v)) return;
      patchRoom(id, { consigne: v });
      if (own) return;
      mark('rmi', 'live');
      log('RMI', `setConsigneTemperature(${v.toFixed(1)}) → ${meta.rmi}`);
      const r = roomsRef.current;
      const diff = Math.abs(r.salleA.temp - r.salleB.temp);
      if (diff > ECART_MAX || t - lastOverheatRef.current < 25000) {
        mark('coord', 'live');
        markEvent('RMI');
        log('COORD', `Rééquilibrage appliqué sur ${meta.name} → ${v.toFixed(1)} °C`);
        toast('ok', 'Coordinateur RMI', `Consigne ${meta.name} → ${v.toFixed(1)} °C`);
      }
      if (v <= 18.5 && t - lastEcoRef.current < 20000) {
        mark('rules', 'live');
        log('openHAB', `Règle « économie d'énergie » appliquée sur ${meta.name} → ${v.toFixed(1)} °C`);
        toast('ok', 'Règle openHAB', `${meta.name} inoccupée → consigne éco ${v.toFixed(1)} °C`);
      }
    }
  }, [log, mark, markEvent, patchRoom, toast]);

  useEffect(() => {
    const client = mqtt.connect(BROKER_WS, {
      reconnectPeriod: 3000,
      connectTimeout: 4000,
      clientId: `dashboard-${Math.random().toString(16).slice(2, 8)}`,
    });
    clientRef.current = client;
    client.on('connect', () => {
      setMqttStatus('connected');
      client.subscribe('batiment/#');
    });
    client.on('reconnect', () => setMqttStatus((s) => (s === 'connected' ? 'connecting' : s)));
    client.on('close', () => setMqttStatus('error'));
    client.on('offline', () => setMqttStatus('error'));
    client.on('error', () => setMqttStatus('error'));
    client.on('message', (topic, payload) => handleMessage(topic, payload.toString()));
    return () => { client.end(true); };
  }, [handleMessage]);

  // Bascule automatique live / sim selon l'état du broker
  useEffect(() => {
    if (userForcedRef.current) return;
    if (mqttStatus === 'connected') {
      setRooms((prev) => Object.fromEntries(Object.entries(prev).map(([k, r]) => [k, { ...r, lastSeen: Date.now() }])));
      setSourceState('live');
      log('MQTT', `Connecté au broker réel ${BROKER_WS} — abonnement batiment/#`);
      toast('ok', 'Mode LIVE', 'Données réelles du broker Mosquitto.');
    } else if (mqttStatus === 'error') {
      if (sourceRef.current === 'live') toast('warn', 'Broker perdu', 'Bascule en mode simulation.');
      setRooms((prev) => Object.fromEntries(Object.entries(prev).map(([k, r]) => [k, { ...r, lastSeen: Date.now() }])));
      setSourceState('sim');
    }
  }, [mqttStatus, log, toast]);

  const setSource = useCallback((next) => {
    userForcedRef.current = true;
    if (next === 'live') {
      if (mqttStatus !== 'connected') {
        toast('warn', 'Broker inaccessible', `Impossible de joindre ${BROKER_WS}. Lancez scripts\\start-all.ps1`);
        return;
      }
      setRooms((prev) => Object.fromEntries(Object.entries(prev).map(([k, r]) => [k, { ...r, lastSeen: Date.now(), muted: false }])));
      log('MQTT', 'Source de données : broker réel (LIVE)');
    } else {
      stopInjections();
      setRooms((prev) => Object.fromEntries(Object.entries(prev).map(([k, r]) => [k, { ...r, lastSeen: Date.now() }])));
      log('SYS', 'Source de données : simulation locale');
    }
    setSourceState(next);
  }, [mqttStatus, log, stopInjections, toast]);

  /* --------------------------- openHAB probe --------------------------- */
  useEffect(() => {
    let alive = true;
    const probe = async () => {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 2000);
      try {
        await fetch(OPENHAB_URL, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
        if (alive) { setOpenhab('online'); mark('things', 'live'); }
      } catch {
        if (alive) setOpenhab('offline');
      } finally { clearTimeout(to); }
    };
    probe();
    const id = setInterval(probe, 8000);
    return () => { alive = false; clearInterval(id); };
  }, [mark]);

  /* ----------------------------- simulation ----------------------------- */
  useEffect(() => {
    if (source !== 'sim') return undefined;
    mark('mqtt', 'sim');
    mark('things', 'sim');
    const id = setInterval(() => {
      setRooms((prev) => {
        const next = {};
        Object.entries(prev).forEach(([k, r]) => {
          if (r.muted) { next[k] = r; return; }
          const drift = (r.consigne - r.temp) * 0.3;
          const noise = (Math.random() - 0.5) * 0.14;
          next[k] = {
            ...r,
            temp: round1(clamp(r.temp + drift + noise, 14, 32)),
            lum: clamp(r.lum + Math.round((Math.random() - 0.5) * 26), 80, 900),
            lastSeen: Date.now(),
            lastMsg: Date.now(),
          };
        });
        return next;
      });
      msgCountRef.current += 9;
    }, 2500);
    return () => clearInterval(id);
  }, [source, mark]);

  // Coordinateur simulé (même politique que CoordinateurBatiment.java)
  useEffect(() => {
    if (source !== 'sim') return undefined;
    const id = setInterval(() => {
      if (!autoBalanceRef.current) return;
      const r = roomsRef.current;
      const a = r.salleA; const b = r.salleB;
      if (a.muted || b.muted) return;
      const diff = Math.abs(a.temp - b.temp);
      const t = Date.now();
      if (diff > ECART_MAX && t - lastRebalanceRef.current > 12000) {
        lastRebalanceRef.current = t;
        const consensus = round1((a.temp + b.temp) / 2);
        log('ALERT', `Écart critique |${a.temp.toFixed(1)} − ${b.temp.toFixed(1)}| = ${diff.toFixed(1)} °C > ${ECART_MAX.toFixed(1)} °C`);
        log('COORD', `Consensus T_cible = (${a.temp.toFixed(1)} + ${b.temp.toFixed(1)}) / 2 = ${consensus.toFixed(1)} °C`);
        log('RMI', `agent-salleA.setConsigneTemperature(${consensus.toFixed(1)})`);
        log('RMI', `agent-salleB.setConsigneTemperature(${consensus.toFixed(1)})`);
        log('MQTT', `PUBLISH batiment/salleA/actuateur/thermostat → ${consensus.toFixed(1)}`);
        log('MQTT', `PUBLISH batiment/salleB/actuateur/thermostat → ${consensus.toFixed(1)}`);
        setRooms((prev) => ({
          ...prev,
          salleA: { ...prev.salleA, consigne: consensus },
          salleB: { ...prev.salleB, consigne: consensus },
        }));
        mark('rmi'); mark('coord'); markEvent('RMI');
        toast('ok', 'Coordinateur RMI', `Écart ${diff.toFixed(1)} °C corrigé → consigne ${consensus.toFixed(1)} °C`);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [source, log, mark, markEvent, toast]);

  /* ------------------------------- ticks ------------------------------- */
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const delta = msgCountRef.current - lastCountRef.current;
      lastCountRef.current = msgCountRef.current;
      setRate(delta);
      setRateHistory((h) => [...h.slice(1), delta]);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Détection du timeout capteur (30 s) -> UNDEF
  useEffect(() => {
    Object.values(roomsRef.current).forEach((r) => {
      const stale = now - r.lastSeen > TIMEOUT_MS;
      if (stale && !staleRef.current[r.id]) {
        staleRef.current[r.id] = true;
        log('openHAB', `expire="30s,state=UNDEF" → item ${r.id}_Temperature = UNDEF`);
        log('ALERT', `Timeout capteur ${r.name} (> 30 s sans message MQTT)`);
        toast('bad', 'Capteur en timeout', `${r.name} : état UNDEF après 30 s sans donnée.`);
        mark('fault');
        markEvent('UNDEF');
      } else if (!stale && staleRef.current[r.id]) {
        staleRef.current[r.id] = false;
        log('MQTT', `Reprise des trames de ${r.name} — état rétabli.`);
        toast('ok', 'Capteur rétabli', `${r.name} publie à nouveau.`);
      }
    });
  }, [now, log, mark, markEvent, toast]);

  // Échantillonnage de l'historique
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      const r = roomsRef.current;
      const val = (k) => (t - r[k].lastSeen > TIMEOUT_MS ? null : r[k].temp);
      const ev = pendingEvRef.current;
      pendingEvRef.current = null;
      setHistory((h) => [...h.slice(-119), { t, salleA: val('salleA'), salleB: val('salleB'), cuisine: val('cuisine'), ev }]);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  /* ------------------------------ actions ------------------------------ */
  const setConsigne = useCallback((id, v) => {
    patchRoom(id, { consigne: v });
    clearTimeout(debRef.current[id]);
    debRef.current[id] = setTimeout(() => {
      const meta = ROOM_META[id];
      if (sourceRef.current === 'live') publish(`batiment/${id}/actuateur/thermostat`, v.toFixed(1));
      else { log('MQTT', `PUBLISH batiment/${id}/actuateur/thermostat → ${v.toFixed(1)}`); mark('rmi'); }
      log('RMI', `${meta.rmi}.setConsigneTemperature(${v.toFixed(1)})  [manuel]`);
    }, 450);
  }, [log, mark, patchRoom, publish]);

  const triggerOverheat = useCallback((id, value = 27.2) => {
    const meta = ROOM_META[id];
    lastOverheatRef.current = Date.now();
    patchRoom(id, { temp: value, lastSeen: Date.now(), lastMsg: Date.now(), muted: false });
    if (sourceRef.current === 'live') inject(id, 'temperature', value.toFixed(1));
    log('MQTT', `PUBLISH batiment/${id}/capteur/temperature → ${value.toFixed(1)} °C  (injection)`);
    log('ALERT', `Pic de chaleur injecté dans ${meta.name} : ${value.toFixed(1)} °C`);
    toast('bad', 'Surchauffe injectée', `${meta.name} à ${value.toFixed(1)} °C`);
    markEvent('Surchauffe');
  }, [inject, log, markEvent, patchRoom, toast]);

  const setPresence = useCallback((id, occ) => {
    const meta = ROOM_META[id];
    if (!occ) lastEcoRef.current = Date.now();
    if (sourceRef.current === 'live') {
      patchRoom(id, { occ });
      inject(id, 'occupation', occ ? 'true' : 'false', 25);
      log('MQTT', `PUBLISH batiment/${id}/capteur/occupation → ${occ}  (injection)`);
      toast('info', occ ? 'Présence détectée' : 'Pièce vidée', `${meta.name} — en attente de la règle openHAB.`);
    } else {
      patchRoom(id, { occ, consigne: occ ? 21.0 : 18.0 });
      log('MQTT', `PUBLISH batiment/${id}/capteur/occupation → ${occ}`);
      log('openHAB', occ
        ? `Règle « confort » : ${meta.name} occupée → consigne 21.0 °C`
        : `Règle « économie d'énergie » : ${meta.name} inoccupée → consigne 18.0 °C`);
      mark('rules');
      toast('ok', 'Règle openHAB déclenchée', occ ? `${meta.name} → confort 21 °C` : `${meta.name} → éco 18 °C`);
    }
  }, [inject, log, mark, patchRoom, toast]);

  const togglePresence = useCallback((id) => setPresence(id, !roomsRef.current[id].occ), [setPresence]);

  const toggleSensor = useCallback((id) => {
    const r = roomsRef.current[id];
    if (!r.muted) {
      patchRoom(id, { muted: true });
      log('ALERT', `Capteur ${r.name} coupé — décompte du timeout 30 s démarré.`);
      toast('warn', 'Capteur coupé', `${r.name} : UNDEF dans 30 s.`);
    } else {
      patchRoom(id, { muted: false, lastSeen: Date.now() });
      log('MQTT', `Capteur ${r.name} rétabli.`);
    }
  }, [log, patchRoom, toast]);

  const runScenario = useCallback((key) => {
    if (key === 'rebalance') {
      triggerOverheat('salleA', 27.2);
      patchRoom('salleB', { temp: 19.8, lastSeen: Date.now(), lastMsg: Date.now() });
      if (sourceRef.current === 'live') inject('salleB', 'temperature', '19.8');
      log('ALERT', 'Scénario 1 : Salle A 27.2 °C vs Salle B 19.8 °C → écart 7.4 °C');
    } else if (key === 'eco') {
      setPresence('salleB', false);
    } else if (key === 'timeout') {
      const r = roomsRef.current.salleB;
      if (!r.muted) toggleSensor('salleB');
    } else if (key === 'reset') {
      stopInjections();
      lastRebalanceRef.current = 0;
      staleRef.current = {};
      const fresh = makeRooms();
      if (sourceRef.current === 'live') {
        setRooms((prev) => Object.fromEntries(Object.entries(prev).map(([k, r]) => [k, { ...r, muted: false, lastSeen: Date.now() }])));
        ROOM_ORDER.forEach((id) => publish(`batiment/${id}/actuateur/thermostat`, INITIAL[id].consigne.toFixed(1)));
      } else {
        setRooms(fresh);
      }
      log('SYS', 'Retour à l\'état nominal.');
      toast('info', 'État nominal', 'Capteurs rétablis, consignes réinitialisées.');
    }
  }, [inject, log, patchRoom, publish, setPresence, stopInjections, toast, toggleSensor, triggerOverheat]);

  const clearLogs = useCallback(() => setLogs([]), []);

  // Journal d'amorçage
  useEffect(() => {
    log('SYS', 'Superviseur SmartAgent-IoT initialisé.');
    log('MQTT', `Tentative de connexion au broker ${BROKER_WS} …`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pièces enrichies pour l'affichage
  const view = ROOM_ORDER.map((id) => {
    const r = rooms[id];
    const age = now - r.lastSeen;
    const stale = age > TIMEOUT_MS;
    return { ...r, stale, undefIn: stale ? 0 : Math.max(0, Math.ceil((TIMEOUT_MS - age) / 1000)), silent: age > 8000 };
  });

  return {
    rooms: view, history, logs, toasts, dismissToast, coverage,
    source, setSource, mqttStatus, openhab, rate, rateHistory, now,
    autoBalance, setAutoBalance,
    actions: { setConsigne, triggerOverheat, togglePresence, toggleSensor, runScenario, clearLogs },
  };
}
