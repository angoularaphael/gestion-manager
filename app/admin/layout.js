import Link from 'next/link';
import { getSession } from '../../lib/session';

const NAV = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/managers', label: 'Managers' },
  { href: '/admin/envoyer', label: 'Envoyer' },
  { href: '/admin/whatsapp', label: 'WhatsApp' },
  { href: '/admin/utilisateurs', label: 'Utilisateurs' },
];

export default async function AdminLayout({ children }) {
  const user = await getSession();

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>🥊 Boxing Center</h1>
        <nav>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          {user?.email}
          <br />
          <form action="/api/auth/logout" method="post" style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
