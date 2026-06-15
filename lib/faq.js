import faqData from '../data/faq.json';

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  const n = normalize(str);
  return n ? n.split(' ').filter((w) => w.length > 2) : [];
}

export function getFaqList() {
  return faqData;
}

/** Retourne { match, score } ou null si aucune correspondance suffisante. */
export function matchFaq(query) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return null;

  let best = null;
  for (const item of faqData) {
    const haystack = normalize(
      [item.question, item.answer, ...(item.keywords || [])].join(' ')
    );
    const hayTokens = new Set(haystack.split(' '));
    let score = 0;
    for (const t of qTokens) {
      if (hayTokens.has(t)) score += 1;
      if (haystack.includes(t)) score += 0.5;
    }
    const qNorm = normalize(query);
    const questionNorm = normalize(item.question);
    if (qNorm.includes(questionNorm.slice(0, 12)) || questionNorm.includes(qNorm)) {
      score += 3;
    }
    if (!best || score > best.score) {
      best = { item, score };
    }
  }

  const threshold = Math.max(1.5, qTokens.length * 0.35);
  if (!best || best.score < threshold) return null;
  return { match: best.item, score: best.score };
}
