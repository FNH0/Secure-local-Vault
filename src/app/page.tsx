
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth(); // activeUsername and derivedKey imply authentication

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/vault');
      } else {
        // If not authenticated and not loading, always go to login.
        // The login page itself will handle if it's a first-time setup (signup) or login.
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg">Loading Secure Vault...</p>
    </div>
  );
}
