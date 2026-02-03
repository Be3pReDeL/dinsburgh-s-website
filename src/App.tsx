import { useEffect, useState } from 'react';
import AdminApp from './admin/AdminApp';
import PublicApp from './PublicApp';

type AppRoute = {
  section: 'public' | 'admin';
};

const parseHashRoute = (hash: string): AppRoute => {
  const normalized = hash.replace(/^#/, '').trim();
  if (normalized.startsWith('/admin') || normalized.startsWith('admin')) {
    return { section: 'admin' };
  }
  return { section: 'public' };
};

const App = () => {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseHashRoute(window.location.hash)
  );

  useEffect(() => {
    const handleHashChange = () =>
      setRoute(parseHashRoute(window.location.hash));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route.section === 'admin') {
    return <AdminApp />;
  }

  return <PublicApp />;
};

export default App;
