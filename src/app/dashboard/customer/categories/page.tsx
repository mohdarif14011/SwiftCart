
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { 
  Leaf, Apple, Milk, Croissant, Cookie, Sparkles, CookingPot, Search, Heart, Plus, Minus, Star, ArrowLeft, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { name: 'Vegetables', icon: Leaf },
  { name: 'Fruits', icon: Apple },
  { name: 'Dairy', icon: Milk },
  { name: 'Bakery', icon: Croissant },
  { name: 'Snacks', icon: Cookie },
  { name: 'Home Essentials', icon: Sparkles },
  { name: 'Kitchen Essentials', icon: CookingPot },
];

export default function CustomerCategories() {
  const { products } = useAppStore();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].name);
  const [localSearch, setLocalSearch] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.category === activeCategory && 
      (p.name.toLowerCase().includes(localSearch.toLowerCase()) || 
       p.description.toLowerCase().includes(localSearch.toLowerCase()))
    );
  }, [products, activeCategory, localSearch]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white overflow-hidden">
      <div className="px-6 py-4 flex items-center gap-4 border-b border-slate-50 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-slate-100 shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-slate-900" />
        </Button>
        <h1 className="text-xl font-bold text-slate-900">Browse Categories</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 sm:w-24 flex-shrink-0 border-r border-slate-50 bg-slate-50/50 overflow-y-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.name} 
              onClick={() => {
                setActiveCategory(cat.name);
                setLocalSearch(''); 
              }} 
              className={cn(
                "w-full flex flex-col items-center gap-2 py-5 px-1 transition-all relative",
                activeCategory === cat.name 
                  ? "bg-white text-primary" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {activeCategory === cat.name && (
                <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-l-full" />
              )}
              <div className={cn(
                "p-2.5 rounded-xl transition-colors",
                activeCategory === cat.name ? "bg-primary/10" : "bg-transparent"
              )}>
                <cat.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-center uppercase tracking-wider leading-tight px-1">
                {cat.name}
              </span>
            </button>
          ))}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/20">
          <div className="p-4 border-b border-slate-50 bg-white shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{activeCategory}</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{filteredProducts.length} items</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                placeholder={`Search in ${activeCategory.toLowerCase()}...`}
                className="w-full pl-9 bg-slate-50 border-none rounded-xl h-10 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 pb-20">
                {filteredProducts.map(product => (
                  <ProductItem key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <CookingPot className="h-10 w-10 mb-4 text-slate-300" />
                <p className="font-semibold text-sm text-slate-900">No items found</p>
                <p className="text-[10px] font-medium text-slate-400">Try a different search</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProductItem({ product }: { product: any }) {
  const { cart, favorites, addToCart, updateCartQuantity, toggleFavorite } = useAppStore();
  const cartItem = cart.find(i => i.productId === product.id);
  const isFavorite = favorites.includes(product.id);

  return (
    <div className="flex flex-col w-full group">
      <div className="relative aspect-square bg-white rounded-[2rem] overflow-hidden flex items-center justify-center p-4 mb-3 border border-slate-100/50 shadow-sm">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
        />
        <button 
          onClick={() => toggleFavorite(product.id)} 
          className={cn("absolute top-3 right-3 transition-colors z-10 p-1", isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400')}
        >
          <Heart className={cn("h-4 w-4", isFavorite && 'fill-current')} />
        </button>
        
        {!cartItem ? (
          <button 
            onClick={() => addToCart(product)} 
            className="absolute bottom-3 right-3 bg-white text-primary font-bold text-[10px] px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 hover:bg-primary hover:text-white transition-all z-10"
          >
            ADD
          </button>
        ) : (
          <div className="absolute bottom-3 right-3 bg-primary text-white flex items-center rounded-xl shadow-sm overflow-hidden z-10">
            <button className="px-2 py-1.5 hover:bg-primary/90 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}>
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-1 text-[11px] font-bold">{cartItem.quantity}</span>
            <button className="px-2 py-1.5 hover:bg-primary/90 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}>
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col px-1 gap-1">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="h-3 w-3" />
            <span className="text-[10px] font-bold">9 mins</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {product.weight}{product.unit}
          </span>
        </div>
        
        <h4 className="text-sm font-bold text-slate-900 truncate leading-tight">{product.name}</h4>
        
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-bold text-slate-900">₹{product.price.toFixed(0)}</span>
          <span className="text-[10px] text-slate-300 line-through">₹{(product.price * 1.5).toFixed(0)}</span>
          {product.offerPercentage && (
            <span className="text-[10px] font-bold text-green-600 ml-auto">
              {product.offerPercentage}% off
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
