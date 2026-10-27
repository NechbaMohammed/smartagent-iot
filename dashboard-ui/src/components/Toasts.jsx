import { AlertTriangle, CheckCircle2, Info, X, XOctagon } from 'lucide-react';

const ICONS = { bad: XOctagon, warn: AlertTriangle, ok: CheckCircle2, info: Info };
const COLORS = { bad: 'var(--crimson)', warn: 'var(--amber)', ok: 'var(--emerald)', info: 'var(--cyan)' };

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.kind] || Info;
        return (
          <div key={t.id} className={`toast ${t.kind}`}>
            <Icon size={20} color={COLORS[t.kind]} style={{ flex: 'none', marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{t.title}</div>
              <div style={{ color: 'var(--text-2)', fontSize: '.82rem' }}>{t.msg}</div>
            </div>
            <button onClick={() => onDismiss(t.id)} style={{ background: 'none', border: 0, color: 'var(--text-3)', cursor: 'pointer', alignSelf: 'flex-start' }} aria-label="Fermer">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
