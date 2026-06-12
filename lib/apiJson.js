function isHtmlResponse(text) {
  const t = String(text).trim().toLowerCase();
  return t.startsWith('<!doctype html') || t.startsWith('<html');
}

export async function parseApiJson(res) {
  const raw = await res.text();
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error('Réponse serveur illisible (JSON invalide).');
    }
  }
  if (isHtmlResponse(trimmed)) {
    throw new Error(
      'Erreur serveur (page HTML). Réessayez ou vérifiez BREVO_API_KEY / bot Bothosting sur Vercel.'
    );
  }
  if (trimmed.toLowerCase().startsWith('an error')) {
    throw new Error(
      'Erreur Vercel (délai ou crash). Le compte peut être créé — vérifiez la liste ou réessayez sans envoi email.'
    );
  }
  throw new Error(trimmed.slice(0, 200) || `Erreur HTTP ${res.status}`);
}
