'use client';

import type React from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { VaultHeader } from '@/components/vault/VaultHeader';
import { VaultSidebar } from '@/components/vault/VaultSidebar';
import { Loader2 } from 'lucide-react';
import { VaultProvider } from '@/providers/VaultProvider';

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthGuard();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <VaultProvider>
      <div className="flex h-screen flex-col bg-background text-foreground">
        <VaultHeader />
        <div className="flex flex-1 overflow-hidden">
          <VaultSidebar />
          <main className="flex-1 overflow-y-auto p-6 bg-background"> {/* Changed from bg-muted to bg-background */}
            {children}
          </main>
        </div>
      </div>
    </VaultProvider>
  );
}
