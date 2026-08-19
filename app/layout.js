import { DM_Sans, Oswald } from 'next/font/google';
import AppBoot from './components/AppBoot';
import './globals.css';

const fontDisplay = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

const fontBody = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

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
      { url: '/favicon.svg?v=bc5', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=bc5', sizes: 'any' },
      { url: '/favicon.png?v=bc5', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png?v=bc5', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png?v=bc5', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png?v=bc5', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a1020',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <AppBoot>{children}</AppBoot>
      </body>
    </html>
  );
}
