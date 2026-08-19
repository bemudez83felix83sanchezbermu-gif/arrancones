import { useState } from 'react';
import { AlertCircle, ArrowLeft, BarChart3, RefreshCw, Users } from 'lucide-react';
import { EVENT } from '../data/event';
import { useParticipants } from '../lib/useParticipants';
import { Link } from '../router';
import ParticipantsView from '../components/admin/ParticipantsView';
import ReportsView from '../components/admin/ReportsView';
import { BUTTON } from '../components/admin/ui';

const TABS = [
  { id: 'participantes', label: 'Participantes', icon: Users },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
];

export default function Admin() {
  const { participants, loading, error, syncedAt, refresh, create, update, remove } =
    useParticipants();
  const [tab, setTab] = useState('participantes');

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="display text-2xl uppercase tracking-wide text-white">
                Panel de <span className="text-racing-red">participantes</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-white/35">
              {EVENT.name} · {EVENT.displayDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {syncedAt && (
              <span className="hidden text-xs text-white/35 sm:block">
                Actualizado{' '}
                {syncedAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              className={BUTTON.ghost}
              onClick={() => refresh({ silent: true })}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualizar
            </button>
            <Link to="/" className={BUTTON.subtle}>
              <ArrowLeft size={14} /> Sitio
            </Link>
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1400px] gap-1 px-4 md:px-8">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === id
                  ? 'border-racing-red text-white'
                  : 'border-transparent text-white/45 hover:text-white'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        {error && (
          <p className="mb-6 flex items-center gap-2 border border-racing-red/40 bg-racing-red/10 px-4 py-3 text-sm text-white">
            <AlertCircle size={18} className="shrink-0 text-racing-red" />
            {error}
            <button type="button" className={`${BUTTON.subtle} ml-auto`} onClick={() => refresh()}>
              Reintentar
            </button>
          </p>
        )}

        {tab === 'participantes' ? (
          <ParticipantsView
            participants={participants}
            loading={loading}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />
        ) : (
          <ReportsView participants={participants} />
        )}
      </main>
    </div>
  );
}
