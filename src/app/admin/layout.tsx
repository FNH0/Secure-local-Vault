
import type { Metadata } from 'next';
import '../globals.css'; // Ensure global styles apply
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/providers/AuthProvider'; // AuthProvider is needed for admin actions

export const metadata: Metadata = {
  title: 'FNH Secure Vault - Admin Panel',
  description: 'Admin panel for FNH Secure Vault',
};

export default function AdminLayout({
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
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <AuthProvider> {/* AuthProvider wraps admin content to provide context for admin actions */}
          <div className="min-h-screen flex flex-col">
            <header className="bg-card border-b border-border p-4">
              <h1 className="text-xl font-semibold text-primary">FNH Secure Vault - Admin Panel</h1>
            </header>
            <main className="flex-grow p-6">
              {children}
            </main>
            <footer className="text-center p-4 text-sm text-muted-foreground border-t border-border">
              Secure Vault Admin Interface
            </footer>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

    