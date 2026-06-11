import { apiPublic, listUsers, createUser, deleteUser } from '../api.js';
import { getUser } from '../store.js';
import { dashboardShell, bindShellEvents, refreshWaStatusPill } from '../layout.js';

export async function renderSettings() {
  const me = getUser();
  const isSuperAdmin = me?.role === 'super_admin';

  let status = {};
  let users = [];
  try {
    status = await apiPublic('/api/status');
    if (isSuperAdmin) {
      const data = await listUsers();
      users = data.users || [];
    }
  } catch (e) {
    console.error(e);
  }

  const usersSection = isSuperAdmin
    ? `
    <section class="card">
      <div class="card-header"><h2>Gestion des accès</h2></div>
      <p class="muted">Créez des comptes pour votre équipe (rôle <strong>admin</strong>).</p>
      <form id="create-user-form" class="stack-form">
        <div class="grid-2">
          <div class="field">
            <label for="new-user-email">Email</label>
            <input type="email" id="new-user-email" required placeholder="collaborateur@boxingcenter.fr" />
          </div>
          <div class="field">
            <label for="new-user-name">Nom (optionnel)</label>
            <input type="text" id="new-user-name" placeholder="Prénom Nom" />
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="new-user-password">Mot de passe</label>
            <input type="password" id="new-user-password" required minlength="8" placeholder="Min. 8 caractères" />
          </div>
          <div class="field">
            <label for="new-user-role">Rôle</label>
            <select id="new-user-role">
              <option value="admin">Admin</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
        </div>
        <p id="create-user-error" class="form-error hidden"></p>
        <button type="submit" class="btn btn-primary">Créer l'accès</button>
      </form>
      <div class="table-wrap" style="margin-top:1.5rem">
        <table class="data-table">
          <thead><tr><th>Email</th><th>Nom</th><th>Rôle</th><th></th></tr></thead>
          <tbody id="users-table-body">
            ${users
              .map(
                (u) => `<tr>
              <td>${u.email}</td>
              <td>${u.name || '—'}</td>
              <td><span class="badge">${u.role}</span></td>
              <td>${u.email !== me?.email ? `<button type="button" class="btn btn-ghost btn-sm" data-delete-user="${u.email}">Supprimer</button>` : '—'}</td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>`
    : '';

  const content = `
    <div class="grid-2">
      <section class="card">
        <div class="card-header"><h2>Mon compte</h2></div>
        <dl class="settings-list">
          <dt>Email</dt>
          <dd>${me?.email || '—'}</dd>
          <dt>Rôle</dt>
          <dd><span class="badge sent">${me?.role || '—'}</span></dd>
        </dl>
      </section>

      <section class="card">
        <div class="card-header"><h2>Services</h2></div>
        <dl class="settings-list">
          <dt>WhatsApp (Baileys)</dt>
          <dd><span class="badge ${status.connected ? 'sent' : 'failed'}">${status.connected ? 'Connecté' : 'Déconnecté'}</span></dd>
          <dt>Email (Brevo)</dt>
          <dd>Expéditeur : boxingcenter31@gmail.com</dd>
          <dt>Base de données</dt>
          <dd>Supabase — managers & historique</dd>
          <dt>Site public</dt>
          <dd><a href="${status.siteUrl || 'https://boxingcenter.fr/'}" target="_blank" rel="noopener">boxingcenter.fr</a></dd>
        </dl>
      </section>
    </div>
    ${usersSection}`;

  bindShellEvents();
  refreshWaStatusPill();
  bindUserManagement(me);
  return dashboardShell('/dashboard/parametres', 'Paramètres', content, {
    subtitle: 'Compte, équipe et services',
  });
}

function bindUserManagement(me) {
  const form = document.getElementById('create-user-form');
  const errEl = document.getElementById('create-user-error');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl?.classList.add('hidden');
    try {
      await createUser({
        email: document.getElementById('new-user-email').value.trim(),
        name: document.getElementById('new-user-name').value.trim(),
        password: document.getElementById('new-user-password').value,
        role: document.getElementById('new-user-role').value,
      });
      window.location.reload();
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message || 'Erreur';
        errEl.classList.remove('hidden');
      }
    }
  });

  document.querySelectorAll('[data-delete-user]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const email = btn.getAttribute('data-delete-user');
      if (!email || email === me?.email) return;
      if (!confirm(`Supprimer l'accès ${email} ?`)) return;
      try {
        await deleteUser(email);
        window.location.reload();
      } catch (err) {
        alert(err.message || 'Suppression impossible');
      }
    });
  });
}
