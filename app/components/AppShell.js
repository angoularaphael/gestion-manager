'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ADMIN_NAV, titleForPath } from '../../lib/adminNav';
import BurgerIcon from './BurgerIcon';
import InstallPwa from './InstallPwa';
import LogoutButton from './LogoutButton';

export default function AppShell({ user, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const topbarTitle = titleForPath(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function closeSidebar() {
    setOpen(false);
  }

  function toggleSidebar() {
    setOpen((v) => !v);
  }

  return (
    <div className={`app-shell ${open ? 'sidebar-open' : ''}`}>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <Image src="/logo.png" alt="Boxing Center" width={140} height={36} className="brand-logo" priority />
            <small className="brand-role">Administration</small>
          </div>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Fermer le menu"
            onClick={closeSidebar}
          >
            ×
          </button>
        </div>

        <div className="sidebar-nav">
          {ADMIN_NAV.map((section) => (
            <div key={section.label} className="nav-section">
              <div className="nav-section-label">{section.label}</div>
              <div className="nav-section-links">
                {section.links.map((link) => {
                  if (link.superAdminOnly && user?.role !== 'super_admin') return null;
                  const active =
                    pathname === link.href ||
                    (link.href !== '/admin' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={active ? 'active' : ''}
                      onClick={closeSidebar}
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
          <InstallPwa />
          <div className="sidebar-user">
            <span className="sidebar-user-label">Session</span>
            <strong>{user?.email || '—'}</strong>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            onClick={toggleSidebar}
          >
            <BurgerIcon />
          </button>
          <h2 className="topbar-title">{topbarTitle}</h2>
          <div className="topbar-user">{user?.email}</div>
        </header>

        {open && (
          <button
            type="button"
            className="sidebar-overlay"
            aria-label="Fermer le menu"
            onClick={closeSidebar}
          />
        )}

        <main className="main">{children}</main>
      </div>
    </div>
  );
}
