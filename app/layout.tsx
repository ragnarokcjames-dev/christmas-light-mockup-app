import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Holiday Lighting Mockups',
  description: 'AI Christmas light mockups, organized by customer.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="app-header">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="brand">🎄 Holiday Lighting Mockups</div>
          </Link>
          <div className="tagline">customer mockups, saved and organized</div>
        </header>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
