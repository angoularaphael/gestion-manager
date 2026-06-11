import { api } from '../api.js';
import { store, setTestOnly, clearSelection } from '../store.js';
import { dashboardShell, bindShellEvents, refreshWaStatusPill } from '../layout.js';
import { escapeHtml } from '../utils.js';
import { navigate } from '../router.js';

export async function renderComposer() {
  const selectedCount = store.testOnly ? 1 : store.selectedIds.size;
  const recipientLabel = store.testOnly
    ? 'Mode test : atangana'
    : selectedCount
      ? `${selectedCount} manager(s) sélectionné(s)`
      : 'Aucun destinataire — sélectionnez dans Managers ou utilisez le test';

  const content = `
    <div class="grid-2 compose-layout">
      <section class="card">
        <div class="card-header"><h2>Nouveau message</h2></div>
        <div class="form-stack">
          <div class="field">
            <label>Destinataires</label>
            <div class="recipient-bar">
              <span class="recipient-info ${selectedCount || store.testOnly ? 'ok' : 'warn'}">${recipientLabel}</span>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-test-atangana">Test atangana</button>
              <a href="/dashboard/managers" data-nav class="btn btn-ghost btn-sm">Choisir managers</a>
            </div>
          </div>
          <div class="field">
            <label>Canaux d'envoi</label>
            <div class="channel-checks">
              <label class="check-pill"><input type="checkbox" id="ch-whatsapp" checked /> WhatsApp</label>
              <label class="check-pill"><input type="checkbox" id="ch-email" /> Email</label>
            </div>
          </div>
          <div class="field">
            <label for="subject">Objet (email)</label>
            <input type="text" id="subject" placeholder="Objet du message email" />
          </div>
          <div class="field">
            <label for="message">Message</label>
            <textarea id="message" rows="10" placeholder="Rédigez votre message…"></textarea>
            <span class="field-hint">Le message sera envoyé via les canaux sélectionnés.</span>
          </div>
          <button type="button" class="btn btn-primary btn-lg" id="btn-send">Envoyer le message</button>
          <div id="send-result" class="alert hidden"></div>
        </div>
      </section>

      <section class="card">
        <div class="card-header"><h2>Aide</h2></div>
        <ul class="help-list">
          <li><strong>Test atangana</strong> — Envoie uniquement au manager test (+237693646080 / linuxcam05@gmail.com).</li>
          <li><strong>WhatsApp</strong> — Nécessite que le bot soit connecté (onglet WhatsApp).</li>
          <li><strong>Email</strong> — Envoyé via Brevo avec l'expéditeur Boxing Center.</li>
          <li>Sélectionnez plusieurs managers depuis l'onglet <a href="/dashboard/managers" data-nav>Managers</a>.</li>
        </ul>
        <div class="info-box">
          <p class="muted">Manager test</p>
          <p>WhatsApp : +237693646080</p>
          <p>Email : linuxcam05@gmail.com</p>
        </div>
      </section>
    </div>`;

  bindShellEvents();
  refreshWaStatusPill();
  setTimeout(bindComposerEvents, 0);
  return dashboardShell('/dashboard/envoyer', 'Envoyer', content, {
    subtitle: 'Composer et envoyer des messages',
  });
}

function bindComposerEvents() {
  document.getElementById('btn-test-atangana')?.addEventListener('click', () => {
    setTestOnly(true);
    document.querySelector('.recipient-info').textContent = 'Mode test : atangana';
    document.querySelector('.recipient-info').className = 'recipient-info ok';
  });

  document.getElementById('btn-send')?.addEventListener('click', async () => {
    const message = document.getElementById('message').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const channels = [];
    if (document.getElementById('ch-whatsapp').checked) channels.push('whatsapp');
    if (document.getElementById('ch-email').checked) channels.push('email');
    const resultEl = document.getElementById('send-result');
    const btn = document.getElementById('btn-send');

    resultEl.classList.add('hidden');

    if (!message) {
      resultEl.className = 'alert alert-error';
      resultEl.textContent = 'Le message ne peut pas être vide.';
      resultEl.classList.remove('hidden');
      return;
    }
    if (!channels.length) {
      resultEl.className = 'alert alert-error';
      resultEl.textContent = 'Sélectionnez au moins un canal.';
      resultEl.classList.remove('hidden');
      return;
    }
    if (!store.testOnly && !store.selectedIds.size) {
      resultEl.className = 'alert alert-error';
      resultEl.textContent = 'Sélectionnez des managers ou utilisez le test atangana.';
      resultEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';
    try {
      const data = await api('/api/send-to-managers', {
        method: 'POST',
        body: JSON.stringify({
          message,
          subject,
          channels,
          test_only: store.testOnly,
          manager_ids: store.testOnly ? [] : [...store.selectedIds],
        }),
      });
      resultEl.className = 'alert alert-success';
      resultEl.innerHTML = `
        <strong>Envoi terminé</strong><br>
        WhatsApp : ${data.whatsapp.sent} réussi, ${data.whatsapp.failed} échec<br>
        Email : ${data.email.sent} réussi, ${data.email.failed} échec
        ${data.errors?.length ? `<br><small>${data.errors.map((e) => escapeHtml(`${e.manager} (${e.channel}): ${e.error}`)).join('<br>')}</small>` : ''}`;
      resultEl.classList.remove('hidden');
    } catch (err) {
      resultEl.className = 'alert alert-error';
      resultEl.textContent = err.message;
      resultEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Envoyer le message';
    }
  });
}
