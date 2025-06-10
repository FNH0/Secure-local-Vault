'use client';

import { AppLogo } from '@/components/common/AppLogo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { LogOut } from 'lucide-react';

export function VaultHeader() {
  const { logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0 bg-sidebar-background">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1.5">
          <span className="block h-3 w-3 rounded-full bg-red-500"></span>
          <span className="block h-3 w-3 rounded-full bg-yellow-500"></span>
          <span className="block h-3 w-3 rounded-full bg-green-500"></span>
        </div>
        <AppLogo imageRenderHeightPx={20} textSize="text-lg" />
      </div>
      <Button variant="ghost" size="sm" onClick={logout} className="text-primary hover:text-primary/80 hover:bg-sidebar-accent">
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </header>
  );
}
