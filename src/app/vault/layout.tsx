'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/providers/AuthProvider';
import { VaultProvider } from '@/providers/VaultProvider';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/common/AppLogo';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, UserCircle, FileText, Settings, KeyRound } from 'lucide-react';

const navItems = [
  { name: 'All Files', href: '/vault', icon: FileText },
  { name: 'Credentials', href: '/vault/credentials', icon: KeyRound },
  { name: 'Settings', href: '/vault/settings', icon: Settings },
];

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthGuard();
  const { logout, activeUsername } = useAuth();
  const pathname = usePathname();

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <VaultProvider>
      <SidebarProvider>
        {/* Desktop and Mobile Sheet Sidebar */}
        <Sidebar>
          <SidebarHeader className="flex-row items-center gap-2">
             <div className="flex items-center space-x-1.5">
                <span className="block h-3 w-3 rounded-full bg-red-500"></span>
                <span className="block h-3 w-3 rounded-full bg-yellow-500"></span>
                <span className="block h-3 w-3 rounded-full bg-green-500"></span>
             </div>
             <AppLogo imageRenderHeightPx={20} textSize="text-lg" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.href === '/vault' ? pathname === '/vault' : pathname.startsWith(item.href)}
                    className="justify-start"
                  >
                    <Link href={item.href}>
                      <item.icon className="text-primary" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="items-start gap-3">
             {activeUsername && (
              <div className="flex w-full items-center space-x-2 text-sm text-sidebar-foreground px-2">
                <UserCircle className="h-5 w-5 text-primary" />
                <span className="truncate">{activeUsername}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-primary hover:text-primary/80 hover:bg-sidebar-accent">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset>
          {/* Mobile-only Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:hidden">
             <SidebarTrigger />
             <div className="flex items-center gap-2">
                {activeUsername && (
                    <div className="flex items-center gap-1 text-sm text-foreground">
                        <UserCircle className="h-5 w-5 text-primary" />
                        <span className="truncate">{activeUsername}</span>
                    </div>
                )}
                <Button variant="ghost" size="icon" onClick={logout} className="text-primary hover:text-primary/80 hover:bg-sidebar-accent">
                    <LogOut className="h-4 w-4" />
                </Button>
             </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </VaultProvider>
  );
}
