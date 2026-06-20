import { NextResponse } from 'next/server';
import { describeEmailProviderIssue, getEmailConfig } from '../../../../lib/emailConfig';
import { resolveClientsForSend } from '../../../../lib/clients';
import { clientGreetingName } from '../../../../lib/clientDisplay';
import { getOffreEteClientCampaignTemplate } from '../../../../lib/offreEteCampaign';
import {
  isOffreEteCampaignSubject,
  pickRandomOffreEteEmailMessage,
} from '../../../../lib/offreEteEmailCampaign';
import { fetchUnsubscribedEmailSet } from '../../../../lib/emailUnsubscribes';
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
    client_ids: clientIds,
    message,
    subject,
    html,
    test_only: testOnly,
    broadcast,
    mailjet_account: mailjetAccount,
    mailjet_rotate_accounts: mailjetRotateAccounts,
    mailjet_start_index: mailjetStartIndex,
    offre_ete_campaign: offreEteCampaign,
  } = body;

  if (!message) return json({ error: 'message required' }, 400);

  try {
    const clients = await resolveClientsForSend({
      client_ids: clientIds,
      test_only: testOnly,
      broadcast,
    });

    if (!clients.length) {
      return json({ error: 'Aucun client trouvé pour cet envoi' }, 400);
    }

    const emailConfig = getEmailConfig();
    const providerIssue = describeEmailProviderIssue();

    if (emailConfig.onVercel && providerIssue) {
      return json({ error: providerIssue }, 400);
    }

    const unsubscribed = testOnly ? new Set() : await fetchUnsubscribedEmailSet();
    const eligible = clients.filter(
      (c) => c.email && !unsubscribed.has(String(c.email).trim().toLowerCase())
    );
    const skippedUnsubscribed = clients.length - eligible.length;
    const campaignTpl = getOffreEteClientCampaignTemplate();
    const useOffreEteVariants =
      Boolean(offreEteCampaign) ||
      (isOffreEteCampaignSubject(subject) && message === campaignTpl.message);

    const batch = await sendBulkEmails({
      recipients: eligible,
      getEmail: (c) => c.email,
      getRecipientName: clientGreetingName,
      getMessage: useOffreEteVariants
        ? (c) =>
            pickRandomOffreEteEmailMessage({
              prenom: c.prenom,
              nom: c.nom,
              salle: c.salle,
            })
        : undefined,
      getClientId: (c) => c.id,
      message,
      subject,
      html,
      preheader: campaignTpl.preheader,
      isMarketing: true,
      mailjetAccount,
      mailjetRotateAccounts: Boolean(mailjetRotateAccounts),
      mailjetStartIndex: Number.isFinite(mailjetStartIndex) ? mailjetStartIndex : 0,
      allowBotFallback: false,
    });

    const warnings = [...(batch.warnings || [])];
    if (skippedUnsubscribed > 0) {
      warnings.push(`${skippedUnsubscribed} client(s) ignoré(s) (désabonnés).`);
    }
    if (useOffreEteVariants) {
      warnings.push(
        'Email : variante aléatoire par destinataire (prénom + formulation différente, anti-spam).'
      );
    }
    batch.email.skipped += skippedUnsubscribed;

    return json({
      success: true,
      clients: clients.length,
      ...batch,
      warnings,
    });
  } catch (e) {
    console.error('[clients/send-email]', e);
    return json({ error: e.message || 'Erreur envoi email' }, { status: 500 });
  }
}
