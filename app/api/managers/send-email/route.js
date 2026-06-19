import { NextResponse } from 'next/server';
import { describeEmailProviderIssue, getEmailConfig } from '../../../../lib/emailConfig';
import { resolveManagersForSend } from '../../../../lib/managers';
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
    manager_ids: managerIds,
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
    const managers = await resolveManagersForSend({
      manager_ids: managerIds,
      test_only: testOnly,
      broadcast,
    });

    if (!managers.length) {
      return json({ error: 'Aucun manager trouvé pour cet envoi' }, 400);
    }

    const emailConfig = getEmailConfig();
    const providerIssue = describeEmailProviderIssue();

    if (emailConfig.onVercel && providerIssue) {
      return json({ error: providerIssue }, 400);
    }

    const batch = await sendBulkEmails({
      recipients: managers,
      getEmail: (m) => m.email,
      getRecipientName: (m) => m.nom,
      message,
      subject,
      html,
      mailjetAccount,
      mailjetRotateAccounts: Boolean(mailjetRotateAccounts),
      allowBotFallback: false,
    });

    return json({
      success: true,
      managers: managers.length,
      whatsapp: { sent: 0, failed: 0, skipped: 0 },
      warnings: [],
      ...batch,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
