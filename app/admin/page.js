import DashboardStats from '../components/DashboardStats';
import BotStatus from '../components/BotStatus';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="page-subtitle">Vue d&apos;ensemble Boxing Center</p>
        </div>
      </header>

      <DashboardStats />
      <BotStatus />
    </div>
  );
}
