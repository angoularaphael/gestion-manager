import { NextResponse } from 'next/server';
import { describeBrevoKeyIssue, getBrevoConfig } from '../../../../lib/brevoSend';
import { getSession } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const config = getBrevoConfig();
  const issue = describeBrevoKeyIssue();

  return NextResponse.json({
    ...config,
    ready: !issue,
    issue,
    hint: issue
      ? issue
      : 'Clé API détectée. Les emails partent via Brevo REST depuis Vercel.',
  });
}
