import DashboardStats from '../components/DashboardStats';
import BotStatus from '../components/BotStatus';
import OffreEteBoutiqueClicksStat from '../components/OffreEteBoutiqueClicksStat';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <header className="page-header dashboard-page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="page-subtitle mobile-page-subtitle">Vue d&apos;ensemble Boxing Center</p>
        </div>
      </header>

      <DashboardStats />
      <div className="grid stats-grid" style={{ marginBottom: '1.25rem' }}>
        <OffreEteBoutiqueClicksStat />
      </div>
      <BotStatus />
    </div>
  );
}
