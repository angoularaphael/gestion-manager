import { api } from '../api.js';
import { store, toggleManager, selectAll } from '../store.js';
import { dashboardShell, bindShellEvents, refreshWaStatusPill } from '../layout.js';
import { escapeHtml, contactLabel, debounce } from '../utils.js';
import { navigate } from '../router.js';

let detailManager = null;

async function loadManagers(search, contactType) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (contactType && contactType !== 'all') params.set('contact_type', contactType);
  const data = await api(`/api/managers?${params}`);
  store.managers = data.managers || [];
  return store.managers;
}

function renderTable(managers) {
  return managers.map((m) => `
    <tr data-id="${m.id}" class="row-clickable">
      <td><input type="checkbox" data-id="${m.id}" ${store.selectedIds.has(m.id) ? 'checked' : ''} /></td>
      <td><strong>${escapeHtml(m.nom)}</strong>${m.is_test ? ' <span class="badge pending">test</span>' : ''}</td>
      <td>${escapeHtml(m.telephone || '—')}</td>
      <td>${escapeHtml(m.email || '—')}</td>
      <td><span class="contact-pill">${contactLabel(m.contact_type)}</span></td>
      <td><button type="button" class="btn btn-ghost btn-sm btn-detail" data-id="${m.id}">Détails</button></td>
    </tr>`).join('');
}

function renderDetail(m) {
  if (!m) return '';
  return `
    <aside class="detail-panel" id="detail-panel">
      <div class="detail-header">
        <h3>${escapeHtml(m.nom)}</h3>
        <button type="button" class="btn-icon" id="close-detail">✕</button>
      </div>
      <dl class="detail-list">
        <dt>Téléphone</dt><dd>${escapeHtml(m.telephone || '—')}</dd>
        <dt>Email</dt><dd>${escapeHtml(m.email || '—')}</dd>
        <dt>Type contact</dt><dd>${contactLabel(m.contact_type)}</dd>
        <dt>ID</dt><dd class="mono">${escapeHtml(m.id)}</dd>
      </dl>
      <div class="detail-actions">
        <button type="button" class="btn btn-primary btn-sm" id="detail-send">Envoyer un message</button>
      </div>
    </aside>`;
}

export async function renderManagers() {
  let stats = {};
  try {
    stats = await api('/api/managers/stats');
    await loadManagers('', 'all');
  } catch (e) {
    console.error(e);
  }

  const content = `
    <div class="toolbar-card">
      <div class="toolbar">
        <input type="search" id="mgr-search" placeholder="Rechercher par nom…" />
        <select id="mgr-filter">
          <option value="all">Tous les contacts</option>
          <option value="both">Téléphone + email</option>
          <option value="phone_only">Téléphone seul</option>
          <option value="email_only">Email seul</option>
          <option value="none">Sans contact</option>
        </select>
        <button type="button" class="btn btn-secondary" id="mgr-refresh">Actualiser</button>
        <button type="button" class="btn btn-primary" id="mgr-compose">Composer (${store.selectedIds.size})</button>
      </div>
      <div class="mini-stats">
        <span>Total <strong>${stats.total ?? '—'}</strong></span>
        <span>Tél <strong>${stats.withPhone ?? '—'}</strong></span>
        <span>Email <strong>${stats.withEmail ?? '—'}</strong></span>
        <span>Les deux <strong>${stats.both ?? '—'}</strong></span>
      </div>
    </div>
    <div class="split-view">
      <div class="table-wrap card-table">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" id="mgr-select-all" /></th>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="mgr-body">${renderTable(store.managers)}</tbody>
        </table>
      </div>
      <div id="detail-slot">${detailManager ? renderDetail(detailManager) : ''}</div>
    </div>`;

  bindShellEvents();
  refreshWaStatusPill();
  setTimeout(bindManagersEvents, 0);
  return dashboardShell('/dashboard/managers', 'Managers', content, {
    subtitle: 'Répertoire des managers boxe',
  });
}

function bindManagersEvents() {
  const tbody = document.getElementById('mgr-body');
  const refresh = async () => {
    const search = document.getElementById('mgr-search')?.value.trim() || '';
    const filter = document.getElementById('mgr-filter')?.value || 'all';
    await loadManagers(search, filter);
    if (tbody) tbody.innerHTML = renderTable(store.managers);
    bindManagersEvents();
  };

  document.getElementById('mgr-refresh')?.addEventListener('click', refresh);
  document.getElementById('mgr-search')?.addEventListener('input', debounce(refresh, 300));
  document.getElementById('mgr-filter')?.addEventListener('change', refresh);

  document.getElementById('mgr-select-all')?.addEventListener('change', (e) => {
    if (e.target.checked) selectAll(store.managers.map((m) => m.id));
    else selectAll([]);
    refresh();
    document.getElementById('mgr-compose').textContent = `Composer (${store.selectedIds.size})`;
  });

  tbody?.querySelectorAll('input[type=checkbox]').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleManager(cb.dataset.id, cb.checked);
      document.getElementById('mgr-compose').textContent = `Composer (${store.selectedIds.size})`;
    });
  });

  tbody?.querySelectorAll('.btn-detail').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      detailManager = store.managers.find((m) => m.id === btn.dataset.id);
      const slot = document.getElementById('detail-slot');
      if (slot) slot.innerHTML = renderDetail(detailManager);
      bindDetailEvents();
    });
  });

  document.getElementById('mgr-compose')?.addEventListener('click', () => {
    navigate('/dashboard/envoyer');
  });

  bindDetailEvents();
}

function bindDetailEvents() {
  document.getElementById('close-detail')?.addEventListener('click', () => {
    detailManager = null;
    document.getElementById('detail-slot').innerHTML = '';
  });
  document.getElementById('detail-send')?.addEventListener('click', () => {
    if (detailManager) {
      selectAll([detailManager.id]);
      navigate('/dashboard/envoyer');
    }
  });
}
