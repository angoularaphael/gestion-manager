(function () {
  var API = 'https://gestion-manager.vercel.app';
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    API = '';
  }

  var bar = document.querySelector('.progress-bar');
  if (bar) {
    window.addEventListener('scroll', function () {
      var h = document.documentElement;
      var p = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = p + '%';
    });
  }

  window.tunnelSubmit = function (form, endpoint, extra) {
    var msg = form.querySelector('.form-msg');
    var fd = new FormData(form);
    var body = {};
    fd.forEach(function (v, k) { body[k] = v; });
    if (extra) Object.assign(body, extra);
    if (msg) { msg.textContent = 'Envoi…'; msg.className = 'form-msg'; }

    return fetch(API + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'Erreur');
        if (msg) { msg.textContent = res.data.message || 'Merci ! Redirection…'; msg.className = 'form-msg ok'; }
        if (res.data.boutique_url) {
          setTimeout(function () { location.href = res.data.boutique_url; }, 1200);
        }
        return res.data;
      })
      .catch(function (err) {
        if (msg) { msg.textContent = err.message || 'Erreur'; msg.className = 'form-msg err'; }
      });
  };
})();
