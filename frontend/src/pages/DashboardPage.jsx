
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Building2, CalendarCheck2, ClipboardList,
  MessageSquareText, Microscope, Plus, Wrench
} from 'lucide-react';

import Brand from '../components/Brand.jsx';
import Notice from '../components/Notice.jsx';
import PageHeading from '../components/PageHeading.jsx';
import { getBackendHealth, getDashboard, resourcesApi } from '../services/api.js';

const metrics = [
  { key: 'labs', label: 'Total laboratories', icon: Building2, tone: 'blue' },
  { key: 'equipment', label: 'Total equipment', icon: Microscope, tone: 'teal' },
  { key: 'complaints', label: 'Total complaints', icon: MessageSquareText, tone: 'violet' },
  { key: 'pendingComplaints', label: 'Pending complaints', icon: ClipboardList, tone: 'amber' },
  { key: 'repairs', label: 'Total repairs', icon: Wrench, tone: 'green' },
  { key: 'maintenance', label: 'Maintenance records', icon: CalendarCheck2, tone: 'rose' },
];

function getRows(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const results = await Promise.all([
          getDashboard(),
          resourcesApi.complaints.list(),
          resourcesApi.equipment.list(),
          getBackendHealth(),
        ]);

        if (!active) return;

        setStats(results[0]?.data || {});
        setComplaints(getRows(results[1]).slice(0, 5));
        setEquipment(getRows(results[2]).slice(0, 5));
        setError('');
      } catch (err) {
        if (active) {
          setError(err.response?.data?.error || err.message || 'Unable to load dashboard data');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const equipmentStatuses = equipment.reduce((result, item) => {
    const status = item.status || 'UNKNOWN';
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});

  return (
    <>
      <PageHeading
        eyebrow="LABCARE WORKSPACE"
        title="Good day, team"
        description="Here is the current view of your laboratory operations."
        action={
          <Link className="button button-primary" to="/complaints">
            <Plus size={17} /> Register a complaint
          </Link>
        }
      />

      <section className="welcome-banner">
        <div className="welcome-content">
          <span className="welcome-kicker">LABORATORY OPERATIONS</span>
          <h2>Equipment care, made clear.</h2>
          <p>Keep laboratories organized and equipment ready for the next experiment.</p>
          <Link className="banner-link" to="/equipment">
            Explore equipment <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="banner-art" aria-hidden="true">
          <div className="art-ring art-ring-one" />
          <div className="art-ring art-ring-two" />
          <div className="art-icon"><Brand compact /></div>
          <span className="art-dot art-dot-one" />
          <span className="art-dot art-dot-two" />
        </div>
      </section>

      <div className="section-title-row">
        <div>
          <h2 className="section-title">Operations at a glance</h2>
          <p className="section-subtitle">Live laboratory statistics from Supabase.</p>
        </div>

        <span className="connection-pill connection-online">
          <span className="connection-dot" />
          {loading ? 'Loading data' : error ? 'Data unavailable' : 'Backend connected'}
        </span>
      </div>

      {error && (
        <Notice tone="error" title="Unable to load dashboard">
          {error}
        </Notice>
      )}

      <section className="metrics-grid" aria-label="Operations summary">
        {metrics.map(({ key, label, icon: Icon, tone }) => (
          <article className="metric-card" key={key}>
            <div className={`metric-icon metric-${tone}`}>
              <Icon size={19} />
            </div>
            <span className="metric-trend">
              <span className="trend-dash" />
            </span>
            <p>{label}</p>
            <strong className="metric-value">
              {loading ? '...' : stats ? (stats[key] ?? 0) : '—'}
            </strong>
            <small>{loading ? 'Loading...' : error ? 'Unavailable' : 'Live data'}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-lower">
        <article className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent complaints</h2>
              <p>Latest equipment issues reported</p>
            </div>
            <Link to="/complaints" className="text-link">
              View complaints <ArrowUpRight size={15} />
            </Link>
          </div>

          {complaints.length > 0 ? (
            <div>
              {complaints.map((item, index) => (
                <div className="panel-heading" key={item.complaint_id || index}>
                  <div>
                    <strong>{item.issue_type || 'Equipment issue'}</strong>
                    <p>{item.description || 'No description'}</p>
                  </div>
                  <span>{item.status || 'UNKNOWN'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <div className="empty-icon"><MessageSquareText size={21} /></div>
              <strong>{loading ? 'Loading complaints...' : 'No complaints available'}</strong>
              <p>New equipment complaints will appear here.</p>
              <Link to="/complaints" className="subtle-link">View complaints</Link>
            </div>
          )}
        </article>

        <article className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Recently added equipment</h2>
              <p>Latest assets in inventory</p>
            </div>
            <Link to="/equipment" className="text-link">
              View equipment <ArrowUpRight size={15} />
            </Link>
          </div>

          {equipment.length > 0 ? (
            <div>
              {equipment.map((item, index) => (
                <div className="panel-heading" key={item.equipment_id || index}>
                  <div>
                    <strong>{item.equipment_name || item.name || 'Equipment'}</strong>
                    <p>{item.asset_tag || 'No asset tag'}</p>
                  </div>
                  <span>{item.status || 'UNKNOWN'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <div className="empty-icon"><Microscope size={21} /></div>
              <strong>{loading ? 'Loading equipment...' : 'No equipment available'}</strong>
              <p>Added equipment will appear here.</p>
              <Link to="/equipment" className="subtle-link">View equipment</Link>
            </div>
          )}
        </article>

        <article className="panel health-panel">
          <div className="panel-heading">
            <div>
              <h2>Equipment status</h2>
              <p>Inventory status overview</p>
            </div>
            <span className="panel-icon"><Microscope size={17} /></span>
          </div>

          <div className="status-empty">
            <div className="status-orbit"><Microscope size={25} /></div>
            {loading ? (
              <strong>Loading equipment status...</strong>
            ) : (
              <>
                <strong>Equipment overview</strong>
                {Object.entries(equipmentStatuses).length > 0 ? (
                  Object.entries(equipmentStatuses).map(([status, count]) => (
                    <p key={status}>{status}: {count}</p>
                  ))
                ) : (
                  <p>No equipment status data available.</p>
                )}
              </>
            )}
            <Link to="/equipment" className="button button-secondary button-small">
              Open equipment
            </Link>
          </div>
        </article>
      </section>

      <section className="quick-actions">
        <div className="quick-title">
          <h2>Quick access</h2>
          <p>Jump into a workspace</p>
        </div>
        <div className="quick-links">
          <Link to="/laboratories"><Building2 size={17} /><span>Laboratories</span><ArrowUpRight size={15} /></Link>
          <Link to="/equipment"><Microscope size={17} /><span>Equipment</span><ArrowUpRight size={15} /></Link>
          <Link to="/maintenance"><CalendarCheck2 size={17} /><span>Maintenance</span><ArrowUpRight size={15} /></Link>
        </div>
      </section>
    </>
  );
}
