
'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Apple,
  Leaf,
  Milk,
  Croissant,
  Cookie,
  Sparkles,
  Plus,
  Minus,
  Heart
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

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
  const { cart, user, products, favorites, updateCartQuantity, removeFromCart, addToCart, placeOrder } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentView, setCurrentView] = useState<'home' | 'favorites' | 'categories'>('home');
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (currentView === 'favorites') {
      list = products.filter(p => favorites.includes(p.id));
    }
    
    return list.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory, currentView, favorites]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof products> = {};
    const listToGroup = currentView === 'favorites' ? products.filter(p => favorites.includes(p.id)) : products;
    
    listToGroup.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [products, currentView, favorites]);

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
    toast({ title: "Order Placed", description: "Your groceries are on the way!" });
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      {/* Header Section */}
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
            className="pl-10 pr-10 h-12 bg-slate-50 border-none rounded-xl text-base focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Mic className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>
      </header>

      <main className="flex-1">
        {currentView !== 'favorites' && (
          <div className="flex items-center gap-6 overflow-x-auto px-4 py-6 no-scrollbar bg-white">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setActiveCategory(cat.name);
                  setCurrentView('home');
                }}
                className="flex flex-col items-center gap-2 min-w-[60px]"
              >
                <div className={`p-3 rounded-xl transition-all ${activeCategory === cat.name && currentView === 'home' ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-600'}`}>
                  <cat.icon className="h-6 w-6" />
                </div>
                <span className={`text-[10px] font-bold ${activeCategory === cat.name && currentView === 'home' ? 'text-slate-900' : 'text-slate-500'}`}>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content Section */}
        <div className="px-4 py-4 space-y-8">
          {currentView === 'favorites' && (
            <div className="mb-4">
              <h2 className="text-2xl font-black text-slate-900">My Favorites</h2>
              <p className="text-sm text-slate-500">Your handpicked groceries</p>
              {favorites.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
                  <Heart className="h-16 w-16 mb-4 opacity-10" />
                  <p className="font-bold">No favorites yet</p>
                  <Button variant="link" onClick={() => setCurrentView('home')}>Go shopping</Button>
                </div>
              )}
            </div>
          )}

          {(activeCategory === 'All' || currentView === 'favorites') && Object.keys(groupedProducts).length > 0 ? (
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
                    <ProductCard key={product.id} product={product} isListView={false} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} isListView={true} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xl z-50">
        <button 
          onClick={() => { setCurrentView('home'); setActiveCategory('All'); }}
          className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-primary' : 'text-slate-400'}`}
        >
          <HomeIcon className="h-6 w-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => setCurrentView('favorites')}
          className={`flex flex-col items-center gap-1 ${currentView === 'favorites' ? 'text-primary' : 'text-slate-400'}`}
        >
          <Heart className={`h-6 w-6 ${currentView === 'favorites' ? 'fill-primary' : ''}`} />
          <span className="text-[10px] font-bold">Favorites</span>
        </button>
        <button 
          onClick={() => { setCurrentView('categories'); setActiveCategory('All'); }}
          className={`flex flex-col items-center gap-1 ${currentView === 'categories' ? 'text-primary' : 'text-slate-400'}`}
        >
          <LayoutGrid className="h-6 w-6" />
          <span className="text-[10px] font-bold">Categories</span>
        </button>
        
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 text-slate-400 relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-[10px] font-bold">Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-[2.5rem] p-0">
            <div className="p-6 h-full flex flex-col">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-black flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  My Basket
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Package className="h-16 w-16 mb-4 opacity-20" />
                    <p className="font-bold">Your basket is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="h-20 w-20 relative rounded-xl overflow-hidden bg-white border border-slate-100 p-2">
                        <img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                          <p className="text-xs font-bold text-primary">₹{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-8">
                            <button 
                              className="px-2 hover:bg-slate-50"
                              onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 text-xs font-black">{item.quantity}</span>
                            <button 
                              className="px-2 hover:bg-slate-50"
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button 
                            className="text-[10px] font-bold text-destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Subtotal</span>
                      <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Delivery Fee</span>
                      <span className="text-green-600 font-bold">FREE</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-black">
                      <span>Total</span>
                      <span className="text-primary">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button className="w-full h-14 text-lg font-black rounded-2xl shadow-lg" onClick={handleCheckout}>
                    Place Order
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}

function ProductCard({ product, isListView }: { product: any, isListView: boolean }) {
  const { cart, favorites, addToCart, updateCartQuantity, toggleFavorite } = useAppStore();
  const cartItem = cart.find(i => i.productId === product.id);
  const isFavorite = favorites.includes(product.id);

  return (
    <div className={`flex flex-col transition-all group ${isListView ? 'w-full' : 'min-w-[150px] max-w-[150px]'}`}>
      {/* Image Container */}
      <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center p-3 mb-2">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
        />
        <button 
          onClick={() => toggleFavorite(product.id)}
          className={`absolute top-2 right-2 transition-colors ${isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        
        {/* Quick Add Button Overlay */}
        {!cartItem && (
          <button 
            onClick={() => addToCart(product)}
            className="absolute bottom-2 right-2 bg-white text-primary h-8 w-8 rounded-lg shadow-sm border border-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
          <Clock className="h-3 w-3" /> 5 mins
        </div>
        <div className="text-[10px] text-slate-400 font-bold">500 g</div>
      </div>

      {/* Name */}
      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 px-1 mb-2 leading-tight min-h-[2.5rem]">
        {product.name}
      </h4>

      {/* Price & Action Row */}
      <div className="mt-auto px-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">₹{product.price}</span>
            <span className="text-[10px] text-slate-400 line-through">₹{Math.round(product.price * 1.2)}</span>
          </div>
          <span className="text-[10px] font-black text-green-600">22% off</span>
        </div>

        {cartItem && (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg h-8 overflow-hidden">
            <button 
              className="px-2 text-primary hover:bg-primary/5 transition-colors"
              onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-xs font-black text-primary">{cartItem.quantity}</span>
            <button 
              className="px-2 text-primary hover:bg-primary/5 transition-colors"
              onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
