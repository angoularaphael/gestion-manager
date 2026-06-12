const TEST_TARGET_EMAIL = 'linuxcam05@gmail.com';
const TEST_TARGET_PHONE = '237693646080';

export function testContactFallback() {
  return {
    nom: 'atangana',
    email: TEST_TARGET_EMAIL,
    telephone: TEST_TARGET_PHONE,
    id: null,
  };
}

export async function resolveContactsForSend({
  table,
  ids,
  idField,
  testOnly,
  broadcast,
  fetchTestRow,
}) {
  if (testOnly) {
    if (fetchTestRow) {
      const test = await fetchTestRow();
      if (test) return [test];
    }
    return [testContactFallback()];
  }

  const sb = (await import('./supabase')).getSupabase();

  if (broadcast) {
    let query = sb.from(table).select('*').order('nom', { ascending: true });
    if (broadcast === 'email') query = query.eq('has_email', true);
    else if (broadcast === 'phone' || broadcast === 'whatsapp') query = query.eq('has_phone', true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (Array.isArray(ids) && ids.length) {
    const { data, error } = await sb.from(table).select('*').in('id', ids);
    if (error) throw new Error(error.message);
    return data || [];
  }

  throw new Error(`${idField}, broadcast ou test_only requis`);
}
