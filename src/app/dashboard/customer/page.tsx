'use client';

import { useState, useEffect } from 'react';
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
  Repeat,
  LayoutGrid,
  ShoppingBag,
  Apple,
  Leaf,
  Milk,
  Croissant,
  Cookie,
  Sparkles
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { name: 'All', icon: ShoppingBag },
  { name: 'Vegetables', icon: Leaf },
  { name: 'Fruits', icon: Apple },
  { name: 'Dairy', icon: Milk },
  { name: 'Bakery', icon: Croissant },
  { name: 'Snacks', icon: Cookie },
  { name: 'Home Essentials', icon: Sparkles },
];

export default function CustomerDashboard() {
  const { cart, user, updateCartQuantity, removeFromCart, placeOrder, setUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      userId: user?.id || 'anon',
      items: [...cart],
      total: cartTotal,
      status: 'CONFIRMED' as const,
      createdAt: new Date().toISOString(),
      address: 'Harwara, Dhoomanganj, Prayagraj',
    };
    placeOrder(newOrder);
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Header Section */}
      <header className="bg-white px-4 pt-4 pb-2 sticky top-0 z-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-black uppercase tracking-tight text-slate-900">SwiftCart in</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-3xl font-black text-slate-900">9 minutes</span>
              <div className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-amber-200">
                <Clock className="h-3 w-3" /> 24/7
              </div>
            </div>
            <button className="flex items-center text-xs text-slate-500 font-medium mt-1">
              Harwara, Dhoomanganj, Prayagraj <ChevronDown className="h-3 w-3 ml-0.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-full flex items-center gap-1">
              <Wallet className="h-4 w-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700">₹0</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 h-10 w-10">
              <UserIcon className="h-5 w-5 text-slate-700" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder='Search "fresh milk" or "vegetables"' 
            className="pl-10 pr-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm text-base focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suppressHydrationWarning
          />
          <Mic className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>
      </header>

      <main className="flex-1">
        {/* Category Navigation */}
        <div className="flex items-center gap-6 overflow-x-auto px-4 py-6 no-scrollbar bg-white">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className="flex flex-col items-center gap-2 min-w-[60px]"
            >
              <div className={`p-3 rounded-xl transition-all ${activeCategory === cat.name ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600'}`}>
                <cat.icon className="h-6 w-6" />
              </div>
              <span className={`text-xs font-bold ${activeCategory === cat.name ? 'text-slate-900' : 'text-slate-500'}`}>{cat.name}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xl z-50">
        <button className="flex flex-col items-center gap-1 text-slate-900">
          <HomeIcon className="h-6 w-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <Repeat className="h-6 w-6" />
          <span className="text-[10px] font-bold">Order Again</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <LayoutGrid className="h-6 w-6" />
          <span className="text-[10px] font-bold">Categories</span>
        </button>
        
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 text-slate-400 relative" suppressHydrationWarning>
              <ShoppingCart className="h-6 w-6" />
              <span className="text-[10px] font-bold">Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                My Shopping Cart
              </SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col h-full pb-10">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="flex gap-4 p-2 bg-slate-50 rounded-2xl">
                      <div className="h-20 w-20 relative rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                          <p className="text-xs font-bold text-primary">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                            suppressHydrationWarning
                          >-</Button>
                          <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                            suppressHydrationWarning
                          >+</Button>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-between py-1">
                        <span className="font-black text-sm text-slate-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <Button 
                          variant="ghost" size="sm" className="text-destructive font-bold h-8 p-0"
                          onClick={() => removeFromCart(item.productId)}
                          suppressHydrationWarning
                        >Remove</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className="pt-6 space-y-4">
                  <Separator />
                  <div className="flex justify-between items-center text-xl font-black">
                    <span>Total</span>
                    <span className="text-primary">${cartTotal.toFixed(2)}</span>
                  </div>
                  <Button className="w-full bg-slate-900 py-7 text-lg rounded-2xl font-black" onClick={handleCheckout} suppressHydrationWarning>
                    Checkout Now
                  </Button>
                  <p className="text-[10px] text-center text-slate-400 font-bold flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" /> Delivery to: Harwara, Dhoomanganj
                  </p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
