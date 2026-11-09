
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Layers3,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Microscope,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';

import Brand from '../components/Brand.jsx';

const navigation = [
  { label: 'Overview', path: '/', icon: LayoutDashboard, end: true },
  { label: 'Laboratories', path: '/laboratories', icon: Building2 },
  { label: 'Equipment', path: '/equipment', icon: Microscope },
  { label: 'Categories', path: '/categories', icon: Layers3 },
];

const serviceNavigation = [
  { label: 'Complaints', path: '/complaints', icon: MessageSquareText },
  { label: 'Assignments', path: '/assignments', icon: UsersRound },
  { label: 'Repairs', path: '/repairs', icon: Wrench },
  { label: 'Maintenance', path: '/maintenance', icon: CalendarDays },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
];

const pageTitles = {
  '/': 'Overview',
  '/laboratories': 'Laboratories',
  '/equipment': 'Equipment',
  '/categories': 'Categories',
  '/complaints': 'Complaints',
  '/assignments': 'Technician assignments',
  '/repairs': 'Repairs',
  '/maintenance': 'Maintenance history',
  '/reports': 'Reports & Analytics',
};

function NavigationGroup({ label, items, onNavigate }) {
  return (
    <div className="nav-group">
      <p className="nav-label">{label}</p>

      {items.map(({ label: itemLabel, path, icon: Icon, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `nav-link${isActive ? ' active' : ''}`
          }
        >
          <Icon size={18} strokeWidth={1.8} />
          <span>{itemLabel}</span>
        </NavLink>
      ))}
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>

        <div className="sidebar-brand">
          <Brand />

          <button
            className="icon-button sidebar-close"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-icon">
            <Activity size={18} />
          </div>

          <div>
            <strong>Research campus</strong>
            <small>Operations workspace</small>
          </div>

          <ChevronDown size={15} className="muted-icon" />
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">

          <NavigationGroup
            label="WORKSPACE"
            items={navigation}
            onNavigate={() => setSidebarOpen(false)}
          />

          <NavigationGroup
            label="SERVICE & CARE"
            items={serviceNavigation}
            onNavigate={() => setSidebarOpen(false)}
          />

        </nav>

        <div className="sidebar-bottom">

          <div className="help-card">
            <span className="help-icon">
              <ClipboardList size={17} />
            </span>

            <div>
              <strong>Backend setup</strong>
              <small>Connect your API to enable data.</small>
            </div>
          </div>

          <div className="profile-row">
            <div className="avatar">LC</div>

            <div className="profile-copy">
              <strong>LabCare user</strong>
              <small>Workspace</small>
            </div>

            <ChevronDown size={15} className="muted-icon" />
          </div>

        </div>
      </aside>

      <main className="main-panel">

        <header className="topbar">

          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="topbar-title">
            <Microscope size={17} />
            <span>
              {pageTitles[location.pathname] || 'LabCare'}
            </span>
          </div>

          <div className="topbar-right">
            <span className="topbar-date">
              Laboratory management
            </span>

            <div className="topbar-avatar">LC</div>
          </div>

        </header>

        <div className="content-area">
          <Outlet />
        </div>

        <footer className="app-footer">
          <span>
            LabCare <span className="footer-dot">·</span> Laboratory operations
          </span>
          <span>Frontend preview</span>
        </footer>

      </main>
    </div>
  );
}
