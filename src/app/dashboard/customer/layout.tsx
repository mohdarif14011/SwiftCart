
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { ShoppingCart, LayoutGrid, Heart, Home as HomeIcon, Package, User as UserIcon, LogOut, MapPin, ChevronDown, Search, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const { cart, setUser, searchQuery, setSearchQuery } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const db = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { 
    setIsClient(true); 
  }, []);

  const userProfileRef = useMemoFirebase(() => firebaseUser?.uid ? doc(db, 'customers', firebaseUser.uid) : null, [db, firebaseUser?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    // Only perform navigation logic when client is ready and initial loading is complete
    if (!isClient || isUserLoading || isProfileLoading) return;

    // 1. Auth Gate
    if (!firebaseUser) {
      router.replace('/auth/customer');
      return;
    }

    const isOnOnboarding = pathname === '/dashboard/customer/onboarding';

    // 2. Profile Gate: Forced Onboarding
    // If user has no profile document AND is not on the onboarding page, they MUST go to onboarding.
    if (!profile && !isOnOnboarding) {
      router.replace('/dashboard/customer/onboarding');
      return;
    }
  }, [isClient, firebaseUser, isUserLoading, profile, isProfileLoading, pathname, router]);

  if (!isClient) return null;

  const navItems = [
    { name: 'Home', href: '/dashboard/customer', icon: HomeIcon },
    { name: 'Categories', href: '/dashboard/customer/categories', icon: LayoutGrid },
    { name: 'Favorites', href: '/dashboard/customer/favorites', icon: Heart },
    { name: 'Orders', href: '/dashboard/customer/orders', icon: Package },
  ];

  // Show a clean loading state while determining auth/profile status to prevent layout flashes
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="bg-primary/10 p-4 rounded-full animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Synchronizing...
        </p>
      </div>
    );
  }

  // Specialized full-screen views (No global header/nav)
  if (pathname === '/dashboard/customer/onboarding' || pathname === '/dashboard/customer/cart') {
    return <main className="min-h-screen bg-white">{children}</main>;
  }

  const isHomePage = pathname === '/dashboard/customer';

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      <header className={cn(
        "bg-white px-4 py-2 sticky top-0 z-50 shadow-sm border-b border-slate-50 flex flex-col gap-2 transition-all",
        !isHomePage && "hidden"
      )}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <div className="flex flex-col cursor-pointer min-w-0" onClick={() => router.push('/dashboard/customer/onboarding')}>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Delivering in 9 mins</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
              <span className="text-sm font-bold text-slate-900 line-clamp-1 truncate leading-tight">
                {profile?.address || 'Set delivery location'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-slate-50 h-9 w-9 relative"
              onClick={() => router.push('/dashboard/customer/cart')}
            >
              <ShoppingCart className="h-5 w-5 text-slate-700" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 h-9 w-9">
                  <UserIcon className="h-5 w-5 text-slate-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl w-48">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{firebaseUser?.displayName || 'My Profile'}</div>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={() => router.push('/dashboard/customer/onboarding')} className="font-medium cursor-pointer"><MapPin className="h-4 w-4 mr-2" /> Edit Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/customer/orders')} className="font-medium cursor-pointer"><Package className="h-4 w-4 mr-2" /> My Orders</DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { await auth.signOut(); setUser(null); router.push('/'); }} className="text-destructive font-medium cursor-pointer"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            placeholder='Search groceries...' 
            className="w-full pl-9 h-10 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-2 flex items-center justify-between shadow-2xl z-50">
        {navItems.map((item) => (
          <div key={item.href} onClick={() => router.push(item.href)} className={cn("flex flex-col items-center gap-0.5 cursor-pointer", pathname === item.href ? 'text-primary' : 'text-slate-400')}>
            <div className="relative">
              <item.icon className={cn("h-5 w-5", pathname === item.href && (item.name === 'Favorites' || item.name === 'Home') && 'fill-current opacity-100')} />
            </div>
            <span className="text-[10px] font-semibold">{item.name}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
