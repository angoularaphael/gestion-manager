import DashboardStats from '../components/DashboardStats';
import BotStatus from '../components/BotStatus';
import OffreEteBoutiqueClicksStat from '../components/OffreEteBoutiqueClicksStat';
import Link from 'next/link';
import { getSession } from '../../lib/session';

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="dashboard-page">
      <header className="page-header dashboard-page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="page-subtitle mobile-page-subtitle">Vue d&apos;ensemble Boxing Center</p>
        </div>
      </header>

      {session?.role === 'super_admin' ? (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <p style={{ margin: 0 }}>
            <strong>Super administrateur</strong>
            {' — '}
            <Link href="/admin/utilisateurs">Créer / gérer les accès administrateurs</Link>
            {' · '}
            <Link href="/admin/offre-ete">Offre été 2026</Link>
          </p>
        </div>
      ) : null}

      <DashboardStats />
      <div className="grid stats-grid" style={{ marginBottom: '1.25rem' }}>
        <OffreEteBoutiqueClicksStat />
      </div>
      <BotStatus />
    </div>
  );
}
