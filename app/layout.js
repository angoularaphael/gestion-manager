import AppBoot from './components/AppBoot';
import './globals.css';

export const metadata = {
  title: 'Boxing Center — Gestion managers',
  description: 'Gestionnaire des managers Boxing Center',
  applicationName: 'Boxing Center',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Boxing Center',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AppBoot>{children}</AppBoot>
      </body>
    </html>
  );
}
