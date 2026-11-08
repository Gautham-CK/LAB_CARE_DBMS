import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Building2, CalendarCheck2, ClipboardList, MessageSquareText,
  Microscope, Plus, Wrench,
} from 'lucide-react';
import Brand from '../components/Brand.jsx';
import Notice from '../components/Notice.jsx';
import PageHeading from '../components/PageHeading.jsx';
import { getBackendHealth } from '../services/api.js';

const metrics = [
  { label: 'Total laboratories', icon: Building2, tone: 'blue' },
  { label: 'Total equipment', icon: Microscope, tone: 'teal' },
  { label: 'Total complaints', icon: MessageSquareText, tone: 'violet' },
  { label: 'Pending complaints', icon: ClipboardList, tone: 'amber' },
  { label: 'Total repairs', icon: Wrench, tone: 'green' },
  { label: 'Maintenance records', icon: CalendarCheck2, tone: 'rose' },
];

export default function DashboardPage() {
  const [health, setHealth] = useState({ checking: true, connected: false, message: '' });

  useEffect(() => {
    let active = true;
    getBackendHealth()
      .then((message) => active && setHealth({ checking: false, connected: true, message: String(message) }))
      .catch(() => active && setHealth({ checking: false, connected: false, message: '' }));
    return () => { active = false; };
  }, []);

  return (
    <>
      <PageHeading
        eyebrow="LABCARE WORKSPACE"
        title="Good day, team"
        description="Here is the current view of your laboratory operations."
        action={<Link className="button button-primary" to="/complaints"><Plus size={17} /> Register a complaint</Link>}
      />

      <section className="welcome-banner">
        <div className="welcome-content">
          <span className="welcome-kicker">LABORATORY OPERATIONS</span>
          <h2>Equipment care, made clear.</h2>
          <p>Keep laboratories organized and equipment ready for the next experiment.</p>
          <Link className="banner-link" to="/equipment">Explore equipment <ArrowUpRight size={16} /></Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-ring art-ring-one" /><div className="art-ring art-ring-two" />
          <div className="art-icon"><Brand compact /></div>
          <span className="art-dot art-dot-one" /><span className="art-dot art-dot-two" />
        </div>
      </section>

      <div className="section-title-row">
        <div><h2 className="section-title">Operations at a glance</h2><p className="section-subtitle">Live totals will appear when the backend exposes reporting APIs.</p></div>
        <span className={`connection-pill${health.connected ? ' connection-online' : ''}`}>
          <span className="connection-dot" />{health.checking ? 'Checking backend' : health.connected ? 'Backend reachable' : 'Backend unavailable'}
        </span>
      </div>

      {!health.checking && !health.connected && (
        <Notice tone="error" title="Unable to reach the backend">
          Confirm the Express server is running at <code>{import.meta.env.VITE_API_URL || 'http://localhost:5000'}</code>. Dashboard data is not available until read APIs are implemented.
        </Notice>
      )}
      {!health.checking && health.connected && (
        <Notice tone="info" title="Backend connected">
          The health check responded ({health.message}). The backend currently provides registration only; operational totals and lists are not yet exposed.
        </Notice>
      )}

      <section className="metrics-grid" aria-label="Operations summary">
        {metrics.map(({ label, icon: Icon, tone }) => (
          <article className="metric-card" key={label}>
            <div className={`metric-icon metric-${tone}`}><Icon size={19} /></div>
            <span className="metric-trend"><span className="trend-dash" /></span>
            <p>{label}</p>
            <strong className="metric-value">—</strong>
            <small>{health.connected ? 'API not implemented' : 'Awaiting backend'}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-lower">
        <article className="panel recent-panel">
          <div className="panel-heading">
            <div><h2>Recent complaints</h2><p>Latest equipment issues reported</p></div>
            <Link to="/complaints" className="text-link">View complaints <ArrowUpRight size={15} /></Link>
          </div>
          <div className="empty-panel">
            <div className="empty-icon"><MessageSquareText size={21} /></div>
            <strong>No complaint records available</strong>
            <p>The backend does not yet expose a complaints endpoint.</p>
            <Link to="/complaints" className="subtle-link">View API requirements</Link>
          </div>
        </article>
        <article className="panel recent-panel">
          <div className="panel-heading">
            <div><h2>Recently added equipment</h2><p>Latest assets added to inventory</p></div>
            <Link to="/equipment" className="text-link">View equipment <ArrowUpRight size={15} /></Link>
          </div>
          <div className="empty-panel">
            <div className="empty-icon"><Microscope size={21} /></div>
            <strong>No equipment records available</strong>
            <p>The backend does not yet expose an equipment endpoint.</p>
            <Link to="/equipment" className="subtle-link">View API requirements</Link>
          </div>
        </article>
        <article className="panel health-panel">
          <div className="panel-heading">
            <div><h2>Equipment status</h2><p>Inventory status overview</p></div>
            <span className="panel-icon"><Microscope size={17} /></span>
          </div>
          <div className="status-empty">
            <div className="status-orbit"><Microscope size={25} /></div>
            <strong>Waiting for inventory data</strong>
            <p>Equipment status summaries will show here once an equipment API is available.</p>
            <Link to="/equipment" className="button button-secondary button-small">Open equipment</Link>
          </div>
        </article>
      </section>

      <section className="quick-actions">
        <div className="quick-title"><h2>Quick access</h2><p>Jump into a workspace</p></div>
        <div className="quick-links">
          <Link to="/laboratories"><Building2 size={17} /><span>Laboratories</span><ArrowUpRight size={15} /></Link>
          <Link to="/equipment"><Microscope size={17} /><span>Equipment</span><ArrowUpRight size={15} /></Link>
          <Link to="/maintenance"><CalendarCheck2 size={17} /><span>Maintenance</span><ArrowUpRight size={15} /></Link>
        </div>
      </section>
    </>
  );
}
