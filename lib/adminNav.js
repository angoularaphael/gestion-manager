export const ADMIN_NAV = [
  {
    label: 'Pilotage',
    links: [
      { href: '/admin', icon: '📊', text: 'Tableau de bord' },
    ],
  },
  {
    label: 'Managers',
    links: [
      { href: '/admin/managers', icon: '👥', text: 'Liste managers' },
      { href: '/admin/envoyer', icon: '✉️', text: 'Envoyer message' },
    ],
  },
  {
    label: 'Système',
    links: [
      { href: '/admin/whatsapp', icon: '💬', text: 'WhatsApp Bot' },
      { href: '/admin/utilisateurs', icon: '🔐', text: 'Utilisateurs' },
    ],
  },
];

export const PAGE_TITLES = {
  '/admin': 'Tableau de bord',
  '/admin/managers': 'Managers',
  '/admin/envoyer': 'Envoyer un message',
  '/admin/whatsapp': 'WhatsApp',
  '/admin/utilisateurs': 'Utilisateurs',
};

export function titleForPath(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path !== '/admin' && pathname.startsWith(path)) return title;
  }
  return 'Boxing Center';
}
