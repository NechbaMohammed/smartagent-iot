import { useEffect, useRef, useState } from 'react';

/** Nombre qui s'anime en douceur vers sa nouvelle valeur. */
export default function AnimatedNumber({ value, decimals = 1, suffix = '' }) {
  const valid = typeof value === 'number' && !Number.isNaN(value);
  const [shown, setShown] = useState(valid ? value : 0);
  const cur = useRef(valid ? value : 0);

  useEffect(() => {
    if (!valid) return undefined;
    const from = cur.current;
    const start = performance.now();
    const dur = 650;
    let raf;
    const tick = (n) => {
      const p = Math.min(1, (n - start) / dur);
      const e = 1 - (1 - p) ** 3;
      cur.current = from + (value - from) * e;
      setShown(cur.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, valid]);

  if (!valid) return <span>—</span>;
  return <span>{shown.toFixed(decimals)}{suffix}</span>;
}
