import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Loader2, Lock, LogIn } from 'lucide-react';
import { EVENT } from '../data/event';
import { useAuth } from '../lib/useAuth';
import { Link, navigate } from '../router';

export default function Login() {
  const { admin, status, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'authed' && admin) navigate('/admin');
  }, [status, admin]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login({ username, password });
      navigate('/admin');
    } catch (err) {
      setError(err.message ?? 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 20%, rgba(230,57,70,0.18), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={14} /> Volver al sitio
        </Link>

        <div className="border border-white/10 bg-[#141414] p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-racing-red/60 bg-racing-red/15">
              <Lock size={20} className="text-racing-red" />
            </div>
            <div>
              <h1 className="display text-2xl uppercase text-white">
                Panel <span className="text-racing-red">admin</span>
              </h1>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                {EVENT.name}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Usuario
              </span>
              <input
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full border border-white/15 bg-[#0F0F0F] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-racing-red focus:ring-1 focus:ring-racing-red/30"
                placeholder="admin_esteban@gmail.com"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Contraseña
              </span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full border border-white/15 bg-[#0F0F0F] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-racing-red focus:ring-1 focus:ring-racing-red/30"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="flex items-center gap-2 border border-racing-red/40 bg-racing-red/10 px-3 py-2 text-sm text-white">
                <AlertCircle size={16} className="shrink-0 text-racing-red" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 bg-racing-red px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Validando…
                </>
              ) : (
                <>
                  <LogIn size={16} /> Iniciar sesión
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-white/30">
          Acceso restringido · ALP Racing
        </p>
      </motion.div>
    </div>
  );
}
