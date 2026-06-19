import { NextResponse } from 'next/server';
import { describeEmailProviderIssue, getEmailConfig } from '../../../../lib/emailConfig';
import { resolvePromoteursForSend } from '../../../../lib/promoteurs';
import { sendBulkEmails } from '../../../../lib/sendEmailBatch';
import { getSession } from '../../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return json({ error: 'Non authentifié' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const {
    promoter_ids: promoterIds,
    message,
    subject,
    html,
    test_only: testOnly,
    broadcast,
    mailjet_account: mailjetAccount,
    mailjet_rotate_accounts: mailjetRotateAccounts,
  } = body;

  if (!message) return json({ error: 'message required' }, 400);

  try {
    const promoteurs = await resolvePromoteursForSend({
      promoter_ids: promoterIds,
      test_only: testOnly,
      broadcast,
    });

    if (!promoteurs.length) {
      return json({ error: 'Aucun promoteur trouvé pour cet envoi' }, 400);
    }

    const emailConfig = getEmailConfig();
    const providerIssue = describeEmailProviderIssue();

    if (emailConfig.onVercel && providerIssue) {
      return json({ error: providerIssue }, 400);
    }

    const batch = await sendBulkEmails({
      recipients: promoteurs,
      getEmail: (p) => p.email,
      getRecipientName: (p) => p.nom,
      message,
      subject,
      html,
      mailjetAccount,
      mailjetRotateAccounts: Boolean(mailjetRotateAccounts),
      allowBotFallback: false,
    });

    return json({
      success: true,
      promoteurs: promoteurs.length,
      whatsapp: { sent: 0, failed: 0, skipped: 0 },
      warnings: [],
      ...batch,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
