import { login } from '../api.js';
import { setUser } from '../store.js';
import { navigate } from '../router.js';

export function renderLogin() {
  return `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <img src="/assets/logo.png" alt="Boxing Center" class="login-logo" onerror="this.style.display='none'" />
          <h1>Boxing Center</h1>
          <p>Console de messagerie managers</p>
        </div>
        <form id="login-form" class="login-form">
          <div class="field">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" placeholder="angoularaphael05@gmail.com" required autocomplete="username" />
          </div>
          <div class="field">
            <label for="login-password">Mot de passe</label>
            <input type="password" id="login-password" placeholder="Mot de passe administrateur" required autocomplete="current-password" />
          </div>
          <p id="login-error" class="form-error hidden"></p>
          <button type="submit" class="btn btn-primary btn-block" id="login-submit">Se connecter</button>
        </form>
        <div class="login-footer">
          <a href="https://boxingcenter.fr/" target="_blank" rel="noopener">Visiter boxingcenter.fr</a>
          <a href="mailto:boxingcenter31@gmail.com">Support</a>
        </div>
      </div>
      <div class="login-bg-pattern"></div>
    </div>`;
}

export function bindLogin() {
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-submit');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Connexion…';
    try {
      const password = document.getElementById('login-password').value;
      const email = document.getElementById('login-email').value.trim();
      const data = await login(password, email);
      setUser(data.user);
      await navigate('/dashboard', { replace: true });
    } catch (err) {
      errEl.textContent = err.message || 'Connexion impossible';
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  });
}
