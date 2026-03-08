
'use client';

import { ReactNode, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { ShoppingCart, LayoutGrid, Heart, Home as HomeIcon, Package, User as UserIcon, LogOut, MapPin, ChevronDown, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore, useDoc, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const { cart, user, setUser, searchQuery, setSearchQuery } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const db = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const userProfileRef = useMemo(() => firebaseUser?.uid ? doc(db, 'customers', firebaseUser.uid) : null, [db, firebaseUser?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (!isClient || isUserLoading) return;
    if (!firebaseUser) {
      router.replace('/auth/customer');
      return;
    }
    if (!isProfileLoading && !profile && pathname !== '/dashboard/customer/onboarding') {
      router.replace('/dashboard/customer/onboarding');
    }
  }, [isClient, firebaseUser, isUserLoading, profile, isProfileLoading, pathname, router]);

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    router.push('/');
  };

  const navItems = [
    { name: 'Home', href: '/dashboard/customer', icon: HomeIcon },
    { name: 'Categories', href: '/dashboard/customer/categories', icon: LayoutGrid },
    { name: 'Favorites', href: '/dashboard/customer/favorites', icon: Heart },
    { name: 'Orders', href: '/dashboard/customer/orders', icon: Package },
    { name: 'Cart', href: '/dashboard/customer/cart', icon: ShoppingCart, badge: cart.length },
  ];

  if (!isClient) return null;

  // Onboarding page has its own layout/header
  if (pathname === '/dashboard/customer/onboarding') {
    return <main className="min-h-screen bg-white">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      <header className="bg-white px-4 py-3 sticky top-0 z-50 shadow-sm border-b border-slate-50 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <div className="flex flex-col cursor-pointer min-w-0" onClick={() => router.push('/dashboard/customer/onboarding')}>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-900">Delivering in 9 mins</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
              <span className="text-sm font-black text-slate-900 line-clamp-1 truncate">
                {profile?.address || 'Set delivery location'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 h-9 w-9">
                  <UserIcon className="h-5 w-5 text-slate-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl w-48">
                <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{firebaseUser?.displayName || 'My Profile'}</div>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={() => router.push('/dashboard/customer/onboarding')} className="font-bold cursor-pointer"><MapPin className="h-4 w-4 mr-2" /> Edit Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/customer/orders')} className="font-bold cursor-pointer"><Package className="h-4 w-4 mr-2" /> My Orders</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive font-bold cursor-pointer"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder='Search groceries...' 
            className="pl-9 h-11 bg-slate-50 border-none rounded-xl text-sm font-bold focus-visible:ring-primary shadow-inner"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xl z-50">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1", pathname === item.href ? 'text-primary' : 'text-slate-400')}>
            <div className="relative">
              <item.icon className={cn("h-6 w-6", pathname === item.href && item.name === 'Favorites' && 'fill-primary')} />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{item.badge}</span>
              )}
            </div>
            <span className="text-[10px] font-bold">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
