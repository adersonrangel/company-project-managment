import { Outlet, Link, useLocation } from 'react-router-dom';

function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          padding: '1.5rem 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
            CPM Dashboard
          </h1>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <NavLink to="/" label="Inicio" active={location.pathname === '/'} />
          <NavLink to="/empresas" label="Empresas" active={isActive('/empresas')} />
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: '0.625rem 1.5rem',
        textDecoration: 'none',
        color: active ? '#ffffff' : '#94a3b8',
        backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
        borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
        fontSize: '0.875rem',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </Link>
  );
}

export default Layout;
