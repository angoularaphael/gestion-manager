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
      { href: '/admin/envoyer-managers', text: 'Envoyer', icon: 'send' },
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
    label: 'Entraîneurs',
    sectionClass: 'contacts',
    accent: 'green',
    links: [
      { href: '/admin/entraineurs', text: 'Liste', icon: 'glove' },
      { href: '/admin/envoyer-entraineurs', text: 'Envoyer', icon: 'send' },
    ],
  },
  {
    label: 'Groupe Chabane',
    sectionClass: 'contacts',
    accent: 'gold',
    links: [
      { href: '/admin/groupe-chabane', text: 'Liste', icon: 'users' },
      { href: '/admin/envoyer-groupe-chabane', text: 'Envoyer', icon: 'send' },
    ],
  },
  {
    label: 'Marketing',
    sectionClass: 'contacts',
    accent: 'gold',
    links: [
      { href: '/admin/offre-ete', text: 'Offre Été 2026', icon: 'megaphone', featured: true },
      { href: '/admin/equipe-portet', text: 'Équipe Portet', icon: 'users', featured: true },
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
  '/admin/envoyer': 'Envoyer par pays',
  '/admin/envoyer-managers': 'Envoyer managers',
  '/admin/promoteurs': 'Promoteurs',
  '/admin/envoyer-promoteurs': 'Envoyer promoteurs',
  '/admin/entraineurs': 'Entraîneurs',
  '/admin/envoyer-entraineurs': 'Envoyer entraîneurs',
  '/admin/equipe-portet': 'Équipe Portet',
  '/admin/groupe-chabane': 'Groupe Chabane',
  '/admin/envoyer-groupe-chabane': 'Envoyer Groupe Chabane',
  '/admin/whatsapp': 'WhatsApp',
  '/admin/utilisateurs': 'Administrateurs',
  '/admin/offre-ete': 'Offre Été 2026',
  '/admin/chatbot': 'Chatbot Portet',
};

export function titleForPath(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path !== '/admin' && pathname.startsWith(path)) return title;
  }
  return 'Boxing Center';
}
