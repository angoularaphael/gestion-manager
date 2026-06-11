export const ADMIN_NAV = [
  {
    label: 'Menu',
    sectionClass: 'menu-section',
    links: [{ href: '/admin', text: 'Tableau de bord', icon: 'grid', featured: true }],
  },
  {
    label: 'Managers',
    sectionClass: 'contacts',
    accent: 'blue',
    links: [
      { href: '/admin/managers', text: 'Liste', icon: 'users' },
      { href: '/admin/envoyer', text: 'Envoyer', icon: 'send' },
    ],
  },
  {
    label: 'Promoteurs',
    sectionClass: 'contacts',
    accent: 'gold',
    links: [
      { href: '/admin/promoteurs', text: 'Liste', icon: 'megaphone' },
      { href: '/admin/envoyer-promoteurs', text: 'Envoyer', icon: 'send' },
    ],
  },
  {
    label: 'Boxeurs',
    sectionClass: 'contacts',
    accent: 'green',
    links: [
      { href: '/admin/boxeurs', text: 'Liste', icon: 'glove' },
      { href: '/admin/envoyer-boxeurs', text: 'Envoyer', icon: 'send' },
    ],
  },
  {
    label: 'Paramètres',
    links: [
      { href: '/admin/whatsapp', text: 'WhatsApp', icon: 'chat' },
      { href: '/admin/utilisateurs', text: 'Administrateurs', icon: 'shield', superAdminOnly: true },
    ],
  },
];

export const PAGE_TITLES = {
  '/admin': 'Tableau de bord',
  '/admin/managers': 'Managers',
  '/admin/envoyer': 'Envoyer',
  '/admin/promoteurs': 'Promoteurs',
  '/admin/envoyer-promoteurs': 'Envoyer promoteurs',
  '/admin/boxeurs': 'Boxeurs',
  '/admin/envoyer-boxeurs': 'Envoyer boxeurs',
  '/admin/whatsapp': 'WhatsApp',
  '/admin/utilisateurs': 'Administrateurs',
};

export function titleForPath(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path !== '/admin' && pathname.startsWith(path)) return title;
  }
  return 'Boxing Center';
}
