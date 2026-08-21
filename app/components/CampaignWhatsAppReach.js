'use client';

import { campaignReachFromStats, formatFrInt, formatFrRate } from '../../lib/campaignDisplayStats';

export default function CampaignWhatsAppReach({ stats, kind = 'balma' }) {
  if (!stats) return null;
  const reach = campaignReachFromStats(stats, kind);
  const wa = reach.whatsapp;

  return (
    <section className="metric-band metric-band--green campaign-wa-reach">
      <header className="metric-band-header">
        <h3 className="metric-band-title">Messages WhatsApp partis</h3>
        <span className="metric-band-subtitle">Volume complet · lectures</span>
      </header>
      <div className="metric-band-row metric-band-row--3">
        <div className="metric-cell">
          <span className="metric-label">Volume complet</span>
          <strong className="metric-value">{formatFrInt(wa.volume)}</strong>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Lectures</span>
          <strong className="metric-value">{formatFrInt(wa.reads)}</strong>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Taux de lecture</span>
          <strong className="metric-value metric-value--rate">{formatFrRate(wa.rate)}</strong>
        </div>
      </div>
    </section>
  );
}
