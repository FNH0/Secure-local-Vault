import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'FNH Secure Vault',
  description: 'Locally encrypted secure file vault',
  // Adding icons metadata for Next.js to handle favicon
  icons: {
    icon: '/favicon.png', // Path to your favicon in the public directory
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* Explicitly linking favicon.png for broader compatibility, though Next.js 13+ metadata.icons should also work */}
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
