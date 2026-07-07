'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ActionButton from '../../components/ActionButton';
import { parseApiJson } from '../../../lib/apiJson';

const SOCIETES = [
  { id: 'asso_tmbc', label: 'ASSO TMBC' },
  { id: 'boxing_center', label: 'BOXING CENTER' },
  { id: 'distrix', label: 'DISTRIX' },
];

const TYPE_TABS = [
  { id: '', label: 'Tous' },
  { id: 'devis', label: 'Devis' },
  { id: 'facture', label: 'Factures' },
];

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatMontant(val) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val || 0);
}

const TABS = [
  { id: 'new', label: 'Nouveau document' },
  { id: 'history', label: 'Historique' },
];

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('new');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [typeFilter, setTypeFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const [form, setForm] = useState({
    type: 'devis',
    societe: 'boxing_center',
    client_nom: '',
    client_email: '',
    client_adresse: '',
    client_telephone: '',
    prestation: '',
    montant: '',
    date_document: new Date().toISOString().slice(0, 10),
    reference: '',
    conditions: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (searchFilter.trim()) params.set('search', searchFilter.trim());
      const res = await fetch(`/api/documents?${params}`, { cache: 'no-store' });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setDocuments(data.documents || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchFilter]);

  useEffect(() => {
    if (activeTab === 'history') loadDocuments();
  }, [activeTab, loadDocuments]);

  const filtered = useMemo(() => {
    let rows = documents;
    if (typeFilter) rows = rows.filter((d) => d.type === typeFilter);
    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      rows = rows.filter((d) => {
        const blob = [d.numero, d.client_nom, d.prestation, d.reference]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return rows;
  }, [documents, typeFilter, searchFilter]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || 'Erreur');

      const doc = data.document;
      setSuccess(`${doc.type === 'facture' ? 'Facture' : 'Devis'} ${doc.numero} créé(e) avec succès.`);
      setForm((prev) => ({
        ...prev,
        client_nom: '',
        client_email: '',
        client_adresse: '',
        client_telephone: '',
        prestation: '',
        montant: '',
        reference: '',
        conditions: '',
        date_document: new Date().toISOString().slice(0, 10),
      }));

      window.open(`/api/documents/${doc.id}/pdf`, '_blank');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="managers-page">
      <header className="page-header managers-page-header">
        <div>
          <h1>Devis / Factures</h1>
          <p className="page-subtitle">Créez et consultez vos devis et factures</p>
        </div>
      </header>

      <div className="channel-pills" style={{ marginBottom: '1.5rem' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`channel-pill ${activeTab === tab.id ? 'on' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert-banner err">
          <strong>Erreur</strong>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="alert-banner" style={{ borderLeft: '4px solid #22c55e', background: '#f0fdf4' }}>
          <p>{success}</p>
        </div>
      )}

      {activeTab === 'new' && (
        <section className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="field-label">Type de document</label>
                <select
                  className="search-input"
                  value={form.type}
                  onChange={(e) => updateForm('type', e.target.value)}
                >
                  <option value="devis">Devis</option>
                  <option value="facture">Facture</option>
                </select>
              </div>
              <div>
                <label className="field-label">Société émettrice</label>
                <select
                  className="search-input"
                  value={form.societe}
                  onChange={(e) => updateForm('societe', e.target.value)}
                >
                  {SOCIETES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f3460', marginBottom: '0.75rem', borderBottom: '2px solid #e8e8f0', paddingBottom: '0.5rem' }}>
              Client
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="field-label">Nom *</label>
                <input
                  className="search-input"
                  type="text"
                  required
                  value={form.client_nom}
                  onChange={(e) => updateForm('client_nom', e.target.value)}
                  placeholder="Nom du client"
                />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input
                  className="search-input"
                  type="email"
                  value={form.client_email}
                  onChange={(e) => updateForm('client_email', e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <label className="field-label">Adresse</label>
                <input
                  className="search-input"
                  type="text"
                  value={form.client_adresse}
                  onChange={(e) => updateForm('client_adresse', e.target.value)}
                  placeholder="Adresse postale"
                />
              </div>
              <div>
                <label className="field-label">Téléphone</label>
                <input
                  className="search-input"
                  type="text"
                  value={form.client_telephone}
                  onChange={(e) => updateForm('client_telephone', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f3460', marginBottom: '0.75rem', borderBottom: '2px solid #e8e8f0', paddingBottom: '0.5rem' }}>
              Prestation
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">Descriptif *</label>
                <textarea
                  className="search-input"
                  required
                  rows={3}
                  value={form.prestation}
                  onChange={(e) => updateForm('prestation', e.target.value)}
                  placeholder="Description de la prestation..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div>
                <label className="field-label">Montant (€) *</label>
                <input
                  className="search-input"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.montant}
                  onChange={(e) => updateForm('montant', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="field-label">Date</label>
                <input
                  className="search-input"
                  type="date"
                  value={form.date_document}
                  onChange={(e) => updateForm('date_document', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Référence</label>
                <input
                  className="search-input"
                  type="text"
                  value={form.reference}
                  onChange={(e) => updateForm('reference', e.target.value)}
                  placeholder="Référence optionnelle"
                />
              </div>
              <div>
                <label className="field-label">Conditions</label>
                <textarea
                  className="search-input"
                  rows={2}
                  value={form.conditions}
                  onChange={(e) => updateForm('conditions', e.target.value)}
                  placeholder="Conditions de paiement, validité..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <ActionButton
              type="submit"
              className="btn"
              loading={submitting}
              disabled={submitting}
            >
              {submitting ? 'Génération…' : 'Générer le document'}
            </ActionButton>
          </form>
        </section>
      )}

      {activeTab === 'history' && (
        <>
          <div className="filter-bar filter-bar-stack" style={{ marginBottom: '1rem' }}>
            <input
              type="search"
              placeholder="Rechercher numéro, client, prestation…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="channel-pills" style={{ marginBottom: '1rem' }}>
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.id || 'all'}
                type="button"
                className={`channel-pill ${typeFilter === tab.id ? 'on' : ''}`}
                onClick={() => setTypeFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
            <ActionButton className="btn ghost" onClick={loadDocuments} loading={loading} style={{ marginLeft: 'auto' }}>
              Actualiser
            </ActionButton>
          </div>

          <section className="card">
            {loading ? (
              <p className="muted">Chargement…</p>
            ) : !filtered.length ? (
              <p className="muted">Aucun document trouvé.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Numéro</th>
                      <th>Type</th>
                      <th>Société</th>
                      <th>Client</th>
                      <th>Montant</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((doc) => (
                      <tr key={doc.id}>
                        <td><strong>{doc.numero}</strong></td>
                        <td>
                          <span className={`badge badge--${doc.type === 'facture' ? 'gold' : 'blue'}`}>
                            {doc.type === 'facture' ? 'Facture' : 'Devis'}
                          </span>
                        </td>
                        <td>{SOCIETES.find((s) => s.id === doc.societe)?.label || doc.societe}</td>
                        <td>{doc.client_nom}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatMontant(doc.montant)}</td>
                        <td>{formatDate(doc.date_document)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn ghost"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                            onClick={() => window.open(`/api/documents/${doc.id}/pdf`, '_blank')}
                          >
                            Voir PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
