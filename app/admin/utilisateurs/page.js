import { getSession } from '../../../lib/session';
import { listUsers } from '../../../lib/auth';
import UserForm from './user-form';

export default async function UtilisateursPage() {
  const session = await getSession();
  if (session?.role !== 'super_admin') {
    return <p className="error">Réservé au super administrateur.</p>;
  }

  let users = [];
  try {
    users = await listUsers();
  } catch (e) {
    return <p className="error">{e.message}</p>;
  }

  return (
    <>
      <h1>Utilisateurs</h1>
      <UserForm />
      <div className="card">
        <table>
          <thead><tr><th>Email</th><th>Nom</th><th>Rôle</th></tr></thead>
          <tbody>
            <tr><td>{process.env.SUPER_ADMIN_EMAIL}</td><td>Super Admin</td><td>super_admin</td></tr>
            {users.map((u) => (
              <tr key={u.email}><td>{u.email}</td><td>{u.name || '—'}</td><td>{u.role}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
