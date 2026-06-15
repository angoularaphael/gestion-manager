import OffreEteLanding from './OffreEteLanding';
import './offre-ete.css';

export const metadata = {
  title: 'Offre Été 2026 — 3 mois illimités à 89€ | Boxing Center',
  description:
    "Profitez de l'été 2026 au Boxing Center : 3 mois d'accès illimité à toutes les salles et disciplines pour 89€ au lieu de 150€.",
  openGraph: {
    title: 'Offre Été 2026 — Boxing Center',
    description: '3 mois illimités à 89€. Boxe, MMA, muay thaï — toutes salles, tous cours.',
    images: [{ url: '/offre-ete-2026/vignette.png', width: 1200, height: 630 }],
  },
};

export default function OffreEtePage() {
  return <OffreEteLanding />;
}
