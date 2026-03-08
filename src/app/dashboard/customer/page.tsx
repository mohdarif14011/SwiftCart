
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart, 
  Package, 
  MapPin, 
  Clock,
  ChevronDown,
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
  Loader2,
  Phone,
  Building2,
  Box,
  Truck
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth, useFirestore, useDoc, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';

const CATEGORIES = [
  { name: 'All', icon: LayoutGrid },
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
  PREPARING: 'Order being prepared',
  PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
};

const FALLBACK_LAT = 25.4358;
const FALLBACK_LNG = 81.8463;

export default function CustomerDashboard() {
  const { cart, user, products, favorites, orders, updateCartQuantity, removeFromCart, addToCart, placeOrder, toggleFavorite, setUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].name);
  const [currentView, setCurrentView] = useState<'home' | 'favorites' | 'categories' | 'cart' | 'order-success' | 'onboarding-map' | 'onboarding-details' | 'orders'>('home');
  const [sortBy, setSortBy] = useState<'none' | 'low-to-high' | 'high-to-low'>('none');
  const [isClient, setIsClient] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ phone: '', address: '', nearby: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState(false);

  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (firebaseUser && !user) {
      setUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Customer',
        email: firebaseUser.email || '',
        role: 'CUSTOMER',
      });
    }
  }, [firebaseUser, user, setUser]);

  const userProfileRef = useMemo(() => firebaseUser?.uid ? doc(db, 'customers', firebaseUser.uid) : null, [db, firebaseUser?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // Automatically show onboarding only if no profile exists and we haven't just finished setting it up
  useEffect(() => {
    if (isClient && !isUserLoading && !isProfileLoading && !profile && firebaseUser && currentView === 'home' && !hasDismissedOnboarding) {
      setCurrentView('onboarding-map');
      handleAutoLocate();
    }
  }, [isClient, isUserLoading, isProfileLoading, profile, firebaseUser, currentView, hasDismissedOnboarding]);

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
        },
        (error) => {
          console.error(error);
          setLocating(false);
          setGpsLocation({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
        }
      );
    } else {
      setLocating(false);
      setGpsLocation({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
    }
  };

  const handleOnboardingComplete = () => {
    if (!firebaseUser?.uid) return;
    if (!onboardingForm.phone.trim() || !onboardingForm.address.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Phone and Address are required." });
      return;
    }

    setSavingProfile(true);
    const names = (firebaseUser.displayName || 'Customer User').split(' ');
    const firstName = names[0] || 'Customer';
    const lastName = names.slice(1).join(' ') || 'User';

    const profileData = {
      id: firebaseUser.uid,
      firstName,
      lastName,
      email: firebaseUser.email,
      phone: onboardingForm.phone,
      address: onboardingForm.address,
      nearby: onboardingForm.nearby,
      location: gpsLocation,
      updatedAt: new Date().toISOString()
    };

    setDocumentNonBlocking(doc(db, 'customers', firebaseUser.uid), profileData, { merge: true });

    toast({ title: "Profile Saved", description: "Your delivery details are set." });
    setHasDismissedOnboarding(true);
    setCurrentView('home');
    setSavingProfile(false);
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
  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId) || latestOrder, [orders, selectedOrderId, latestOrder]);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: user?.id || 'anon',
      items: [...cart],
      total: cartTotal + 2,
      status: 'CONFIRMED' as const,
      createdAt: new Date().toISOString(),
      address: profile?.address || onboardingForm.address || 'Your saved address',
    };
    placeOrder(newOrder);
    setSelectedOrderId(newOrder.id);
    setCurrentView('order-success');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout failed", description: error.message });
    }
  };

  const handleEditLocation = () => {
    setOnboardingForm({
      phone: profile?.phone || '',
      address: profile?.address || '',
      nearby: profile?.nearby || ''
    });
    if (profile?.location) {
      setGpsLocation(profile.location);
    }
    setCurrentView('onboarding-map');
  };

  if (!isClient) return null;

  if (isUserLoading || (firebaseUser && isProfileLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-slate-500 animate-pulse">Setting up your shop...</p>
      </div>
    );
  }

  if (!firebaseUser && !isUserLoading) {
    router.replace('/auth/customer');
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Onboarding View */}
      {currentView === 'onboarding-map' && (
        <div className="flex flex-col h-screen bg-white">
          <div className="p-6 space-y-2">
            <h1 className="text-3xl font-black text-slate-900">Pin Your House</h1>
            <p className="text-slate-500 font-medium">Place the pin exactly where you want delivery.</p>
          </div>
          <div className="flex-1 relative bg-slate-100 overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${gpsLocation?.lat || FALLBACK_LAT},${gpsLocation?.lng || FALLBACK_LNG}&z=18&output=embed`}
              className="w-full h-full grayscale opacity-70"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-2xl animate-pulse ring-4 ring-primary/20">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="absolute bottom-6 right-6 rounded-full h-14 w-14 bg-white shadow-2xl p-0"
              onClick={handleAutoLocate}
              disabled={locating}
            >
              {locating ? <Loader2 className="h-6 w-6 animate-spin" /> : <MapPin className="h-6 w-6 text-primary" />}
            </Button>
            {profile && (
              <Button 
                variant="ghost" 
                className="absolute top-6 left-6 rounded-full h-10 w-10 bg-white/80 backdrop-blur-sm shadow-md p-0"
                onClick={() => setCurrentView('home')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="p-6 bg-white border-t border-slate-100 shadow-2xl">
            <Button 
              className="w-full h-14 text-lg font-black rounded-2xl bg-slate-900 hover:bg-slate-800"
              onClick={() => setCurrentView('onboarding-details')}
              disabled={!gpsLocation}
            >
              Confirm Pin Location <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {currentView === 'onboarding-details' && (
        <div className="flex flex-col h-screen bg-white p-6 space-y-8 overflow-y-auto">
          <div className="space-y-2">
            <button onClick={() => setCurrentView('onboarding-map')} className="p-1 -ml-1">
              <ArrowLeft className="h-6 w-6 text-slate-900" />
            </button>
            <h1 className="text-3xl font-black text-slate-900">Delivery Info</h1>
            <p className="text-slate-500 font-medium">Finalize your profile details.</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Street Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Street name, House No, Area" 
                  className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-lg font-bold"
                  value={onboardingForm.address}
                  onChange={(e) => setOnboardingForm({...onboardingForm, address: e.target.value})}
                />
              </div>
            </div>
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nearby Spots (Landmarks)</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Opposite Park, Next to Gym etc." 
                  className="pl-12 h-14 bg-slate-50 border-none rounded-2xl text-lg font-bold"
                  value={onboardingForm.nearby}
                  onChange={(e) => setOnboardingForm({...onboardingForm, nearby: e.target.value})}
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
            {savingProfile ? <Loader2 className="h-6 w-6 animate-spin" /> : (profile ? "Update Profile" : "Create Profile")}
          </Button>
        </div>
      )}

      {/* Main App Views */}
      {['home', 'categories', 'favorites', 'cart', 'order-success', 'orders'].includes(currentView) && profile && (
        <>
          {/* Header */}
          <header className="bg-white px-4 py-3 sticky top-0 z-50 shadow-sm border-b border-slate-50 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                {currentView !== 'home' && (
                  <button 
                    onClick={() => setCurrentView('home')} 
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                  >
                    <ArrowLeft className="h-6 w-6 text-slate-900" />
                  </button>
                )}
                <div className="flex flex-col cursor-pointer min-w-0" onClick={handleEditLocation}>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-900">Delivering in 9 mins</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </div>
                  <span className="text-sm font-black text-slate-900 line-clamp-1 truncate">
                    {profile.address}
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
                    <DropdownMenuItem onClick={handleEditLocation} className="font-bold cursor-pointer"><MapPin className="h-4 w-4 mr-2" /> Edit Location</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentView('orders')} className="font-bold cursor-pointer"><Package className="h-4 w-4 mr-2" /> My Orders</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive font-bold cursor-pointer"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button onClick={() => setCurrentView('cart')} className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-full">
                  <ShoppingCart className="h-6 w-6" />
                  {cart.length > 0 && <span className="absolute top-1 right-1 bg-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder='Search groceries...' 
                className="pl-9 h-11 bg-slate-50 border-none rounded-xl text-sm font-bold focus-visible:ring-primary shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          {/* Views */}
          {currentView === 'home' && (
            <main className="flex-1 overflow-x-hidden">
              <div className="flex items-center gap-6 overflow-x-auto px-4 py-6 no-scrollbar bg-white border-b border-slate-50">
                {CATEGORIES.map((cat) => (
                  <button key={cat.name} onClick={() => setActiveCategory(cat.name)} className="flex flex-col items-center gap-2 min-w-[60px]">
                    <div className={cn("p-3 rounded-xl transition-all", activeCategory === cat.name ? "bg-primary text-white" : "bg-slate-50 text-slate-600")}>
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <span className={cn("text-[10px] font-bold", activeCategory === cat.name ? "text-primary" : "text-slate-500")}>{cat.name}</span>
                  </button>
                ))}
              </div>
              <div className="px-4 py-4 space-y-8">
                {activeCategory === 'All' ? (
                  Object.entries(groupedProducts).map(([category, items]) => (
                    <section key={category} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900">{category}</h2>
                        <button onClick={() => setActiveCategory(category)} className="text-primary text-sm font-bold">View all</button>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {items.map(product => <ProductCard key={product.id} product={product} layout="horizontal" />)}
                      </div>
                    </section>
                  ))
                ) : (
                  <section className="space-y-4">
                    <h2 className="text-xl font-black text-slate-900">{activeCategory}</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                      {filteredProducts.map(product => <ProductCard key={product.id} product={product} layout="grid" />)}
                    </div>
                  </section>
                )}
              </div>
            </main>
          )}

          {currentView === 'orders' && (
            <main className="flex-1 p-4 space-y-4 bg-slate-50">
              <h2 className="text-2xl font-black text-slate-900 px-2">My Orders</h2>
              {orders.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-bold">No orders yet</div>
              ) : (
                <div className="space-y-4">
                  {orders.map(o => (
                    <button 
                      key={o.id} 
                      onClick={() => { setSelectedOrderId(o.id); setCurrentView('order-success'); }}
                      className="w-full bg-white p-4 rounded-3xl flex items-center justify-between border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-slate-900">ORD-{o.id}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{new Date(o.createdAt).toLocaleDateString()} • ₹{o.total.toFixed(2)}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter">
                        {STATUS_LABELS[o.status] || o.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </main>
          )}

          {/* Bottom Nav */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xl z-50">
            <button onClick={() => { setCurrentView('home'); setActiveCategory('All'); }} className={cn("flex flex-col items-center gap-1", currentView === 'home' ? 'text-green-600' : 'text-slate-400')}>
              <HomeIcon className="h-6 w-6" />
              <span className="text-[10px] font-bold">Home</span>
            </button>
            <button onClick={() => setCurrentView('favorites')} className={cn("flex flex-col items-center gap-1", currentView === 'favorites' ? 'text-green-600' : 'text-slate-400')}>
              <Heart className={cn("h-6 w-6", currentView === 'favorites' && 'fill-green-600')} />
              <span className="text-[10px] font-bold">Favorites</span>
            </button>
            <button onClick={() => setCurrentView('orders')} className={cn("flex flex-col items-center gap-1", currentView === 'orders' ? 'text-green-600' : 'text-slate-400')}>
              <Package className="h-6 w-6" />
              <span className="text-[10px] font-bold">Orders</span>
            </button>
            <button onClick={() => setCurrentView('cart')} className={cn("flex flex-col items-center gap-1", currentView === 'cart' ? 'text-green-600' : 'text-slate-400')}>
              <ShoppingCart className="h-6 w-6" />
              <span className="text-[10px] font-bold">Cart</span>
            </button>
          </nav>
          
          {currentView === 'order-success' && selectedOrder && (
            <div className="flex flex-col h-screen bg-white">
              <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black text-slate-900">Order Tracking</h1>
                  <p className="text-slate-500 font-medium">Order ID: #{selectedOrder.id}</p>
                </div>
                <Card className="w-full bg-slate-50 border-none p-6 space-y-4 shadow-none">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-400">Status</span>
                    <Badge className="bg-amber-100 text-amber-700 border-none font-black">{STATUS_LABELS[selectedOrder.status]}</Badge>
                  </div>
                  <div className="text-left space-y-4">
                    <p className="text-sm font-bold text-slate-900">Delivery Address: {selectedOrder.address}</p>
                    <Separator />
                    <div className="flex items-center gap-2 text-xs font-black text-primary">
                      <Truck className="h-4 w-4" /> Arriving in approx. 12 mins
                    </div>
                  </div>
                </Card>
                <Button className="w-full h-14 rounded-2xl font-black" onClick={() => setCurrentView('home')}>Continue Shopping</Button>
              </main>
            </div>
          )}
          
          {currentView === 'cart' && (
             <main className="flex-1 p-4 bg-slate-50 space-y-4">
               <h2 className="text-2xl font-black text-slate-900">My Basket</h2>
               {cart.length === 0 ? <div className="py-20 text-center font-bold text-slate-400">Your basket is empty</div> : (
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                    {cart.map(item => (
                      <div key={item.productId} className="flex justify-between items-center">
                        <span className="font-bold">{item.name} x{item.quantity}</span>
                        <span className="font-black text-primary">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center text-xl font-black">
                      <span>Total</span>
                      <span>₹{(cartTotal + 2).toFixed(2)}</span>
                    </div>
                    <Button className="w-full h-14 rounded-2xl bg-green-600 font-black" onClick={() => setIsConfirmOpen(true)}>Place Order</Button>
                 </div>
               )}
             </main>
          )}

          {currentView === 'favorites' && (
             <main className="flex-1 p-4 bg-slate-50 space-y-4">
               <h2 className="text-2xl font-black text-slate-900">Favorites</h2>
               <div className="grid grid-cols-2 gap-4">
                 {favoritesProducts.map(product => <ProductCard key={product.id} product={product} layout="grid" />)}
                 {favoritesProducts.length === 0 && <div className="col-span-2 py-20 text-center font-bold text-slate-400">No favorites yet</div>}
               </div>
             </main>
          )}

          <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black">Confirm Order?</AlertDialogTitle>
                <AlertDialogDescription>Pay ₹{(cartTotal + 2).toFixed(2)} at delivery.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2">
                <AlertDialogCancel className="flex-1 rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction className="flex-1 rounded-xl bg-green-600" onClick={handlePlaceOrder}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function ProductCard({ product, layout = 'grid' }: { product: any, layout: 'grid' | 'horizontal' }) {
  const { cart, favorites, addToCart, updateCartQuantity, toggleFavorite } = useAppStore();
  const cartItem = cart.find(i => i.productId === product.id);
  const isFavorite = favorites.includes(product.id);

  return (
    <div className={cn("flex flex-col transition-all group", layout === 'horizontal' ? 'min-w-[140px] max-w-[140px]' : 'w-full')}>
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
        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight h-8">{product.name}</h4>
        <div className="flex items-center gap-1">
          <div className="flex items-center">{[1, 2, 3, 4, 5].map((s) => (<Star key={s} className={cn("h-2.5 w-2.5", s <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />))}</div>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-sm font-black text-slate-900">₹{product.price}</span>
          <span className="text-[10px] font-black text-green-600 ml-auto">22% OFF</span>
        </div>
      </div>
    </div>
  );
}
