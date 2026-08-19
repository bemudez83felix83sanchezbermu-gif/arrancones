import { useEffect, useState } from 'react';

const EVENT_NAME = 'app:navigate';

export function navigate(to) {
  if (to === window.location.pathname) return;
  window.history.pushState({}, '', to);
  window.dispatchEvent(new Event(EVENT_NAME));
  window.scrollTo({ top: 0 });
}

export function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/');

  useEffect(() => {
    const sync = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/');
    window.addEventListener('popstate', sync);
    window.addEventListener(EVENT_NAME, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(EVENT_NAME, sync);
    };
  }, []);

  return path;
}

export function Link({ to, children, ...props }) {
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={onClick} {...props}>
      {children}
    </a>
  );
}
