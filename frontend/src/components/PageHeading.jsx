import { ChevronRight } from 'lucide-react';

export default function PageHeading({ eyebrow = 'WORKSPACE', title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="breadcrumb">{eyebrow}<ChevronRight size={13} /><span>{title}</span></div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}
