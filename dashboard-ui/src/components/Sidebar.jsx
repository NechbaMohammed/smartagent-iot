import { Activity, LayoutDashboard, Network, ScrollText, Presentation } from 'lucide-react';

const ITEMS = [
  { id: 'cockpit', label: 'Cockpit', Icon: LayoutDashboard },
  { id: 'topology', label: 'Topologie répartie', Icon: Network },
  { id: 'demo', label: 'Démo guidée', Icon: Presentation },
  { id: 'journal', label: 'Journal des flux', Icon: ScrollText },
];

export default function Sidebar({ view, setView }) {
  return (
    <aside className="sidebar">
      <div className="brand-mark"><Activity size={24} color="#fff" /></div>
      {ITEMS.map(({ id, label, Icon }) => (
        <button key={id} id={`nav-${id}`} className={`nav-btn ${view === id ? 'active' : ''}`} onClick={() => setView(id)} aria-label={label}>
          <Icon size={22} />
          <span className="tip">{label}</span>
        </button>
      ))}
    </aside>
  );
}
