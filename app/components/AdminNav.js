'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: '📊' },
  { href: '/admin/managers', label: 'Managers', icon: '👥' },
  { href: '/admin/envoyer', label: 'Envoyer', icon: '✉️' },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: '💬' },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: '🔐' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav>
      {NAV.map((item) => {
        const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={active ? 'active' : ''}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
