'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Database, Puzzle, Plug, Bot, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard/personality', label: 'Personalidade', icon: User },
  { href: '/dashboard/knowledge', label: 'Base de conhecimento', icon: Database },
  { href: '/dashboard/skills', label: 'Habilidades', icon: Puzzle },
  { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: Smartphone },
  { href: '/dashboard/channels', label: 'Canais', icon: Plug },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card p-4 flex flex-col">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Bot className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">ZapFlow</h1>
      </Link>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10',
              pathname === item.href && 'bg-primary/10 text-primary font-semibold'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
