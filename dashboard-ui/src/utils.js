/** Palette thermique : bleu glacé -> émeraude (confort) -> ambre -> rouge (alerte). */
export function heatHue(t) {
  const stops = [[16, 205], [19, 190], [21, 158], [23.5, 85], [25.5, 35], [28, 0]];
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [a, ha] = stops[i];
    const [b, hb] = stops[i + 1];
    if (t <= b) return ha + ((hb - ha) * (t - a)) / (b - a);
  }
  return 0;
}

export const heatColor = (t, s = 88, l = 56, a = 1) => `hsla(${heatHue(t)}, ${s}%, ${l}%, ${a})`;

export const CAT_COLORS = {
  MQTT: '#22d3ee',
  RMI: '#a78bfa',
  openHAB: '#fbbf24',
  COORD: '#34d399',
  ALERT: '#f43f5e',
  SYS: '#94a3b8',
};

export const SERIES = {
  salleA: { color: '#22d3ee', label: 'Salle A' },
  salleB: { color: '#fbbf24', label: 'Salle B' },
  cuisine: { color: '#34d399', label: 'Cuisine' },
};
