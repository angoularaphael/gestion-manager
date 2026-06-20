import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(__dirname, '../.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}

function normalizeFrenchPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('33') && digits.length >= 11) return `0${digits.slice(-9)}`;
  if (digits.length === 10 && digits.startsWith('0')) return digits;
  if (digits.length === 9 && /^[1-9]/.test(digits)) return `0${digits}`;
  return digits;
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const PAGE = 1000;
const CHUNK = 200;
let from = 0;
let scanned = 0;
let updated = 0;
let unchanged = 0;
const toUpdate = [];

while (true) {
  const { data, error } = await sb.from('portet_clients').select('id, telephone').range(from, from + PAGE - 1);
  if (error) throw error;
  if (!data?.length) break;
  for (const row of data) {
    scanned++;
    const raw = row.telephone;
    if (!raw || !String(raw).trim()) {
      unchanged++;
      continue;
    }
    const normalized = normalizeFrenchPhone(raw);
    const digits = normalized?.replace(/\D/g, '') || '';
    if (digits.length === 10 && digits.startsWith('0') && normalized !== String(raw).trim()) {
      toUpdate.push({ id: row.id, telephone: normalized });
    } else {
      unchanged++;
    }
  }
  if (data.length < PAGE) break;
  from += PAGE;
}

const now = new Date().toISOString();
for (let i = 0; i < toUpdate.length; i += CHUNK) {
  const chunk = toUpdate.slice(i, i + CHUNK);
  await Promise.all(
    chunk.map(async ({ id, telephone }) => {
      const { error } = await sb.from('portet_clients').update({ telephone, updated_at: now }).eq('id', id);
      if (error) throw error;
      updated++;
    })
  );
  process.stdout.write(`\r${updated}/${toUpdate.length}…`);
}

const { count: withPhone } = await sb
  .from('portet_clients')
  .select('*', { count: 'exact', head: true })
  .not('telephone', 'is', null)
  .neq('telephone', '');

console.log('\nDone', { scanned, updated, unchanged, withPhone });
