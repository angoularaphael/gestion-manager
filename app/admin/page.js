import { botFetch } from '../../lib/bot';

export default async function DashboardPage() {
  let stats = {};
  let status = {};
  try {
    stats = await botFetch('/api/managers/stats');
    status = await botFetch('/api/status');
  } catch (e) {
    stats = { error: e.message };
  }

  return (
    <>
      <h1>Tableau de bord</h1>
      {stats.error && <p className="error">Bot : {stats.error}</p>}
      <div className="grid" style={{ marginTop: '1rem' }}>
        <div className="card stat"><span className="muted">Managers</span><strong>{stats.total ?? '—'}</strong></div>
        <div className="card stat"><span className="muted">Avec tél.</span><strong>{stats.withPhone ?? '—'}</strong></div>
        <div className="card stat"><span className="muted">Avec email</span><strong>{stats.withEmail ?? '—'}</strong></div>
        <div className="card stat"><span className="muted">Les deux</span><strong>{stats.both ?? '—'}</strong></div>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>WhatsApp</h2>
        <p>
          Statut :{' '}
          <span className={`badge ${status.connected ? 'ok' : 'err'}`}>
            {status.connected ? 'Connecté' : 'Déconnecté'}
          </span>
        </p>
        <a href="/admin/whatsapp" className="btn">Gérer WhatsApp</a>
      </div>
    </>
  );
}
