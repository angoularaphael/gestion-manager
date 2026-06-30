import { getSupabase } from './supabase';

export async function logCampaignOutbound({
  campaign,
  channel,
  recipient,
  subject = null,
  body = '',
  status = 'sent',
  error = null,
  clientId = null,
  botInstance = null,
}) {
  const sb = getSupabase();
  const payload = {
    campaign,
    channel,
    recipient,
    subject,
    body: body || '(campagne)',
    status,
    error,
    client_id: clientId || null,
    bot_instance: botInstance || null,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  };

  const { data, error: insertErr } = await sb
    .from('outbound_messages')
    .insert(payload)
    .select('id')
    .single();

  if (insertErr) throw insertErr;
  return data;
}

export async function fetchCampaignSentEmails(campaign) {
  const sb = getSupabase();
  const sent = new Set();
  const pageSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await sb
      .from('outbound_messages')
      .select('recipient')
      .eq('campaign', campaign)
      .eq('channel', 'email')
      .in('status', ['sent', 'pending'])
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    for (const row of data) {
      const email = String(row.recipient || '')
        .trim()
        .toLowerCase();
      if (email) sent.add(email);
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return sent;
}
