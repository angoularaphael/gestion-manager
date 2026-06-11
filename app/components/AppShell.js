'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ADMIN_NAV, titleForPath } from '../../lib/adminNav';

export default function AppShell({ user, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const topbarTitle = titleForPath(pathname);

  return (
    <div className="app-shell">
      {open && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>Boxing Center</h1>
          <small className="brand-role">Administration</small>
        </div>

        <div className="sidebar-nav">
          {ADMIN_NAV.map((section) => (
            <div key={section.label} className="nav-section">
              <div className="nav-section-label">{section.label}</div>
              <div className="nav-section-links">
                {section.links.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== '/admin' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={active ? 'active' : ''}
                      onClick={() => setOpen(false)}
                    >
                      {link.text}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-label">Session</span>
            <strong>{user?.email || '—'}</strong>
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="btn-logout">
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <h2 className="topbar-title">{topbarTitle}</h2>
          <div className="topbar-user">{user?.email}</div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
