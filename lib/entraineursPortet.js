import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = path.join(process.cwd(), 'data', 'entraineurs-portet.json');

let cached = null;

function loadRaw() {
  if (cached) return cached;
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  cached = JSON.parse(raw);
  return cached;
}

export function getEntraineursPortetMeta() {
  const data = loadRaw();
  return {
    site: data.site,
    updated_at: data.updated_at,
    count: (data.entraineurs || []).length,
  };
}

export function getEntraineursPortetList() {
  const rows = loadRaw().entraineurs || [];
  return [...rows].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
}

export function getEntraineurPortetById(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  return getEntraineursPortetList().find((e) => String(e.id) === key) || null;
}
