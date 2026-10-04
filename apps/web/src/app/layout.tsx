import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://lumora.app'),
  title: 'Lumora — Creator Subscriptions & Fan Community',
  description: 'The premium creator platform for independent adult creators, exclusive content, livestreams, and community.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
        {children}
      </body>
    </html>
  );
}
