import { store } from './store.js';
import { escapeHtml } from './utils.js';

const NAV = [
  { path: '/dashboard', label: 'Tableau de bord', icon: '◫' },
  { path: '/dashboard/managers', label: 'Managers', icon: '◎' },
  { path: '/dashboard/envoyer', label: 'Envoyer', icon: '✉' },
  { path: '/dashboard/historique', label: 'Historique', icon: '↺' },
  { path: '/dashboard/whatsapp', label: 'WhatsApp', icon: '◉' },
  { path: '/dashboard/parametres', label: 'Paramètres', icon: '⚙' },
];

export function dashboardShell(activePath, title, content, { subtitle = '' } = {}) {
  const nav = NAV.map((item) => {
    const active = activePath === item.path
      || (item.path !== '/dashboard' && activePath.startsWith(item.path));
    return `<a href="${item.path}" data-nav class="nav-item${active ? ' active' : ''}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </a>`;
  }).join('');

  const email = store.user?.email ? escapeHtml(store.user.email) : 'Administrateur';

  return `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <img src="/assets/logo.png" alt="Boxing Center" class="sidebar-logo" onerror="this.style.display='none'" />
          <div>
            <strong>Boxing Center</strong>
            <span>Console admin</span>
          </div>
        </div>
        <nav class="sidebar-nav">${nav}</nav>
        <div class="sidebar-footer">
          <a href="https://boxingcenter.fr/" target="_blank" rel="noopener" class="ext-link">boxingcenter.fr ↗</a>
        </div>
      </aside>
      <div class="main-area">
        <header class="topbar">
          <button type="button" class="btn-icon mobile-menu" id="btn-menu" aria-label="Menu">☰</button>
          <div class="topbar-titles">
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="topbar-sub">${escapeHtml(subtitle)}</p>` : ''}
          </div>
          <div class="topbar-actions">
            <span id="wa-status-pill" class="status-pill offline">WhatsApp</span>
            <div class="user-menu">
              <span class="user-email">${email}</span>
              <button type="button" class="btn btn-ghost btn-sm" id="btn-logout">Déconnexion</button>
            </div>
          </div>
        </header>
        <main class="page-content">${content}</main>
        <footer class="page-footer">
          <span>© Boxing Center</span>
          <a href="mailto:boxingcenter31@gmail.com">boxingcenter31@gmail.com</a>
        </footer>
      </div>
    </div>`;
}

export function bindShellEvents() {
  document.getElementById('btn-menu')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    const { logout } = await import('./api.js');
    const { navigate } = await import('./router.js');
    await logout().catch(() => {});
    const { setUser } = await import('./store.js');
    setUser(null);
    navigate('/login', { replace: true });
  });
}

export async function refreshWaStatusPill() {
  const pill = document.getElementById('wa-status-pill');
  if (!pill) return;
  try {
    const res = await fetch(`${window.location.origin}/api/status`);
    const data = await res.json();
    if (data.connected) {
      pill.textContent = 'WhatsApp connecté';
      pill.className = 'status-pill online';
    } else if (data.connecting) {
      pill.textContent = 'Connexion…';
      pill.className = 'status-pill pending';
    } else {
      pill.textContent = 'WhatsApp hors ligne';
      pill.className = 'status-pill offline';
    }
  } catch {
    pill.textContent = 'Statut indisponible';
    pill.className = 'status-pill offline';
  }
}
