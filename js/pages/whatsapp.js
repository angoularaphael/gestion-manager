import { api, apiPublic } from '../api.js';
import { dashboardShell, bindShellEvents, refreshWaStatusPill } from '../layout.js';
import { formatDate, escapeHtml } from '../utils.js';

async function fetchStatus() {
  return apiPublic('/api/status');
}

async function fetchUnread() {
  return api('/api/inbound-messages?unread=1');
}

function renderInboundList(messages) {
  if (!messages?.length) {
    return '<p class="empty-state">Aucun message non lu.</p>';
  }
  return messages.map((m) => `
    <div class="inbound-item" data-id="${m.id}">
      <div class="inbound-head">
        <strong>${escapeHtml(m.from_phone)}</strong>
        ${m.from_name ? `<span class="muted">(${escapeHtml(m.from_name)})</span>` : ''}
        <time>${formatDate(m.received_at)}</time>
      </div>
      <p class="inbound-body">${escapeHtml(m.body)}</p>
    </div>`).join('');
}

export async function renderWhatsapp() {
  let status = {};
  let unread = [];
  try {
    [status, { messages: unread }] = await Promise.all([fetchStatus(), fetchUnread()]);
  } catch (e) {
    console.error(e);
  }

  const stateLabel = status.connected
    ? 'Connecté'
    : status.connecting
      ? 'Connexion en cours'
      : 'Hors ligne';

  const content = `
    <div class="grid-2">
      <section class="card">
        <div class="card-header"><h2>Connexion WhatsApp</h2></div>
        <div class="wa-panel">
          <div class="wa-status-row">
            <div class="wa-indicator ${status.connected ? 'on' : status.connecting ? 'pending' : 'off'}"></div>
            <div>
              <p class="wa-state">${stateLabel}</p>
              <p class="muted" id="wa-detail">${status.connected
    ? `Admins autorisés : ${(status.authorizedPhones || []).join(', ')}`
    : status.qrError || 'Générez un QR code pour lier WhatsApp Business.'}</p>
            </div>
          </div>
          <div class="wa-actions">
            <button type="button" class="btn btn-primary" id="btn-start-qr">Générer QR</button>
            <button type="button" class="btn btn-danger" id="btn-wa-logout">Déconnexion WhatsApp</button>
          </div>
          <div id="qr-container" class="qr-container">
            ${status.qr ? `<img src="${status.qr}" alt="QR WhatsApp" />` : '<p class="muted">Cliquez « Générer QR » puis scannez avec WhatsApp.</p>'}
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h2>Messages entrants non lus</h2>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-mark-read" ${unread.length ? '' : 'disabled'}>Tout marquer lu</button>
        </div>
        <div id="inbound-list" class="inbound-list">${renderInboundList(unread)}</div>
      </section>
    </div>`;

  bindShellEvents();
  refreshWaStatusPill();
  setTimeout(() => bindWhatsappEvents(unread), 0);

  return dashboardShell('/dashboard/whatsapp', 'WhatsApp', content, {
    subtitle: 'Liaison du bot et messages entrants',
  });
}

function bindWhatsappEvents(unread) {
  let pollTimer = null;

  async function refresh() {
    const status = await fetchStatus();
    const detail = document.getElementById('wa-detail');
    const qrBox = document.getElementById('qr-container');
    if (detail) {
      detail.textContent = status.connected
        ? `Admins autorisés : ${(status.authorizedPhones || []).join(', ')}`
        : status.qrError || 'Générez un QR code pour lier WhatsApp Business.';
    }
    if (qrBox) {
      qrBox.innerHTML = status.qr
        ? `<img src="${status.qr}" alt="QR WhatsApp" />`
        : status.connected
          ? '<p class="muted">WhatsApp est connecté.</p>'
          : '<p class="muted">Cliquez « Générer QR » puis scannez avec WhatsApp.</p>';
    }
    refreshWaStatusPill();
  }

  document.getElementById('btn-start-qr')?.addEventListener('click', async () => {
    await api('/api/start', {
      method: 'POST',
      body: JSON.stringify({ method: 'qr' }),
    });
    setTimeout(refresh, 2000);
    if (!pollTimer) pollTimer = setInterval(refresh, 5000);
  });

  document.getElementById('btn-wa-logout')?.addEventListener('click', async () => {
    if (!confirm('Déconnecter WhatsApp du bot ?')) return;
    await api('/api/logout', { method: 'POST' });
    refresh();
  });

  document.getElementById('btn-mark-read')?.addEventListener('click', async () => {
    const ids = unread.map((m) => m.id);
    if (!ids.length) return;
    await api('/api/inbound-messages/mark-read', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    const { navigate } = await import('../router.js');
    navigate('/dashboard/whatsapp');
  });
}
