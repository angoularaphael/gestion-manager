import { getMe } from './api.js';
import { setUser, store } from './store.js';
import { initRouter, register, setNotFound, setBeforeEach, renderCurrent, navigate } from './router.js';
import { renderLogin, bindLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderManagers } from './pages/managers.js';
import { renderComposer } from './pages/composer.js';
import { renderHistory } from './pages/history.js';
import { renderWhatsapp } from './pages/whatsapp.js';
import { renderSettings } from './pages/settings.js';

const PUBLIC_ROUTES = ['/login'];

async function ensureAuth() {
  if (store.user) return true;
  try {
    const data = await getMe();
    setUser(data.user);
    return true;
  } catch {
    setUser(null);
    return false;
  }
}

async function routeGuard(path) {
  const isPublic = PUBLIC_ROUTES.includes(path);
  const authed = await ensureAuth();

  if (path === '/') {
    await navigate(authed ? '/dashboard' : '/login', { replace: true });
    return false;
  }

  if (!isPublic && !authed) {
    await navigate('/login', { replace: true });
    return false;
  }

  if (isPublic && authed && path === '/login') {
    await navigate('/dashboard', { replace: true });
    return false;
  }

  return true;
}

function afterRender(path) {
  if (path === '/login') bindLogin();
}

async function wrapPage(path, renderFn) {
  register(path, async () => {
    const html = await renderFn();
    afterRender(path);
    return html;
  });
}

wrapPage('/login', renderLogin);
wrapPage('/dashboard', renderDashboard);
wrapPage('/dashboard/managers', renderManagers);
wrapPage('/dashboard/envoyer', renderComposer);
wrapPage('/dashboard/historique', renderHistory);
wrapPage('/dashboard/whatsapp', renderWhatsapp);
wrapPage('/dashboard/parametres', renderSettings);

setNotFound(() => `
  <div class="not-found">
    <h1>404</h1>
    <p>Page introuvable</p>
    <a href="/dashboard" data-nav class="btn btn-primary">Retour au tableau de bord</a>
  </div>`);

setBeforeEach(routeGuard);
initRouter();

(async () => {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/') {
    const authed = await ensureAuth();
    await navigate(authed ? '/dashboard' : '/login', { replace: true });
  } else {
    await renderCurrent();
  }
})();
