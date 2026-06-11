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
    if (!open) {
      document.body.style.overflow = '';
      return undefined;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className={`app-shell ${open ? 'sidebar-open' : ''}`}>
      {open && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <Image src="/logo.png" alt="Boxing Center" width={140} height={36} className="brand-logo" priority />
            <small className="brand-role">Administration</small>
          </div>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
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
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <BurgerIcon />
          </button>
          <h2 className="topbar-title">{topbarTitle}</h2>
          <div className="topbar-user">{user?.email}</div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
