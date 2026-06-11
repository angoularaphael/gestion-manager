const routes = new Map();
let notFound = () => '';
let beforeEach = null;

export function register(path, handler) {
  routes.set(path, handler);
}

export function setNotFound(handler) {
  notFound = handler;
}

export function setBeforeEach(fn) {
  beforeEach = fn;
}

function matchRoute(pathname) {
  if (routes.has(pathname)) return { handler: routes.get(pathname), params: {} };
  for (const [pattern, handler] of routes) {
    if (!pattern.includes(':')) continue;
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}$`);
    const m = pathname.match(regex);
    if (m) {
      const keys = [...pattern.matchAll(/:([^/]+)/g)].map((k) => k[1]);
      const params = {};
      keys.forEach((k, i) => { params[k] = m[i + 1]; });
      return { handler, params };
    }
  }
  return null;
}

export async function navigate(path, { replace = false } = {}) {
  const url = path.startsWith('/') ? path : `/${path}`;
  if (beforeEach) {
    const ok = await beforeEach(url);
    if (!ok) return;
  }
  if (replace) history.replaceState({}, '', url);
  else history.pushState({}, '', url);
  await renderCurrent();
}

export async function renderCurrent() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  const match = matchRoute(pathname);
  const app = document.getElementById('app');
  if (!app) return;
  if (match) {
    app.innerHTML = await match.handler(match.params);
    return;
  }
  app.innerHTML = await notFound();
}

export function initRouter() {
  window.addEventListener('popstate', () => renderCurrent());
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-nav]');
    if (!a) return;
    e.preventDefault();
    navigate(a.getAttribute('href'));
  });
}
