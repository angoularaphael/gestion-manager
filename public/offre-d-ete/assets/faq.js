(function () {
  const root = document.getElementById('faq-root');
  const form = document.getElementById('faq-contact-form');
  if (!root || !form) return;

  const data = window.OFFRE_ETE_FAQ_DATA || [];
  const topics = window.OFFRE_ETE_FAQ_TOPICS || [];
  const api = window.OFFRE_ETE_FAQ_API;

  function notifyResize() {
    if (typeof window.offreEteNotifyResize === 'function') {
      window.offreEteNotifyResize();
      window.setTimeout(window.offreEteNotifyResize, 350);
    }
  }

  function buildFaq() {
    root.innerHTML = data
      .map(
        (cat) => `
      <div class="faq-cat reveal">
        <h3 class="faq-cat-title">${cat.title}</h3>
        <div class="faq-list">
          ${cat.items
            .map(
              (item, i) => `
            <details class="faq-item" data-cat="${cat.id}">
              <summary class="faq-q">${item.q}</summary>
              <div class="faq-a">${item.a}</div>
            </details>`
            )
            .join('')}
        </div>
      </div>`
      )
      .join('');

    root.querySelectorAll('details').forEach((el) => {
      el.addEventListener('toggle', notifyResize);
    });
  }

  function fillTopics() {
    const select = form.querySelector('[name="topic"]');
    if (!select) return;
    select.innerHTML = topics
      .map((t) => `<option value="${t.id}">${t.label}</option>`)
      .join('');
    select.value = 'autre';
  }

  function setStatus(msg, ok) {
    const el = document.getElementById('faq-form-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'faq-form-status' + (ok ? ' faq-form-status--ok' : msg ? ' faq-form-status--err' : '');
  }

  buildFaq();
  fillTopics();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!api) {
      setStatus('Service temporairement indisponible.', false);
      return;
    }

    const fd = new FormData(form);
    if (fd.get('_website')) return;

    const payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      topic: fd.get('topic'),
      message: fd.get('message'),
      source: window.parent !== window ? 'wordpress' : 'landing',
    };

    const btn = form.querySelector('[type="submit"]');
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Envoi…';
    setStatus('', false);

    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Envoi impossible');

      form.reset();
      fillTopics();
      setStatus('Merci ! Votre message a été envoyé à Boxing Center. Réponse sous 48h ouvrées.', true);
      notifyResize();
    } catch (err) {
      setStatus(err.message || 'Erreur lors de l\'envoi. Réessayez ou appelez le 05 62 24 46 82.', false);
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
    }
  });
})();
