import { api, apiPublic } from '../api.js';
import { dashboardShell, bindShellEvents, refreshWaStatusPill } from '../layout.js';
import { formatDate, escapeHtml } from '../utils.js';

export async function renderDashboard() {
  let stats = { total: 0, withPhone: 0, withEmail: 0, both: 0, none: 0 };
  let outbound = [];
  let unreadCount = 0;
  let waStatus = { connected: false, connecting: false };

  try {
    [stats, { messages: outbound }, { messages: unread }, waStatus] = await Promise.all([
      api('/api/managers/stats'),
      api('/api/outbound-messages?limit=8'),
      api('/api/inbound-messages?unread=1'),
      apiPublic('/api/status'),
    ]);
    unreadCount = unread?.length || 0;
  } catch (e) {
    console.error(e);
  }

  const recentRows = (outbound || []).slice(0, 6).map((m) => `
    <tr>
      <td>${formatDate(m.created_at)}</td>
      <td><span class="channel-tag ${m.channel}">${m.channel}</span></td>
      <td>${escapeHtml(m.recipient)}</td>
      <td><span class="badge ${m.status}">${m.status}</span></td>
    </tr>`).join('') || '<tr><td colspan="4" class="empty">Aucun message récent</td></tr>';

  const content = `
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Managers total</span>
        <span class="stat-value">${stats.total}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Avec téléphone</span>
        <span class="stat-value">${stats.withPhone}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Avec email</span>
        <span class="stat-value">${stats.withEmail}</span>
      </div>
      <div class="stat-card highlight">
        <span class="stat-label">Tél + email</span>
        <span class="stat-value">${stats.both}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Sans contact</span>
        <span class="stat-value">${stats.none}</span>
      </div>
      <div class="stat-card ${unreadCount ? 'alert' : ''}">
        <span class="stat-label">Messages non lus</span>
        <span class="stat-value">${unreadCount}</span>
      </div>
    </div>

    <div class="grid-2">
      <section class="card">
        <div class="card-header">
          <h2>État WhatsApp</h2>
          <a href="/dashboard/whatsapp" data-nav class="link-sm">Gérer →</a>
        </div>
        <div class="wa-overview">
          <div class="wa-indicator ${waStatus.connected ? 'on' : waStatus.connecting ? 'pending' : 'off'}"></div>
          <div>
            <p class="wa-state">${waStatus.connected ? 'Connecté et opérationnel' : waStatus.connecting ? 'Connexion en cours…' : 'Non connecté'}</p>
            <p class="muted">Scannez le QR depuis l'onglet WhatsApp pour lier le bot.</p>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h2>Actions rapides</h2>
        </div>
        <div class="quick-actions">
          <a href="/dashboard/envoyer" data-nav class="btn btn-primary">Nouveau message</a>
          <a href="/dashboard/managers" data-nav class="btn btn-secondary">Voir managers</a>
          <a href="/dashboard/historique" data-nav class="btn btn-ghost">Historique</a>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card-header">
        <h2>Messages sortants récents</h2>
        <a href="/dashboard/historique" data-nav class="link-sm">Tout voir →</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Canal</th><th>Destinataire</th><th>Statut</th></tr>
          </thead>
          <tbody>${recentRows}</tbody>
        </table>
      </div>
    </section>`;

  bindShellEvents();
  refreshWaStatusPill();
  return dashboardShell('/dashboard', 'Tableau de bord', content, {
    subtitle: 'Vue d\'ensemble de la plateforme messagerie',
  });
}
