import { FlaskConical } from 'lucide-react';

export default function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <span className="brand-mark"><FlaskConical size={21} strokeWidth={2.2} /></span>
      {!compact && (
        <span className="brand-copy">
          <strong>LabCare</strong>
          <small>LAB OPERATIONS</small>
        </span>
      )}
    </div>
  );
}
