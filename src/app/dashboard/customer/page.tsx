
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
  Heart,
  Share2,
  ArrowLeft,
  Star,
  ChevronRight,
  CookingPot,
  X
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { name: 'Vegetables', icon: Leaf },
  { name: 'Fruits', icon: Apple },
  { name: 'Dairy', icon: Milk },
  { name: 'Bakery', icon: Croissant },
  { name: 'Snacks', icon: Cookie },
  { name: 'Home Essentials', icon: Sparkles },
  { name: 'Kitchen Essentials', icon: CookingPot },
];

export default function CustomerDashboard() {
  const { cart, user, products, favorites, updateCartQuantity, removeFromCart, addToCart, placeOrder, toggleFavorite } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].name);
  const [currentView, setCurrentView] = useState<'home' | 'favorites' | 'categories'>('home');
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = useMemo(() => {
    const list = products;
    return list.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

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
    <div className="min-h-screen bg-white flex flex-col pb-20">
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

      {/* Categories Split-View */}
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
                  Delivering to : <span className="text-slate-500 ml-1 truncate">Patna Division, Bihar...</span> <ChevronDown className="h-3 w-3 flex-shrink-0" />
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
              <Mic className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
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

            {/* Main Product Grid */}
            <main className="flex-1 overflow-y-auto bg-white p-4 no-scrollbar">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6">
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs gap-1 font-bold">
                  Filters <ChevronDown className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs gap-1 font-bold">
                  Sort <ChevronDown className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs gap-1 font-bold">
                  Price <ChevronDown className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs gap-1 font-bold">
                  Brand <ChevronDown className="h-3 w-3" />
                </Button>
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
          <header className="bg-white px-4 py-6 border-b">
            <h2 className="text-3xl font-black text-slate-900">Favorites</h2>
            <p className="text-sm text-slate-500">Your handpicked groceries</p>
          </header>
          <main className="flex-1 p-4">
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xl z-50">
        <button 
          onClick={() => setCurrentView('home')}
          className={cn("flex flex-col items-center gap-1", currentView === 'home' ? 'text-green-600' : 'text-slate-400')}
        >
          <HomeIcon className="h-6 w-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => setCurrentView('favorites')}
          className={cn("flex flex-col items-center gap-1", currentView === 'favorites' ? 'text-green-600' : 'text-slate-400')}
        >
          <Heart className={cn("h-6 w-6", currentView === 'favorites' && 'fill-green-600')} />
          <span className="text-[10px] font-bold">Favorites</span>
        </button>
        <button 
          onClick={() => setCurrentView('categories')}
          className={cn("flex flex-col items-center gap-1", currentView === 'categories' ? 'text-green-600' : 'text-slate-400')}
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
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-[2.5rem] p-0">
            <div className="p-6 h-full flex flex-col">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-black flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
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
                          <p className="text-xs font-bold text-green-600">₹{item.price.toFixed(2)}</p>
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
                      <span className="text-green-600">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button className="w-full h-14 text-lg font-black rounded-2xl shadow-lg bg-green-600 hover:bg-green-700" onClick={handleCheckout}>
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

function ProductCard({ product, layout = 'grid' }: { product: any, layout: 'grid' | 'horizontal' }) {
  const { cart, favorites, addToCart, updateCartQuantity, toggleFavorite } = useAppStore();
  const cartItem = cart.find(i => i.productId === product.id);
  const isFavorite = favorites.includes(product.id);

  return (
    <div className={cn(
      "flex flex-col transition-all group",
      layout === 'horizontal' ? 'min-w-[140px] max-w-[140px]' : 'w-full'
    )}>
      {/* Image Container */}
      <div className="relative aspect-square bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center p-3 mb-3 border border-slate-100">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
        />
        <button 
          onClick={() => toggleFavorite(product.id)}
          className={cn(
            "absolute top-2 right-2 transition-colors",
            isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400'
          )}
        >
          <Heart className={cn("h-5 w-5", isFavorite && 'fill-current')} />
        </button>
        
        {/* ADD Button */}
        {!cartItem ? (
          <button 
            onClick={() => addToCart(product)}
            className="absolute bottom-2 right-2 bg-white text-green-600 font-black text-xs px-4 py-1.5 rounded-lg shadow-md border border-slate-100 hover:bg-green-600 hover:text-white transition-all"
          >
            ADD
          </button>
        ) : (
          <div className="absolute bottom-2 right-2 bg-green-600 text-white flex items-center rounded-lg shadow-md overflow-hidden">
            <button 
              className="px-2 py-1 hover:bg-green-700 transition-colors"
              onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-2 text-xs font-black">{cartItem.quantity}</span>
            <button 
              className="px-2 py-1 hover:bg-green-700 transition-colors"
              onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col px-1 gap-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 border border-green-600 flex items-center justify-center rounded-[2px]">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold">500 g</span>
        </div>

        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight h-8">
          {product.name}
        </h4>

        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("h-2.5 w-2.5", s <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
            ))}
          </div>
          <span className="text-[8px] text-slate-400 font-bold">(2,340)</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
          <Clock className="h-3 w-3 text-green-600" /> 12 MINS
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-sm font-black text-slate-900">₹{product.price}</span>
          <span className="text-[10px] text-slate-400 line-through">₹{Math.round(product.price * 1.2)}</span>
          <span className="text-[10px] font-black text-green-600 ml-auto">22% OFF</span>
        </div>
        <div className="text-[9px] text-slate-400 font-medium">₹{(product.price / 0.5).toFixed(1)}/kg</div>
      </div>
    </div>
  );
}
