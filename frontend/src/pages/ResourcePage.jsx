import { useState } from 'react';
import {
  AlertTriangle, ArrowUpRight, Building2, CalendarDays, Layers3, MessageSquareText,
  Microscope, Plus, UsersRound, Wrench,
} from 'lucide-react';
import Notice from '../components/Notice.jsx';
import PageHeading from '../components/PageHeading.jsx';

const icons = {
  building: Building2,
  microscope: Microscope,
  layers: Layers3,
  message: MessageSquareText,
  users: UsersRound,
  wrench: Wrench,
  calendar: CalendarDays,
};

const missingRequirements = {
  laboratories: ['List laboratories', 'Create, update, and delete a laboratory', 'View laboratory details'],
  equipment: ['List and search equipment', 'Create, update, and delete equipment', 'Filter by laboratory, category, and status'],
  categories: ['List equipment categories', 'Create, update, and delete a category'],
  complaints: ['List and filter complaints by status and priority', 'Create a complaint and view its details'],
  assignments: ['List technicians and complaint assignments', 'Assign a technician and update assignment status'],
  repairs: ['List repair records', 'Create and update repair details'],
  maintenance: ['List and search maintenance records', 'Create a record and view equipment history'],
};

export default function ResourcePage({ resource }) {
  const [showRequirements, setShowRequirements] = useState(false);
  const Icon = icons[resource.icon] || AlertTriangle;
  const requirements = missingRequirements[resource.path] || [];

  return (
    <>
      <PageHeading
        title={resource.title}
        description={resource.description}
        action={
          <button className="button button-primary" onClick={() => setShowRequirements(true)}>
            <Plus size={17} /> Add {resource.singular}
          </button>
        }
      />

      <section className="resource-summary">
        <div className="resource-summary-icon"><Icon size={22} /></div>
        <div><strong>{resource.title}</strong><span>Management workspace</span></div>
        <div className="resource-summary-status"><span className="connection-dot" />API not connected</div>
      </section>

      <Notice tone="error" title={`${resource.title} API not available`}>
        The current Express backend does not provide endpoints for this feature. No sample records are shown, and changes are not saved.
      </Notice>

      <section className="panel resource-empty">
        <div className="empty-state-icon"><Icon size={25} /></div>
        <span className="empty-eyebrow">WAITING FOR BACKEND SUPPORT</span>
        <h2>No {resource.title.toLowerCase()} to display</h2>
        <p>Once the backend exposes the required REST APIs, this workspace can load and manage live records.</p>
        <button className="button button-secondary" onClick={() => setShowRequirements((shown) => !shown)}>
          {showRequirements ? 'Hide API requirements' : 'View API requirements'} <ArrowUpRight size={16} />
        </button>
      </section>

      {showRequirements && (
        <section className="panel requirements-panel">
          <div className="requirements-heading">
            <div className="requirements-mark"><AlertTriangle size={18} /></div>
            <div><h2>Backend APIs needed</h2><p>These are requirements only, not routes already implemented in the backend.</p></div>
          </div>
          <ul>{requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
          <p className="requirements-footnote">Route names and request fields should be agreed with the backend developer before API integration.</p>
        </section>
      )}
    </>
  );
}
