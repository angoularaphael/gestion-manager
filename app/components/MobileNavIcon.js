export default function MobileNavIcon({ name, active = false }) {
  const stroke = active ? 'currentColor' : 'currentColor';

  switch (name) {
    case 'grid':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="1.5" stroke={stroke} strokeWidth="1.8" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" stroke={stroke} strokeWidth="1.8" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" stroke={stroke} strokeWidth="1.8" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" stroke={stroke} strokeWidth="1.8" />
        </svg>
      );
    case 'users':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9" cy="8" r="3.5" stroke={stroke} strokeWidth="1.8" />
          <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 8.5a2.5 2.5 0 1 1 0-5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18.5 19c0-2.2-1.4-4-3.5-4.7" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'send':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12L20 4l-3.5 16L11 13 4 12z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M11 13l2.5 5.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'chat':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'shield':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'refresh':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 12a8 8 0 1 1-2.3-5.7" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M20 4v5h-5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'home':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19v-8.5z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'logout':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 12H4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18 8l4 4-4 4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
