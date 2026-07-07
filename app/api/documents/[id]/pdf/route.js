import { fetchDocumentById } from '../../../../../lib/documents';
import { getSession } from '../../../../../lib/session';

const SOCIETE_INFO = {
  asso_tmbc: {
    name: 'Association Toulouse Midi-Pyrénées Boxing Club',
    short: 'ASSO TMBC',
    address: 'Toulouse, Midi-Pyrénées',
    siret: '',
  },
  boxing_center: {
    name: 'SAS BOXING CENTER',
    short: 'BOXING CENTER',
    address: '12 rue de Fenouillet, 31200 Toulouse',
    siret: '',
  },
  distrix: {
    name: 'DISTRIX SAS',
    short: 'DISTRIX',
    address: 'Toulouse',
    siret: '',
  },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatMontant(val) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(val || 0);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDocumentHtml(doc) {
  const societe = SOCIETE_INFO[doc.societe] || SOCIETE_INFO.boxing_center;
  const isFacture = doc.type === 'facture';
  const title = isFacture ? 'FACTURE' : 'DEVIS';

  const clientLines = [
    doc.client_nom,
    doc.client_adresse,
    doc.client_telephone,
    doc.client_email,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} ${escapeHtml(doc.numero)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1a1a2e;
    background: #f0f0f5;
    padding: 2rem;
    line-height: 1.5;
  }
  .page {
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 20px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  .header {
    background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
    color: #fff;
    padding: 2.5rem 2.5rem 2rem;
  }
  .header h1 {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }
  .header .address {
    font-size: 0.85rem;
    opacity: 0.85;
  }
  .doc-title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.75rem 2.5rem;
    border-bottom: 2px solid #e8e8f0;
  }
  .doc-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: #0f3460;
    letter-spacing: 1px;
  }
  .doc-meta {
    text-align: right;
    font-size: 0.9rem;
    color: #555;
  }
  .doc-meta strong {
    display: block;
    font-size: 1rem;
    color: #1a1a2e;
  }
  .body { padding: 2rem 2.5rem; }
  .client-block {
    background: #f7f8fc;
    border-left: 4px solid #0f3460;
    padding: 1.25rem 1.5rem;
    margin-bottom: 2rem;
    border-radius: 0 6px 6px 0;
  }
  .client-block .label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #0f3460;
    margin-bottom: 0.5rem;
  }
  .client-block p {
    font-size: 0.95rem;
    color: #333;
    margin: 0.15rem 0;
  }
  .prestation-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5rem;
  }
  .prestation-table thead th {
    background: #0f3460;
    color: #fff;
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .prestation-table thead th:last-child { text-align: right; }
  .prestation-table tbody td {
    padding: 1rem;
    border-bottom: 1px solid #e8e8f0;
    font-size: 0.95rem;
  }
  .prestation-table tbody td:last-child {
    text-align: right;
    font-weight: 600;
    white-space: nowrap;
  }
  .total-row {
    display: flex;
    justify-content: flex-end;
    padding: 1rem 0;
    margin-bottom: 1.5rem;
  }
  .total-box {
    background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
    color: #fff;
    padding: 1rem 2rem;
    border-radius: 6px;
    font-size: 1.1rem;
    font-weight: 700;
    min-width: 200px;
    text-align: center;
  }
  .total-box small {
    display: block;
    font-size: 0.7rem;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.8;
    margin-bottom: 0.25rem;
  }
  .info-section {
    margin-bottom: 1.25rem;
    padding: 1rem 1.25rem;
    background: #fafbfe;
    border-radius: 6px;
    border: 1px solid #e8e8f0;
  }
  .info-section .label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #0f3460;
    margin-bottom: 0.35rem;
  }
  .info-section p {
    font-size: 0.9rem;
    color: #444;
    white-space: pre-line;
  }
  .footer {
    background: #f7f8fc;
    border-top: 2px solid #e8e8f0;
    padding: 1.5rem 2.5rem;
    text-align: center;
    font-size: 0.8rem;
    color: #888;
  }
  .footer strong { color: #555; }
  .print-btn {
    display: block;
    margin: 1.5rem auto;
    padding: 0.75rem 2rem;
    background: #0f3460;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }
  .print-btn:hover { background: #16213e; }

  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; border-radius: 0; }
    .print-btn { display: none !important; }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .prestation-table thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .total-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<button class="print-btn" onclick="window.print()">Imprimer / Enregistrer en PDF</button>

<div class="page">
  <div class="header">
    <h1>${escapeHtml(societe.name)}</h1>
    <p class="address">${escapeHtml(societe.address)}</p>
  </div>

  <div class="doc-title-bar">
    <span class="doc-title">${title}</span>
    <div class="doc-meta">
      <strong>${escapeHtml(doc.numero)}</strong>
      ${formatDate(doc.date_document)}
    </div>
  </div>

  <div class="body">
    <div class="client-block">
      <div class="label">Client</div>
      ${clientLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('\n      ')}
    </div>

    <table class="prestation-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(doc.prestation)}</td>
          <td>${formatMontant(doc.montant)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-row">
      <div class="total-box">
        <small>Total</small>
        ${formatMontant(doc.montant)}
      </div>
    </div>

    ${doc.reference ? `<div class="info-section">
      <div class="label">Référence</div>
      <p>${escapeHtml(doc.reference)}</p>
    </div>` : ''}

    ${doc.conditions ? `<div class="info-section">
      <div class="label">Conditions</div>
      <p>${escapeHtml(doc.conditions)}</p>
    </div>` : ''}
  </div>

  <div class="footer">
    <strong>${escapeHtml(societe.name)}</strong><br>
    ${escapeHtml(societe.address)}${societe.siret ? `<br>SIRET : ${escapeHtml(societe.siret)}` : ''}
  </div>
</div>

</body>
</html>`;
}

export async function GET(_request, { params }) {
  const session = await getSession();
  if (!session) {
    return new Response('Non authentifié', { status: 401 });
  }

  try {
    const doc = await fetchDocumentById(params.id);
    if (!doc) return new Response('Document introuvable', { status: 404 });

    const html = buildDocumentHtml(doc);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
