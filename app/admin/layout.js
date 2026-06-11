import { getSession } from '../../lib/session';
import AdminNav from '../components/AdminNav';

export default async function AdminLayout({ children }) {
  const user = await getSession();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🥊</span>
          <div>
            <h1>Boxing Center</h1>
            <small>Console managers</small>
          </div>
        </div>
        <AdminNav />
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
