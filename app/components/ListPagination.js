'use client';

function buildVisiblePages(current, total) {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages = new Set([0, total - 1, current]);
  for (let d = -1; d <= 1; d++) {
    const p = current + d;
    if (p >= 0 && p < total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…');
    out.push(sorted[i]);
  }
  return out;
}

export default function ListPagination({
  page,
  totalPages,
  onPageChange,
  totalItems = 0,
  pageSize = 10,
}) {
  if (!totalItems) return null;

  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const from = safePage * pageSize + 1;
  const to = Math.min((safePage + 1) * pageSize, totalItems);
  const visible = buildVisiblePages(safePage, totalPages);

  if (totalPages <= 1) {
    return (
      <p className="manager-pagination-single muted">
        {totalItems} résultat{totalItems > 1 ? 's' : ''}
      </p>
    );
  }

  return (
    <nav className="list-pagination" aria-label="Pagination">
      <button
        type="button"
        className="btn ghost sm"
        disabled={safePage <= 0}
        onClick={() => onPageChange(Math.max(0, safePage - 1))}
      >
        Précédent
      </button>

      <div className="list-pagination-pages" role="group" aria-label="Numéros de page">
        {visible.map((item, idx) =>
          item === '…' ? (
            <span key={`gap-${idx}`} className="list-pagination-ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`list-pagination-page${item === safePage ? ' on' : ''}`}
              aria-label={`Page ${item + 1}`}
              aria-current={item === safePage ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item + 1}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        className="btn ghost sm"
        disabled={safePage >= totalPages - 1}
        onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
      >
        Suivant
      </button>

      <span className="list-pagination-meta muted">
        {from}–{to} sur {totalItems} · page {safePage + 1}/{totalPages}
      </span>
    </nav>
  );
}
