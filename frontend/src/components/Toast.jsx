import { CheckCircle2, X, XCircle } from 'lucide-react';

export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const Icon = toast.tone === 'error' ? XCircle : CheckCircle2;
  return (
    <div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <Icon size={19} />
      <span>{toast.message}</span>
      <button className="icon-button toast-close" aria-label="Dismiss notification" onClick={onDismiss}>
        <X size={17} />
      </button>
    </div>
  );
}
