'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV, titleForPath } from '../../lib/adminNav';
import InstallPwa from './InstallPwa';
import LogoutButton from './LogoutButton';
import MobileAppHeader from './MobileAppHeader';
import MobileBottomNav from './MobileBottomNav';

export default function AppShell({ user, children }) {
  const pathname = usePathname();
  const topbarTitle = titleForPath(pathname);

  return (
    <div className="app-shell">
      <aside className="sidebar desktop-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <Image src="/logo.png" alt="Boxing Center" width={140} height={36} className="brand-logo" priority />
            <small className="brand-role">Administration</small>
          </div>
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
                    <Link key={link.href} href={link.href} className={active ? 'active' : ''}>
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
        <MobileAppHeader />

        <header className="app-topbar desktop-topbar">
          <h2 className="topbar-title">{topbarTitle}</h2>
          <div className="topbar-user">{user?.email}</div>
        </header>

        <main className="main app-main-content">{children}</main>

        <MobileBottomNav pathname={pathname} user={user} />
      </div>
    </div>
  );
}
