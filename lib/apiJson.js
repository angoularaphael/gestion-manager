function isHtmlResponse(text) {
  const t = String(text).trim().toLowerCase();
  return t.startsWith('<!doctype html') || t.startsWith('<html');
}

/** Réponse JSON d'erreur API (routes Next.js). */
export function apiError(err, status = 500) {
  const message = err?.message || String(err) || 'Erreur serveur';
  const code = err?.status && Number.isFinite(err.status) ? err.status : status;
  return Response.json({ error: message }, { status: code });
}

export async function parseApiJson(res) {
  if (res.status === 504) {
    throw new Error(
      'Délai dépassé (504). Le bot Bothosting ne répond pas assez vite — vérifiez qu\'il est démarré et à jour.'
    );
  }
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
      'Le serveur Vercel a expiré ou a planté (souvent WhatsApp / bot Bothosting). ' +
        'Réessayez avec email seul, ou vérifiez que le bot tourne et NEXT_PUBLIC_WHATSAPP_BOT_URL sur Vercel.'
    );
  }
  throw new Error(trimmed.slice(0, 200) || `Erreur HTTP ${res.status}`);
}
