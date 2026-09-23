import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: {
    default: 'DARK SYNDICATE GAMING WORLD',
    template: '%s | DARK SYNDICATE',
  },
  description:
    'Premium gaming zone experience — PS5 gaming, pool tables, and more. Book your session and own the night at Dark Syndicate Gaming World.',
  keywords: [
    'gaming zone',
    'PS5 gaming',
    'pool table',
    'esports',
    'gaming cafe',
    'book gaming session',
    'dark syndicate',
  ],
  authors: [{ name: 'Dark Syndicate Gaming World' }],
  openGraph: {
    title: 'DARK SYNDICATE GAMING WORLD',
    description:
      'Premium gaming zone — PS5, pool tables, and more. Enter the game. Own the night.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0A111C" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
