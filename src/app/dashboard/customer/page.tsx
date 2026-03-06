
'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/app/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/app/components/ProductCard';
import { SmartShoppingList } from '@/app/components/SmartShoppingList';
import { 
  Search, 
  ShoppingCart, 
  Package, 
  MapPin, 
  LogOut, 
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

export default function CustomerDashboard() {
  const { products, cart, orders, user, updateCartQuantity, removeFromCart, placeOrder, setUser } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
      address: '123 Main St, Apt 4B, New York, NY',
    };
    placeOrder(newOrder);
  };

  const handleLogout = () => {
    setUser(null);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-headline text-primary hidden sm:block">SwiftCart</span>
          </div>

          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search groceries..." 
              className="pl-10 h-10 bg-background/50 border-muted focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary">
                  <ShoppingCart className="h-6 w-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                      {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    My Shopping Cart
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {cart.length === 0 ? (
                      <div className="text-center py-20">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Your cart is empty</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.productId} className="flex gap-4">
                          <div className="h-20 w-20 relative rounded-lg overflow-hidden flex-shrink-0">
                            <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" size="icon" className="h-7 w-7"
                                onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                              >-</Button>
                              <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline" size="icon" className="h-7 w-7"
                                onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                              >+</Button>
                            </div>
                          </div>
                          <div className="text-right flex flex-col justify-between">
                            <span className="font-bold text-sm text-primary">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <Button 
                              variant="ghost" size="sm" className="text-destructive h-8 p-0"
                              onClick={() => removeFromCart(item.productId)}
                            >Remove</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {cart.length > 0 && (
                    <div className="pt-6 space-y-4 mb-20">
                      <Separator />
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">${cartTotal.toFixed(2)}</span>
                      </div>
                      <Button className="w-full bg-primary py-6 text-lg" onClick={handleCheckout}>
                        Confirm Checkout
                      </Button>
                      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3" /> Delivery to: {user?.role === 'CUSTOMER' ? '123 Main St' : 'Your Location'}
                      </p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar - Categories & AI */}
        <div className="lg:col-span-1 space-y-8">
          <div className="space-y-4">
            <h3 className="font-bold font-headline text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" /> Categories
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'ghost'}
                  className={`justify-start h-10 w-auto lg:w-full transition-all ${activeCategory === cat ? 'bg-primary' : 'hover:bg-primary/10'}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <SmartShoppingList />

          <div className="bg-white p-6 rounded-xl border-none shadow-sm space-y-4">
            <h3 className="font-bold font-headline text-lg">Your Orders</h3>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-3 bg-background rounded-lg text-xs space-y-2 group cursor-pointer hover:bg-accent/5 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="font-bold">ORD-{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-primary/20 text-primary'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{order.items.length} items</span>
                      <span className="font-semibold text-primary">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-accent font-semibold uppercase tracking-wider">
                      {order.status === 'OUT_FOR_DELIVERY' ? (
                        <>
                          <Clock className="h-3 w-3 animate-pulse" />
                          <span>Arriving in 5 mins</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Placed on {isClient ? new Date(order.createdAt).toLocaleDateString() : '...'}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-headline">{activeCategory === 'All' ? 'Our Products' : activeCategory}</h2>
            <p className="text-sm text-muted-foreground">{filteredProducts.length} items found</p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-20 rounded-xl text-center space-y-4">
              <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">We couldn't find anything matching your search.</p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>Clear search</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
