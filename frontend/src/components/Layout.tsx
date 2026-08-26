import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ui/ThemeToggle';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: '🏠', exact: true },
  { to: '/empresas', label: 'Empresas', icon: '🏢', exact: false },
];

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Inicio';
  if (pathname.startsWith('/empresas') && pathname.includes('/proyectos')) return 'Proyectos';
  if (pathname.startsWith('/empresas')) return 'Empresas';
  return 'CPM Dashboard';
}

function useIsMobile(breakpoint = 1023): boolean {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return isMobile;
}

function Layout() {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Desktop: sidebar colapsado a íconos. Móvil: sidebar oculto por defecto.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cierra el menú móvil al navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Al pasar a móvil, asegurar que el menú empiece cerrado.
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);

  const isActive = (item: (typeof NAV_ITEMS)[number]) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  const toggleMenu = () => {
    if (isMobile) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  };

  const layoutClass = [
    'layout',
    !isMobile && collapsed ? 'is-collapsed' : '',
    isMobile && mobileOpen ? 'is-mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={layoutClass}>
      <aside className="sidebar">
        <div className="sidebar__header">
          <span className="sidebar__logo">CPM</span>
          <h1 className="sidebar__title">CPM Dashboard</h1>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar__link${isActive(item) ? ' is-active' : ''}`}
              title={item.label}
            >
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar__footer">Company Project Management</div>
      </aside>

      {/* Overlay para cerrar el menú en móvil */}
      <button
        type="button"
        className="layout__overlay"
        aria-label="Cerrar menú"
        onClick={() => setMobileOpen(false)}
      />

      <div className="layout__main">
        <header className="topbar">
          <button
            type="button"
            className="topbar__toggle"
            onClick={toggleMenu}
            aria-label={
              isMobile
                ? mobileOpen
                  ? 'Cerrar menú'
                  : 'Abrir menú'
                : collapsed
                  ? 'Expandir menú'
                  : 'Colapsar menú'
            }
            aria-expanded={isMobile ? mobileOpen : !collapsed}
          >
            ☰
          </button>
          <h2 className="topbar__title">{getPageTitle(location.pathname)}</h2>
          <div className="topbar__spacer" />
          <ThemeToggle />
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
