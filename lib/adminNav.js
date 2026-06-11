export const ADMIN_NAV = [
  {
    label: 'Menu',
    links: [
      { href: '/admin', text: 'Tableau de bord' },
    ],
  },
  {
    label: 'Managers',
    links: [
      { href: '/admin/managers', text: 'Liste' },
      { href: '/admin/envoyer', text: 'Envoyer' },
    ],
  },
  {
    label: 'Paramètres',
    links: [
      { href: '/admin/whatsapp', text: 'WhatsApp' },
      { href: '/admin/utilisateurs', text: 'Utilisateurs' },
    ],
  },
];

export const PAGE_TITLES = {
  '/admin': 'Tableau de bord',
  '/admin/managers': 'Managers',
  '/admin/envoyer': 'Envoyer',
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
