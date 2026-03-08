
'use client';

import { ReactNode } from 'react';
import { useAppStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Package, LogOut, LayoutGrid, ClipboardList, Truck, Users } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { setUser } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    setUser(null);
    router.push('/');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard/admin', icon: LayoutGrid },
    { name: 'Products', href: '/dashboard/admin/products', icon: Package },
    { name: 'Orders', href: '/dashboard/admin/orders', icon: ClipboardList },
    { name: 'Fleet', href: '/dashboard/admin/fleet', icon: Truck },
    { name: 'Customers', href: '/dashboard/admin/customers', icon: Users },
    { name: 'Categories', href: '/dashboard/admin/categories', icon: LayoutGrid },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="h-16 bg-white border-b px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-headline text-primary">SwiftCart Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </nav>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-white border-r p-4 hidden md:block">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors",
                  pathname === item.href 
                    ? "bg-primary text-white" 
                    : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto p-2 bg-white border-b no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                pathname === item.href 
                  ? "bg-primary text-white" 
                  : "bg-slate-50 text-muted-foreground hover:bg-slate-100"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
