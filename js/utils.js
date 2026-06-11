export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function contactLabel(type) {
  const map = {
    both: 'Tél + Email',
    phone_only: 'Téléphone',
    email_only: 'Email',
    none: 'Aucun',
  };
  return map[type] || type || '—';
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function statusBadge(status) {
  const cls = ['sent', 'failed', 'pending'].includes(status) ? status : 'pending';
  const labels = { sent: 'Envoyé', failed: 'Échec', pending: 'En attente' };
  return `<span class="badge ${cls}">${labels[status] || status}</span>`;
}
