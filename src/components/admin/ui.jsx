import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { CATEGORIES, STATUSES } from '../../../shared/participants';

export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`surface-card border border-white/10 bg-[#141414] ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-white/45">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatTile({ label, value, hint, hero = false, accent }) {
  return (
    <div className="surface-card border border-white/10 bg-[#141414] px-5 py-4">
      <span className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</span>
      <p
        className={`mt-1 font-semibold leading-none text-white ${hero ? 'text-5xl' : 'text-3xl'}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

export function CategoryBadge({ id }) {
  const category = CATEGORIES[id];
  if (!category) return null;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-white">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: category.chart }}
        aria-hidden="true"
      />
      {category.label}
    </span>
  );
}

const STATUS_STYLE = {
  confirmado: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  pendiente: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  cancelado: 'border-white/15 bg-white/5 text-white/50',
};

export function StatusBadge({ id }) {
  const status = STATUSES[id];
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[id]}`}
    >
      {status.label}
    </span>
  );
}

export function Modal({ open, onClose, title, subtitle, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Cerrar"
        className="fixed inset-0 -z-10 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`my-8 w-full border border-white/15 bg-[#141414] shadow-2xl ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="display text-2xl uppercase text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-white/45">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 transition hover:text-white"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, busy }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex gap-3">
        <AlertTriangle size={22} className="mt-0.5 shrink-0 text-racing-red" />
        <p className="text-sm text-white/70">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className={BUTTON.ghost}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className={BUTTON.danger}>
          {busy ? 'Eliminando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export const BUTTON = {
  primary:
    'inline-flex items-center justify-center gap-2 bg-racing-red px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50',
  ghost:
    'inline-flex items-center justify-center gap-2 border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white disabled:opacity-50',
  danger:
    'inline-flex items-center justify-center gap-2 border border-racing-red/60 bg-racing-red/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-racing-red/30 disabled:opacity-50',
  subtle:
    'inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white',
};

export const INPUT =
  'w-full border border-white/15 bg-[#0F0F0F] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-racing-red focus:ring-1 focus:ring-racing-red/30';

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {Icon && <Icon size={34} className="text-white/20" />}
      <p className="text-lg font-medium text-white">{title}</p>
      {message && <p className="max-w-sm text-sm text-white/45">{message}</p>}
      {action}
    </div>
  );
}
