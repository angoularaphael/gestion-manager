import { normalizePhone } from './phone';

export function normalizeEmail(input) {
  const e = String(input || '').trim().toLowerCase();
  if (!e || !e.includes('@')) return '';
  return e;
}

export function computeContactType(hasPhone, hasEmail) {
  if (hasPhone && hasEmail) return 'both';
  if (hasPhone) return 'phone_only';
  if (hasEmail) return 'email_only';
  return 'none';
}

export function buildContactRow({
  nom,
  email,
  telephone,
  adresse,
  localisation,
  url_profil,
  is_test = false,
  categorie,
}) {
  const cleanNom = String(nom || '').trim();
  if (!cleanNom) throw new Error('Le nom est requis');

  const cleanEmail = normalizeEmail(email) || null;
  const cleanPhone = normalizePhone(telephone) || null;
  const has_phone = Boolean(cleanPhone);
  const has_email = Boolean(cleanEmail);

  const row = {
    nom: cleanNom,
    email: cleanEmail,
    telephone: cleanPhone,
    adresse: String(adresse || '').trim() || null,
    localisation: String(localisation || '').trim() || null,
    url_profil: String(url_profil || '').trim() || null,
    has_phone,
    has_email,
    contact_type: computeContactType(has_phone, has_email),
    is_test: Boolean(is_test),
  };

  if (categorie) {
    const cat = String(categorie).trim().toLowerCase();
    if (cat !== 'amateur' && cat !== 'pro') {
      throw new Error('Catégorie invalide (amateur ou pro)');
    }
    row.categorie = cat;
  }

  return row;
}

export function duplicateContactError(tableLabel, error) {
  const msg = error?.message || '';
  if (error?.code === '23505' || /duplicate|unique/i.test(msg)) {
    return new Error(`Ce ${tableLabel} existe déjà (nom en double)`);
  }
  return new Error(msg || `Erreur lors de l'ajout du ${tableLabel}`);
}
