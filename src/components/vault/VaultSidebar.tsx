
'use client';

import { FileText, Settings } from 'lucide-react'; 
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'All Files', href: '/vault', icon: FileText },
  { name: 'Settings', href: '/vault/settings', icon: Settings },
  // Add more items here if needed, e.g., { name: 'Recents', href: '/vault/recents', icon: Clock }
];

export function VaultSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-sidebar-background p-4">
      <nav className="flex flex-col space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              pathname === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            )}
          >
            <item.icon className="mr-3 h-5 w-5 shrink-0 text-primary group-hover:text-sidebar-accent-foreground" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
