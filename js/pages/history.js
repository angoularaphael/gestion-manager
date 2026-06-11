import { api } from '../api.js';
import { dashboardShell, bindShellEvents, refreshWaStatusPill } from '../layout.js';
import { formatDate, escapeHtml } from '../utils.js';

export async function renderHistory() {
  let messages = [];
  try {
    const data = await api('/api/outbound-messages?limit=100');
    messages = data.messages || [];
  } catch (e) {
    console.error(e);
  }

  const rows = messages.map((m) => {
    const preview = (m.body || '').slice(0, 80);
    const mgr = m.managers?.nom ? ` (${m.managers.nom})` : '';
    return `<tr>
      <td>${formatDate(m.created_at)}</td>
      <td><span class="channel-tag ${m.channel}">${m.channel}</span></td>
      <td>${escapeHtml(m.recipient)}${escapeHtml(mgr)}</td>
      <td><span class="badge ${m.status}">${m.status}</span></td>
      <td class="preview-cell" title="${escapeHtml(m.body)}">${escapeHtml(preview)}${m.body?.length > 80 ? '…' : ''}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="5" class="empty">Aucun message sortant</td></tr>';

  const content = `
    <section class="card">
      <div class="card-header">
        <h2>Historique des envois</h2>
        <button type="button" class="btn btn-secondary btn-sm" id="hist-refresh">Actualiser</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Canal</th>
              <th>Destinataire</th>
              <th>Statut</th>
              <th>Aperçu</th>
            </tr>
          </thead>
          <tbody id="hist-body">${rows}</tbody>
        </table>
      </div>
      <p class="muted table-footer">${messages.length} message(s) affiché(s)</p>
    </section>`;

  bindShellEvents();
  refreshWaStatusPill();
  setTimeout(() => {
    document.getElementById('hist-refresh')?.addEventListener('click', async () => {
      const { navigate } = await import('../router.js');
      navigate('/dashboard/historique');
    });
  }, 0);

  return dashboardShell('/dashboard/historique', 'Historique', content, {
    subtitle: 'Journal des messages sortants',
  });
}
