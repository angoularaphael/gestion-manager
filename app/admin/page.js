import DashboardStats from '../components/DashboardStats';
import BotStatus from '../components/BotStatus';
import Link from 'next/link';
import { getSession } from '../../lib/session';

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="dashboard-page">
      <header className="page-header dashboard-page-header">
        <div>
          <p className="page-eyebrow">Boxing Center</p>
          <h1>Tableau de bord</h1>
          <p className="page-subtitle mobile-page-subtitle">Vue d&apos;ensemble des contacts et des bots</p>
        </div>
      </header>

      {session?.role === 'super_admin' ? (
        <div className="dashboard-admin-strip">
          <div>
            <strong>Super administrateur</strong>
            <span>Gérer les accès à la console</span>
          </div>
          <Link href="/admin/utilisateurs" className="btn ghost btn-sm">
            Administrateurs
          </Link>
        </div>
      ) : null}

      <DashboardStats />
      <BotStatus />
    </div>
  );
}
