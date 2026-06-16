export const MOBILE_TABS = [
  { href: '/admin', label: 'Accueil', icon: 'grid', exact: true },
  { href: '/admin/managers', label: 'Managers', icon: 'users' },
  { href: '/admin/promoteurs', label: 'Promoteurs', icon: 'megaphone' },
  { href: '/admin/boxeurs', label: 'Boxeurs', icon: 'glove' },
  { href: '/admin/envoyer', label: 'Envoyer', icon: 'send' },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: 'chat' },
  { href: '/admin/utilisateurs', label: 'Admin', icon: 'shield', superAdminOnly: true },
];

export function isTabActive(pathname, href, exact = false) {
  if (href === '/admin/envoyer') {
    return pathname === '/admin/envoyer' || pathname.startsWith('/admin/envoyer-');
  }
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
