import { NextResponse } from 'next/server';
import { getEmailConfig } from '../../../../lib/emailConfig';
import { getSession } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const config = getEmailConfig();

  let hint = 'Configuration email détectée.';
  if (config.issue) {
    hint = config.issue;
  } else if (config.provider === 'mailjet') {
    const count = config.mailjet.accounts.filter((a) => a.configured).length;
    hint = `${count} compte(s) Mailjet actif(s). Vérifiez SPF + DKIM sur boxingcenter.fr avant la grosse campagne.`;
  } else {
    hint = 'Clé API Brevo détectée. Les emails partent via Brevo REST depuis Vercel.';
  }

  const deliverability = {
    checklist: [
      'Expéditeur en @boxingcenter.fr (pas Gmail) sur chaque compte Mailjet',
      'SPF : v=spf1 include:spf.mailjet.com ~all (ajouter Google si vous utilisez Gmail pro)',
      'DKIM : 3 enregistrements CNAME fournis par Mailjet → DNS boxingcenter.fr',
      'DMARC : v=DMARC1; p=none; rua=mailto:boxingcenter31@gmail.com (surveiller puis durcir)',
      'Réchauffer : 50–200 emails le 1er jour, puis augmenter progressivement',
      'Tester avec « Test giffareno237 » et vérifier boîte principale + spam',
      'Exécuter supabase/email_unsubscribes.sql (lien Se désabonner obligatoire)',
    ],
    senderUsesOwnDomain: (config.senderEmail || '').includes('@boxingcenter.fr'),
  };

  return NextResponse.json({
    ...config,
    ready: !config.issue,
    hint,
    deliverability,
  });
}
