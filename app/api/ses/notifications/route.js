import { NextResponse } from 'next/server';
import { recordEmailUnsubscribe } from '../../../../lib/emailUnsubscribes';

/** Webhook SNS Amazon SES — bounce / complaint → désinscription. */
export async function POST(request) {
  const raw = await request.text();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (payload.Type === 'SubscriptionConfirmation' && payload.SubscribeURL) {
    await fetch(payload.SubscribeURL).catch(() => {});
    return NextResponse.json({ ok: true, subscribed: true });
  }

  let notification = payload;
  if (payload.Type === 'Notification' && payload.Message) {
    try {
      notification = JSON.parse(payload.Message);
    } catch {
      notification = payload;
    }
  }

  const type = String(notification.notificationType || notification.eventType || '').toLowerCase();
  const emails = [];
  if (type.includes('bounce')) {
    for (const r of notification.bounce?.bouncedRecipients || []) {
      if (r.emailAddress) emails.push(String(r.emailAddress).toLowerCase());
    }
  }
  if (type.includes('complaint')) {
    for (const r of notification.complaint?.complainedRecipients || []) {
      if (r.emailAddress) emails.push(String(r.emailAddress).toLowerCase());
    }
  }

  if (emails.length) {
    for (const email of emails) {
      await recordEmailUnsubscribe({ email }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, unsubscribed: emails.length });
}
