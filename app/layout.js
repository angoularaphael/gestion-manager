import './globals.css';

export const metadata = {
  title: 'Boxing Center — Gestion managers',
  description: 'Console messagerie managers boxe',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
