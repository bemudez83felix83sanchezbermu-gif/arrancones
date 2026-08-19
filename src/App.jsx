import { Suspense, lazy } from 'react';
import { useRoute, Link } from './router';
import Landing from './pages/Landing';

const Register = lazy(() => import('./pages/Register'));
const Admin = lazy(() => import('./pages/Admin'));

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-racing-red" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="display text-7xl text-racing-red">404</span>
      <p className="text-white/60">Esta página no existe.</p>
      <Link to="/" className="btn-racing mt-2">
        Volver al inicio
      </Link>
    </div>
  );
}

export default function App() {
  const path = useRoute();

  const page =
    path === '/' ? (
      <Landing />
    ) : path === '/registro' ? (
      <Register />
    ) : path === '/admin' ? (
      <Admin />
    ) : (
      <NotFound />
    );

  return (
    <div className="min-h-screen bg-racing-asphalt text-white">
      <Suspense fallback={<Loading />}>{page}</Suspense>
    </div>
  );
}
