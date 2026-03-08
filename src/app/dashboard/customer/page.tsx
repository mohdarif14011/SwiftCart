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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth, useFirestore, useDoc, setDocumentNonBlocking } from '@/firebase';
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

// Fallback coordinates
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
  
  // Onboarding/Profile state
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({ phone: '', address: '', nearby: '' });
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
    // If we're on the dashboard and profile doesn't exist, force onboarding
    if (isClient && !isProfileLoading && !profile && user && currentView === 'home') {
      setCurrentView('onboarding-map');
      handleAutoLocate();
    }
  }, [isClient, isProfileLoading, profile, user, currentView]);

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
          toast({ title: "Location detected", description: "Your pin has been placed on the map." });
        },
        (error) => {
          console.error(error);
          setLocating(false);
          setGpsLocation({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
          toast({ variant: "destructive", title: "Location error", description: "Could not detect GPS. Using default area pin." });
        }
      );
    } else {
      setLocating(false);
      setGpsLocation({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
    }
  };

  const handleOnboardingComplete = () => {
    if (!user?.id) return;
    if (!onboardingForm.phone.trim()) {
      toast({ variant: "destructive", title: "Missing Phone", description: "Please provide your mobile number." });
      return;
    }
    if (!onboardingForm.address.trim()) {
      toast({ variant: "destructive", title: "Missing Address", description: "Please provide your street address." });
      return;
    }

    setSavingProfile(true);
    const names = user.name.split(' ');
    const firstName = names[0] || 'Customer';
    const lastName = names.slice(1).join(' ') || 'User';

    const profileData = {
      id: user.id,
      firstName,
      lastName,
      email: user.email,
      phone: onboardingForm.phone,
      address: onboardingForm.address,
      nearby: onboardingForm.nearby,
      location: gpsLocation,
      updatedAt: new Date().toISOString()
    };

    setDocumentNonBlocking(doc(db, 'customers', user.id), profileData, { merge: true });

    toast({ title: "Profile Saved", description: "Your delivery details are set." });
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
      address: onboardingForm.address || profile?.address || 'Your saved address',
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

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Onboarding: Map Step */}
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
            
            {(profile || currentView === 'onboarding-map') && (
              <Button 
                variant="ghost" 
                className="absolute top-6 left-6 rounded-full h-10 w-10 bg-white/80 backdrop-blur-sm shadow-md p-0"
                onClick={() => profile ? setCurrentView('home') : router.push('/')}
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

      {/* Onboarding: Details Step */}
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
          {(currentView === 'home' || currentView === 'categories') && (
            <header className="bg-white px-4 py-3 sticky top-0 z-50 shadow-sm border-b border-slate-50 flex items-center gap-4">
              {currentView !== 'home' && (
                <button 
                  onClick={() => setCurrentView('home')} 
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                >
                  <ArrowLeft className="h-6 w-6 text-slate-900" />
                </button>
              )}
              
              <h1 className="text-xl font-black text-slate-900 whitespace-nowrap hidden sm:block">
                {currentView === 'home' ? 'SwiftCart' : 'Categories'}
              </h1>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder='Search groceries...' 
                  className="pl-9 h-11 bg-slate-50 border-none rounded-xl text-sm focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentView('cart')} className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-full">
                   <ShoppingCart className="h-6 w-6" />
                   {cart.length > 0 && <span className="absolute top-0 right-0 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 h-10 w-10 shrink-0">
                      <UserIcon className="h-5 w-5 text-slate-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl w-48">
                    <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {user?.name || 'My Profile'}
                    </div>
                    <Separator className="my-1" />
                    <DropdownMenuItem onClick={handleEditLocation} className="font-bold cursor-pointer">
                      <MapPin className="h-4 w-4 mr-2" /> Edit Location
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentView('orders')} className="font-bold cursor-pointer">
                      <Package className="h-4 w-4 mr-2" /> My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive font-bold cursor-pointer focus:text-destructive focus:bg-destructive/10">
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
          )}

          {/* Home View */}
          {currentView === 'home' && (
            <main className="flex-1 overflow-x-hidden">
              <div className="flex items-center gap-6 overflow-x-auto px-4 py-6 no-scrollbar bg-white border-b border-slate-50">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setActiveCategory(cat.name);
                    }}
                    className="flex flex-col items-center gap-2 min-w-[60px]"
                  >
                    <div className={cn(
                      "p-3 rounded-xl transition-all",
                      activeCategory === cat.name ? "bg-primary text-white" : "bg-slate-50 text-slate-600"
                    )}>
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold",
                      activeCategory === cat.name ? "text-primary" : "text-slate-500"
                    )}>{cat.name}</span>
                  </button>
                ))}
              </div>

              <div className="px-4 py-4 space-y-8">
                {activeCategory === 'All' ? (
                  Object.entries(groupedProducts).map(([category, items]) => (
                    <section key={category} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900">{category}</h2>
                        <button 
                          onClick={() => setActiveCategory(category)}
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
                  ))
                ) : (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black text-slate-900">{activeCategory}</h2>
                      <button 
                        onClick={() => setActiveCategory('All')}
                        className="text-primary text-sm font-bold hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                      {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} layout="grid" />
                      ))}
                    </div>
                    {filteredProducts.length === 0 && (
                      <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
                        <ShoppingBag className="h-16 w-16 mb-4 opacity-10" />
                        <p className="font-bold">No products found in this category</p>
                      </div>
                    )}
                  </section>
                )}
              </div>
            </main>
          )}

          {/* Categories View */}
          {currentView === 'categories' && (
            <div className="flex-1 flex overflow-hidden">
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
                <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} layout="grid" />
                  ))}
                </div>
              </main>
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
                  <div className="space-y-4 pb-20">
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
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Delivery Address</p>
                            <button onClick={handleEditLocation} className="text-[10px] font-black text-primary uppercase">Edit</button>
                          </div>
                          <p className="text-sm font-bold text-slate-900 mt-1">{profile.address}</p>
                          {profile.nearby && <p className="text-xs text-slate-500 font-medium">Landmark: {profile.nearby}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
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

          {/* Orders Tracking View */}
          {currentView === 'orders' && (
            <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto no-scrollbar pb-24">
              <header className="bg-white px-4 py-6 border-b flex items-center gap-4 flex-shrink-0 sticky top-0 z-10">
                <button onClick={() => setCurrentView('home')}>
                  <ArrowLeft className="h-6 w-6 text-slate-900" />
                </button>
                <h2 className="text-2xl font-black text-slate-900">My Orders</h2>
              </header>

              <main className="p-4 space-y-4">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Package className="h-20 w-20 mb-4 opacity-10" />
                    <p className="font-bold">No orders yet</p>
                    <Button variant="link" onClick={() => setCurrentView('home')}>Go shopping</Button>
                  </div>
                ) : (
                  <>
                    <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white mb-4">
                      <CardContent className="p-6">
                        <h3 className="text-base font-black text-slate-900 mb-6">
                          Active Tracking: ORD-{selectedOrder.id}
                        </h3>

                        <div className="relative space-y-8 pl-12">
                          <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-slate-100" />
                          
                          {/* Timeline Steps */}
                          <div className="relative">
                            <div className={cn("absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10", 
                              ['CONFIRMED', 'PREPARING', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status) ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400"
                            )}>
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">Order Placed</p>
                              <p className="text-xs text-slate-400 font-medium">
                                {selectedOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                              </p>
                            </div>
                          </div>

                          <div className="relative">
                            <div className={cn("absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10", 
                              ['PREPARING', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status) ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400"
                            )}>
                              <Box className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">Packed in SwiftCart Warehouse</p>
                              <p className="text-xs text-slate-400 font-medium">Items are carefully packed</p>
                            </div>
                          </div>

                          <div className="relative">
                            <div className={cn("absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10", 
                              ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(selectedOrder.status) ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                            )}>
                              <Truck className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">Picked up by Swift Drones & Co.</p>
                              <p className="text-xs text-slate-400 font-medium">Out for delivery</p>
                            </div>
                          </div>

                          <div className="relative">
                            <div className={cn("absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10", 
                              selectedOrder.status === 'DELIVERED' ? "bg-green-500 text-white" : "bg-white text-slate-300 border-slate-100"
                            )}>
                              <HomeIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className={cn("text-sm font-black", selectedOrder.status === 'DELIVERED' ? "text-slate-900" : "text-slate-300")}>Order Delivered</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-4 pt-4">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Order History</h3>
                      {orders.map(o => (
                        <button 
                          key={o.id} 
                          onClick={() => setSelectedOrderId(o.id)}
                          className={cn("w-full bg-white p-4 rounded-3xl flex items-center justify-between border transition-all", 
                            selectedOrderId === o.id ? "border-primary ring-1 ring-primary/20" : "border-slate-100"
                          )}
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
                  </>
                )}
              </main>
            </div>
          )}

          {/* Order Success */}
          {currentView === 'order-success' && latestOrder && (
            <div className="flex flex-col h-screen bg-white">
              <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black text-slate-900">Order Confirmed!</h1>
                  <p className="text-slate-500 font-medium">Arrival at {profile.address} in 9 mins.</p>
                </div>

                <Card className="w-full max-sm border-none bg-slate-50 shadow-none p-6 space-y-4">
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
                </Card>

                <div className="w-full space-y-3 pt-6">
                  <Button 
                    className="w-full h-14 rounded-2xl font-black bg-primary"
                    onClick={() => setCurrentView('orders')}
                  >
                    Track My Order <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 rounded-xl font-black text-slate-400"
                    onClick={() => setCurrentView('home')}
                  >
                    Back to Shopping
                  </Button>
                </div>
              </main>
            </div>
          )}

          {/* Bottom Navigation */}
          {['home', 'favorites', 'categories', 'cart', 'orders'].includes(currentView) && (
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
              <button onClick={() => setCurrentView('orders')} className={cn("flex flex-col items-center gap-1", currentView === 'orders' ? 'text-green-600' : 'text-slate-400')}>
                <div className="relative">
                  <Package className="h-6 w-6" />
                  {orders.some(o => o.status !== 'DELIVERED') && (
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[8px] font-bold h-3 w-3 rounded-full flex items-center justify-center border border-white">
                      !
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold">Orders</span>
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
                  Are you sure you want to place this order? You will pay ₹{(cartTotal + 2).toFixed(2)} upon arrival at {onboardingForm.address || profile.address}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2 mt-4">
                <AlertDialogCancel className="flex-1 rounded-xl font-bold mt-0">No, Wait</AlertDialogCancel>
                <AlertDialogAction className="flex-1 rounded-xl font-bold bg-green-600 hover:bg-green-700" onClick={handlePlaceOrder}>Yes, Place Order</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Loading State */}
      {isProfileLoading && currentView === 'home' && (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-bold text-slate-500 animate-pulse">Setting up your shop...</p>
        </div>
      )}
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