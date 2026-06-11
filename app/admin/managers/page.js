import { botFetch } from '../../../lib/bot';

export default async function ManagersPage({ searchParams }) {
  const q = searchParams?.q || '';
  const type = searchParams?.type || '';
  let managers = [];
  let error = '';
  try {
    const qs = new URLSearchParams();
    if (q) qs.set('search', q);
    if (type) qs.set('contact_type', type);
    const data = await botFetch(`/api/managers?${qs}`);
    managers = data.managers || [];
  } catch (e) {
    error = e.message;
  }

  return (
    <>
      <h1>Managers</h1>
      <form className="card" method="get">
        <input name="q" placeholder="Rechercher un nom…" defaultValue={q} />
        <select name="type" defaultValue={type}>
          <option value="">Tous</option>
          <option value="both">Email + tél.</option>
          <option value="phone_only">Téléphone seul</option>
          <option value="email_only">Email seul</option>
        </select>
        <button type="submit" className="btn">Filtrer</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <table>
          <thead>
            <tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Localisation</th></tr>
          </thead>
          <tbody>
            {managers.map((m) => (
              <tr key={m.id}>
                <td>{m.nom}</td>
                <td>{m.email || '—'}</td>
                <td>{m.telephone || '—'}</td>
                <td>{m.localisation || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: '0.75rem', color: '#64748b' }}>{managers.length} manager(s)</p>
      </div>
    </>
  );
}
