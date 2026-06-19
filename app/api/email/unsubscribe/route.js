import { NextResponse } from 'next/server';
import { recordEmailUnsubscribe } from '../../../../lib/emailUnsubscribes';
import { verifyUnsubscribeToken } from '../../../../lib/emailUnsubscribe';

export const dynamic = 'force-dynamic';

function successHtml(email) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Désabonnement confirmé — Boxing Center</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .card { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 14px; padding: 28px; border: 1px solid #e2e8f0; }
    h1 { font-size: 1.35rem; margin: 0 0 12px; }
    p { line-height: 1.6; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Désabonnement confirmé</h1>
    <p>L'adresse <strong>${email}</strong> ne recevra plus d'emails promotionnels de Boxing Center.</p>
    <p>Vous pouvez fermer cette page.</p>
  </div>
</body>
</html>`;
}

async function processUnsubscribe(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const verified = verifyUnsubscribeToken(token);
  if (!verified) {
    return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 });
  }

  try {
    await recordEmailUnsubscribe({
      email: verified.email,
      clientId: verified.clientId,
    });
  } catch (e) {
    if (e.code === 'TABLE_MISSING') {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    throw e;
  }

  return verified;
}

export async function GET(request) {
  try {
    const verified = await processUnsubscribe(request);
    if (verified instanceof NextResponse) return verified;
    return new NextResponse(successHtml(verified.email), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const verified = await processUnsubscribe(request);
    if (verified instanceof NextResponse) return verified;
    return NextResponse.json({ ok: true, email: verified.email });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
