import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const icons = {
  info: Info,
  error: AlertCircle,
  success: CheckCircle2,
};

export default function Notice({ tone = 'info', title, children }) {
  const Icon = icons[tone] || Info;
  return (
    <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={19} />
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}
