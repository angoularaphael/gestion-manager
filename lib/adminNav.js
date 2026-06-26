export const ADMIN_NAV = [
  {
    label: 'Menu',
    sectionClass: 'menu-section',
    links: [
      { href: '/admin', text: 'Tableau de bord', icon: 'grid', featured: true },
      { href: '/admin/envoyer', text: 'Envoyer', icon: 'send', featured: true },
    ],
  },
  {
    label: 'Managers',
    sectionClass: 'contacts',
    accent: 'blue',
    links: [{ href: '/admin/managers', text: 'Liste', icon: 'users' }],
  },
  {
    label: 'Promoteurs',
    sectionClass: 'contacts',
    accent: 'gold',
    links: [{ href: '/admin/promoteurs', text: 'Liste', icon: 'megaphone' }],
  },
  {
    label: 'Entraîneurs',
    sectionClass: 'contacts',
    accent: 'green',
    links: [{ href: '/admin/boxeurs', text: 'Liste', icon: 'glove' }],
  },
  {
    label: 'Groupe Chabane',
    sectionClass: 'contacts',
    accent: 'gold',
    links: [{ href: '/admin/groupe-chabane', text: 'Liste', icon: 'users' }],
  },
  {
    label: 'Clients',
    sectionClass: 'contacts',
    accent: 'blue',
    links: [{ href: '/admin/clients', text: 'Liste', icon: 'users' }],
  },
  {
    label: 'Marketing',
    sectionClass: 'contacts',
    accent: 'gold',
    links: [
      { href: '/admin/offre-ete', text: 'Offre Été 2026', icon: 'megaphone', featured: true },
      { href: '/admin/campagne-whatsapp', text: 'Campagne WA 3 bots', icon: 'chat', featured: true },
      { href: '/admin/chatbot', text: 'Chatbot Portet', icon: 'chat', featured: true },
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
  '/admin/envoyer-managers': 'Envoyer managers',
  '/admin/promoteurs': 'Promoteurs',
  '/admin/envoyer-promoteurs': 'Envoyer promoteurs',
  '/admin/boxeurs': 'Entraîneurs',
  '/admin/envoyer-boxeurs': 'Envoyer entraîneurs',
  '/admin/groupe-chabane': 'Groupe Chabane',
  '/admin/envoyer-groupe-chabane': 'Envoyer Groupe Chabane',
  '/admin/whatsapp': 'WhatsApp',
  '/admin/utilisateurs': 'Administrateurs',
  '/admin/offre-ete': 'Offre Été 2026',
  '/admin/campagne-whatsapp': 'Campagne WhatsApp',
  '/admin/chatbot': 'Chatbot Portet',
  '/admin/clients': 'Clients',
  '/admin/envoyer-clients': 'Envoyer clients',
};

export function titleForPath(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path !== '/admin' && pathname.startsWith(path)) return title;
  }
  return 'Boxing Center';
}
