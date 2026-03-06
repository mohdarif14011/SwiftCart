
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ShoppingCart, 
  Package, 
  MapPin, 
  Clock,
  ChevronDown,
  Mic,
  Wallet,
  User as UserIcon,
  Home as HomeIcon,
  LayoutGrid,
  ShoppingBag,
  Leaf,
  Apple,
  Milk,
  Croissant,
  Cookie,
  Sparkles,
  CookingPot,
  Plus,
  Minus,
  Heart,
  ArrowLeft,
  Star,
  ChevronRight,
  Trash2,
  CheckCircle2,
  LogOut,
  Navigation,
  Loader2,
  Phone
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

const CATEGORIES = [
  { name: 'Vegetables', icon: Leaf },
  { name: 'Fruits', icon: Apple },
  { name: 'Dairy', icon: Milk },
  { name: 'Bakery', icon: Croissant },
  { name: 'Snacks', icon: Cookie },
  { name: 'Home Essentials', icon: Sparkles },
  { name: 'Kitchen Essentials', icon: CookingPot },
];

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Order Confirmed',
  PREPARING: 'Ordered being prepared',
  PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
};

export default function CustomerDashboard() {
  const { cart, user, products, favorites, orders, updateCartQuantity, removeFromCart, addToCart, placeOrder, toggleFavorite, setUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].name);
  const [currentView, setCurrentView] = useState<'home' | 'favorites' | 'categories' | 'cart' | 'order-success' | 'onboarding-map' | 'onboarding-details'>('home');
  const [sortBy, setSortBy] = useState<'none' | 'low-to-high' | 'high-to-low'>('none');
  const [isClient, setIsClient] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Onboarding state
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ phone: '', address: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  // Check if user profile exists
  const userProfileRef = useMemo(() => user?.id ? doc(db, 'customers', user.id) : null, [db, user?.id]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isProfileLoading && !profile && user) {
      setCurrentView('onboarding-map');
      handleAutoLocate();
    }
  }, [isClient, isProfileLoading, profile, user]);

  const handleAutoLocate = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocating(false);
          toast({ title: "Location detected", description: "Your current position has been pinpointed." });
        },
        (error) => {
          console.error(error);
          setLocating(false);
          // Fallback to a default location for demo
          setGpsLocation({ lat: 25.4358, lng: 81.8463 });
          toast({ variant: "destructive", title: "Location error", description: "Could not detect GPS. Using default location." });
        }
      );
    } else {
      setLocating(false);
      setGpsLocation({ lat: 25.4358, lng: 81.8463 });
    }
  };

  const handleOnboardingComplete = async () => {
    if (!user?.id) return;
    if (!onboardingForm.phone || !onboardingForm.address) {
      toast({ variant: "destructive", title: "Required fields", description: "Please provide your phone number and full address." });
      return;
    }

    setSavingProfile(true);
    try {
      const names = user.name.split(' ');
      const firstName = names[0] || 'Customer';
      const lastName = names.slice(1).join(' ') || 'User';

      await setDoc(doc(db, 'customers', user.id), {
        id: user.id,
        firstName,
        lastName,
        email: user.email,
        phone: onboardingForm.phone,
        address: onboardingForm.address,
        location: gpsLocation,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Profile complete", description: "Welcome to SwiftCart!" });
      setCurrentView('home');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeCategory !== 'All') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (sortBy === 'low-to-high') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high-to-low') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, searchQuery, activeCategory, sortBy]);

  const favoritesProducts = useMemo(() => {
    return products.filter(p => favorites.includes(p.id));
  }, [products, favorites]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof products> = {};
    products.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [products]);

  const latestOrder = orders[0];

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: user?.id || 'anon',
      items: [...cart],
      total: cartTotal + 2,
      status: 'CONFIRMED' as const,
      createdAt: new Date().toISOString(),
      address: profile?.address || 'Your saved address',
    };
    placeOrder(newOrder);
    setCurrentView('order-success');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      router.push('/');
      toast({
        title: "Signed out",
        description: "You have been successfully logged out."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message
      });
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Onboarding: Map Step */}
      {currentView === 'onboarding-map' && (
        <div className="flex flex-col h-screen bg-white">
          <div className="p-6 space-y-2">
            <h1 className="text-3xl font-black text-slate-900">Delivery Location</h1>
            <p className="text-slate-500 font-medium">Pinpoint your house for precise delivery.</p>
          </div>
          
          <div className="flex-1 relative bg-slate-100 overflow-hidden">
            <img 
              src="https://picsum.photos/seed/deliverymap/1200/1200" 
              alt="Map" 
              className="w-full h-full object-cover opacity-60 grayscale"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-2xl animate-pulse ring-4 ring-primary/20">
                  <Navigation className="h-6 w-6 text-white" />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap shadow-xl">
                  {gpsLocation ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}` : 'Detecting...'}
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="absolute bottom-6 right-6 rounded-full h-14 w-14 bg-white shadow-2xl p-0"
              onClick={handleAutoLocate}
              disabled={locating}
            >
              {locating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Navigation className="h-6 w-6 text-primary" />}
            </Button>
          </div>

          <div className="p-6 bg-white border-t border-slate-100 shadow-2xl">
            <Button 
              className="w-full h-14 text-lg font-black rounded-2xl bg-slate-900 hover:bg-slate-800"
              onClick={() => setCurrentView('onboarding-details')}
              disabled={!gpsLocation}
            >
              Confirm Location <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Onboarding: Details Step */}
      {currentView === 'onboarding-details' && (
        <div className="flex flex-col h-screen bg-white p-6 space-y-8">
          <div className="space-y-2">
            <button onClick={() => setCurrentView('onboarding-map')} className="p-1 -ml-1">
              <ArrowLeft className="h-6 w-6 text-slate-900" />
            </button>
            <h1 className="text-3xl font-black text-slate-900">Few more details</h1>
            <p className="text-slate-500 font-medium">Help us reach your doorstep faster.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="e.g. +91 98765 43210" 
                  className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-lg font-bold"
                  value={onboardingForm.phone}
                  onChange={(e) => setOnboardingForm({...onboardingForm, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">House / Flat / Area</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-5 h-5 w-5 text-slate-400" />
                <textarea 
                  placeholder="Street name, landmark, house number..." 
                  className="w-full pl-12 pr-4 py-4 min-h-[120px] bg-slate-50 border-none rounded-2xl text-lg font-bold focus:ring-2 focus:ring-primary outline-none"
                  value={onboardingForm.address}
                  onChange={(e) => setOnboardingForm({...onboardingForm, address: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <Button 
            className="w-full h-14 text-lg font-black rounded-2xl bg-green-600 hover:bg-green-700 shadow-xl"
            onClick={handleOnboardingComplete}
            disabled={savingProfile}
          >
            {savingProfile ? <Loader2 className="h-6 w-6 animate-spin" /> : "Complete Profile"}
          </Button>
        </div>
      )}

      {/* Home View */}
      {currentView === 'home' && (
        <>
          <header className="bg-white px-4 pt-4 pb-2 sticky top-0 z-50 shadow-sm border-b border-slate-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black uppercase tracking-tight text-slate-400">SwiftCart in</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-black text-slate-900">9 minutes</span>
                  <div className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-amber-200">
                    <Clock className="h-3 w-3" /> 24/7
                  </div>
                </div>
                <button className="flex items-center text-xs text-slate-500 font-medium mt-1 truncate max-w-[200px]">
                  {profile?.address || 'Harwara, Dhoomanganj...'} <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-full flex items-center gap-1">
                  <Wallet className="h-4 w-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-700">₹0</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 h-10 w-10">
                      <UserIcon className="h-5 w-5 text-slate-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl w-48">
                    <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {user?.name || 'Account'}
                    </div>
                    <Separator className="my-1" />
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="text-destructive font-bold cursor-pointer focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder='Search "fresh milk" or "vegetables"' 
                className="pl-10 pr-10 h-12 bg-slate-50 border-none rounded-xl text-base focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Mic className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden">
            <div className="flex items-center gap-6 overflow-x-auto px-4 py-6 no-scrollbar bg-white">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    setCurrentView('categories');
                  }}
                  className="flex flex-col items-center gap-2 min-w-[60px]"
                >
                  <div className="p-3 rounded-xl transition-all bg-slate-50 text-slate-600">
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="px-4 py-4 space-y-8">
              {Object.entries(groupedProducts).map(([category, items]) => (
                <section key={category} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900">{category}</h2>
                    <button 
                      onClick={() => { setActiveCategory(category); setCurrentView('categories'); }}
                      className="text-primary text-sm font-bold hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {items.map(product => (
                      <ProductCard key={product.id} product={product} layout="horizontal" />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </main>
        </>
      )}

      {/* Categories View */}
      {currentView === 'categories' && (
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="bg-white px-4 py-3 border-b flex items-center justify-between sticky top-0 z-50 gap-4">
            <div className="flex items-center overflow-hidden">
              <button onClick={() => setCurrentView('home')} className="p-1 mr-3 flex-shrink-0">
                <ArrowLeft className="h-6 w-6 text-slate-900" />
              </button>
              <div className="flex flex-col overflow-hidden min-w-0">
                <h1 className="text-lg font-black text-slate-900 leading-tight truncate">{activeCategory}</h1>
                <div className="flex items-center text-[10px] text-primary font-bold">
                  Delivering to : <span className="text-slate-500 ml-1 truncate">{profile?.address || 'Detecting...'}</span> <ChevronDown className="h-3 w-3 flex-shrink-0" />
                </div>
              </div>
            </div>
            <div className="relative flex-1 max-w-[200px] sm:max-w-md ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder='Search' 
                className="pl-10 pr-10 h-10 bg-slate-50 border-none rounded-xl text-sm focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            <aside className="w-24 bg-slate-50 border-r flex flex-col overflow-y-auto no-scrollbar">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={cn(
                      "relative flex flex-col items-center py-4 px-2 text-center transition-all",
                      isActive ? "bg-white" : "bg-transparent"
                    )}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 rounded-r-full" />}
                    <div className={cn(
                      "w-12 h-12 rounded-full overflow-hidden mb-1 flex items-center justify-center bg-white border-2",
                      isActive ? "border-green-600" : "border-slate-100"
                    )}>
                      <cat.icon className={cn("h-6 w-6", isActive ? "text-green-600" : "text-slate-400")} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold leading-tight",
                      isActive ? "text-slate-900" : "text-slate-500"
                    )}>
                      {cat.name}
                    </span>
                  </button>
                )
              })}
            </aside>
            <main className="flex-1 overflow-y-auto bg-white p-4 no-scrollbar">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs gap-1 font-bold">
                      Sort <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setSortBy('none')} className="text-xs font-bold">Relevance</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('low-to-high')} className="text-xs font-bold">Price: Low to High</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('high-to-low')} className="text-xs font-bold">Price: High to Low</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} layout="grid" />
                ))}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Favorites View */}
      {currentView === 'favorites' && (
        <>
          <header className="bg-white px-4 py-6 border-b flex items-center gap-4">
            <button onClick={() => setCurrentView('home')}>
              <ArrowLeft className="h-6 w-6 text-slate-900" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Favorites</h2>
              <p className="text-xs text-slate-500 font-bold">Your handpicked groceries</p>
            </div>
          </header>
          <main className="flex-1 p-4 overflow-y-auto no-scrollbar">
            {favoritesProducts.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
                <Heart className="h-16 w-16 mb-4 opacity-10" />
                <p className="font-bold">No favorites yet</p>
                <Button variant="link" onClick={() => setCurrentView('home')}>Go shopping</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {favoritesProducts.map(product => (
                  <ProductCard key={product.id} product={product} layout="grid" />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* Cart View */}
      {currentView === 'cart' && (
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="bg-white px-4 py-6 border-b flex items-center gap-4 flex-shrink-0">
            <button onClick={() => setCurrentView('home')}>
              <ArrowLeft className="h-6 w-6 text-slate-900" />
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-900">My Basket</h2>
              <p className="text-xs text-slate-500 font-bold">{cart.length} items</p>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 no-scrollbar bg-slate-50">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <ShoppingBag className="h-20 w-20 mb-6 opacity-20" />
                <p className="text-lg font-black text-slate-600">Your basket is empty</p>
                <Button variant="outline" className="mt-6 rounded-xl font-black" onClick={() => setCurrentView('home')}>Start Shopping</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex gap-4 p-3 hover:bg-slate-50 transition-colors rounded-2xl group">
                      <div className="h-20 w-20 relative rounded-2xl overflow-hidden bg-white border border-slate-100 p-2 flex-shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="pr-8 relative">
                          <h4 className="font-black text-sm text-slate-900 line-clamp-1">{item.name}</h4>
                          <p className="text-xs font-bold text-green-600">₹{item.price.toFixed(2)}</p>
                          <button className="absolute top-0 right-0 p-1 text-slate-300 hover:text-destructive transition-colors" onClick={() => removeFromCart(item.productId)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden h-8 shadow-sm">
                            <button className="px-3 hover:bg-slate-50 text-slate-600" onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-1 text-xs font-black min-w-[20px] text-center">{item.quantity}</span>
                            <button className="px-3 hover:bg-slate-50 text-slate-600" onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="font-black text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl"><MapPin className="h-5 w-5 text-slate-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Delivery Address</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">{profile?.address || 'Detecting...'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl"><Wallet className="h-5 w-5 text-slate-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Method</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">Scan to pay when delivery Agent arrives</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 mb-20">
                  <h3 className="font-black text-lg text-slate-900">Bill Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Item Total</span>
                      <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Delivery Fee</span>
                      <span className="text-green-600 font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Handling Charge</span>
                      <span className="font-bold">₹2</span>
                    </div>
                    <Separator className="bg-slate-100" />
                    <div className="flex justify-between text-xl font-black">
                      <span className="text-slate-900">Grand Total</span>
                      <span className="text-slate-900">₹{(cartTotal + 2).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {cart.length > 0 && (
            <div className="bg-white border-t p-4 pb-12 flex-shrink-0 z-50 shadow-2xl">
              <Button 
                className="w-full h-14 text-lg font-black rounded-2xl shadow-lg bg-green-600 hover:bg-green-700 flex items-center justify-between px-6"
                onClick={() => setIsConfirmOpen(true)}
              >
                <div className="text-left">
                  <p className="text-[10px] opacity-80 uppercase tracking-widest leading-none">Total</p>
                  <p className="text-xl leading-none mt-1">₹{(cartTotal + 2).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span>Place Order</span>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Order Success View */}
      {currentView === 'order-success' && latestOrder && (
        <div className="flex flex-col h-screen bg-white">
          <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900">Order Confirmed!</h1>
              <p className="text-slate-500 font-medium">Your groceries will reach you in 9 minutes.</p>
            </div>

            <Card className="w-full max-w-sm border-none bg-slate-50 shadow-none p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Order ID</span>
                <span className="font-black text-slate-900">#{latestOrder.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Current Status</span>
                <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {STATUS_LABELS[latestOrder.status] || latestOrder.status.replace(/_/g, ' ')}
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Delivery Agent</span>
                <span className="font-black text-slate-900">Assigning...</span>
              </div>
            </Card>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Status is managed by your delivery partner</p>
            
            <div className="w-full space-y-3 pt-6">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl font-black border-slate-200"
                onClick={() => setCurrentView('home')}
              >
                Back to Home
              </Button>
            </div>
          </main>
        </div>
      )}

      {/* Bottom Navigation */}
      {['home', 'favorites', 'categories', 'cart'].includes(currentView) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xl z-50">
          <button onClick={() => setCurrentView('home')} className={cn("flex flex-col items-center gap-1", currentView === 'home' ? 'text-green-600' : 'text-slate-400')}>
            <HomeIcon className="h-6 w-6" />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={() => setCurrentView('favorites')} className={cn("flex flex-col items-center gap-1", currentView === 'favorites' ? 'text-green-600' : 'text-slate-400')}>
            <Heart className={cn("h-6 w-6", currentView === 'favorites' && 'fill-green-600')} />
            <span className="text-[10px] font-bold">Favorites</span>
          </button>
          <button onClick={() => setCurrentView('categories')} className={cn("flex flex-col items-center gap-1", currentView === 'categories' ? 'text-green-600' : 'text-slate-400')}>
            <LayoutGrid className="h-6 w-6" />
            <span className="text-[10px] font-bold">Categories</span>
          </button>
          <button onClick={() => setCurrentView('cart')} className={cn("flex flex-col items-center gap-1 relative", currentView === 'cart' ? 'text-green-600' : 'text-slate-400')}>
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">Cart</span>
          </button>
        </nav>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-slate-900">Confirm Your Order?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-500">
              Are you sure you want to place this order? You will scan to pay ₹{(cartTotal + 2).toFixed(2)} once our delivery partner arrives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 rounded-xl font-bold mt-0">No, Wait</AlertDialogCancel>
            <AlertDialogAction className="flex-1 rounded-xl font-bold bg-green-600 hover:bg-green-700" onClick={handlePlaceOrder}>Yes, Place Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductCard({ product, layout = 'grid' }: { product: any, layout: 'grid' | 'horizontal' }) {
  const { cart, favorites, addToCart, updateCartQuantity, toggleFavorite } = useAppStore();
  const cartItem = cart.find(i => i.productId === product.id);
  const isFavorite = favorites.includes(product.id);

  return (
    <div className={cn(
      "flex flex-col transition-all group",
      layout === 'horizontal' ? 'min-w-[140px] max-w-[140px]' : 'w-full'
    )}>
      <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center p-3 mb-3 border border-slate-100">
        <img src={product.imageUrl} alt={product.name} className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
        <button onClick={() => toggleFavorite(product.id)} className={cn("absolute top-2 right-2 transition-colors", isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400')}>
          <Heart className={cn("h-5 w-5", isFavorite && 'fill-current')} />
        </button>
        {!cartItem ? (
          <button onClick={() => addToCart(product)} className="absolute bottom-2 right-2 bg-white text-green-600 font-black text-xs px-4 py-1.5 rounded-lg shadow-md border border-slate-100 hover:bg-green-600 hover:text-white transition-all">ADD</button>
        ) : (
          <div className="absolute bottom-2 right-2 bg-green-600 text-white flex items-center rounded-lg shadow-md overflow-hidden">
            <button className="px-2 py-1 hover:bg-green-700 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}><Minus className="h-3 w-3" /></button>
            <span className="px-2 text-xs font-black">{cartItem.quantity}</span>
            <button className="px-2 py-1 hover:bg-green-700 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}><Plus className="h-3 w-3" /></button>
          </div>
        )}
      </div>

      <div className="flex flex-col px-1 gap-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border border-green-600 flex items-center justify-center rounded-[2px]"><div className="w-1.5 h-1.5 bg-green-600 rounded-full" /></div>
          <span className="text-[10px] text-slate-500 font-bold">500 g</span>
        </div>
        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight h-8">{product.name}</h4>
        <div className="flex items-center gap-1">
          <div className="flex items-center">{[1, 2, 3, 4, 5].map((s) => (<Star key={s} className={cn("h-2.5 w-2.5", s <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />))}</div>
          <span className="text-[8px] text-slate-400 font-bold">(2,340)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><Clock className="h-3 w-3 text-green-600" /> 12 MINS</div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-sm font-black text-slate-900">₹{product.price}</span>
          <span className="text-[10px] text-slate-400 line-through">₹{Math.round(product.price * 1.2)}</span>
          <span className="text-[10px] font-black text-green-600 ml-auto">22% OFF</span>
        </div>
      </div>
    </div>
  );
}
