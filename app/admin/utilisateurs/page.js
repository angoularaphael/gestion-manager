import { getSession } from '../../../lib/session';
import { listUsers } from '../../../lib/auth';
import { roleLabel } from '../../../lib/roles';
import UserForm from './user-form';
import { UserDeleteButton } from './user-actions';

function formatPhone(phone) {
  if (!phone) return '—';
  return phone.startsWith('+') ? phone : `+${phone}`;
}

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
      <h1>Administrateurs</h1>

      <UserForm />

      <div className="card">
        <h2 className="section-title">Comptes actifs</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr className="row-super-admin">
                <td>—</td>
                <td>Super administrateur</td>
                <td>—</td>
                <td>
                  <span className="badge super">{roleLabel('super_admin')}</span>
                </td>
                <td />
              </tr>
              {users.map((u) => (
                <tr key={u.email}>
                  <td>{u.email}</td>
                  <td>{u.name || '—'}</td>
                  <td>{formatPhone(u.phone)}</td>
                  <td>
                    <span className="badge">{roleLabel(u.role)}</span>
                  </td>
                  <td>
                    <UserDeleteButton email={u.email} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    Aucun administrateur équipe pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
