
'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/app/lib/store';
import { 
  Leaf, Apple, Milk, Croissant, Cookie, Sparkles, CookingPot, Search, Heart, Plus, Minus, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

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
    <div className="flex h-[calc(100vh-140px)] bg-white overflow-hidden">
      {/* Sidebar: Categories */}
      <aside className="w-24 sm:w-32 flex-shrink-0 border-r border-slate-100 bg-slate-50 overflow-y-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button 
            key={cat.name} 
            onClick={() => {
              setActiveCategory(cat.name);
              setLocalSearch(''); // Clear search when switching categories
            }} 
            className={cn(
              "w-full flex flex-col items-center gap-2 py-6 px-2 transition-all relative",
              activeCategory === cat.name 
                ? "bg-white text-primary" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {activeCategory === cat.name && (
              <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-l-full" />
            )}
            <div className={cn(
              "p-3 rounded-2xl transition-colors",
              activeCategory === cat.name ? "bg-primary/10" : "bg-transparent"
            )}>
              <cat.icon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-black text-center uppercase tracking-tighter leading-tight">
              {cat.name}
            </span>
          </button>
        ))}
      </aside>

      {/* Main Content: Search + Products */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-white">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">{activeCategory}</h2>
              <p className="text-xs text-slate-400 font-bold">{filteredProducts.length} items available</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={`Search in ${activeCategory.toLowerCase()}...`}
                className="pl-9 bg-slate-50 border-none rounded-xl h-11 text-sm font-bold shadow-inner"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 pb-8">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <CookingPot className="h-12 w-12 mb-4" />
              <p className="font-black text-slate-900">No items found</p>
              <p className="text-xs font-bold text-slate-400">Try a different search or category</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const { cart, favorites, addToCart, updateCartQuantity, toggleFavorite } = useAppStore();
  const cartItem = cart.find(i => i.productId === product.id);
  const isFavorite = favorites.includes(product.id);

  return (
    <div className="flex flex-col w-full group">
      <div className="relative aspect-square bg-white rounded-2xl overflow-hidden flex items-center justify-center p-3 mb-2 border border-slate-100 shadow-sm">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-300" 
        />
        <button 
          onClick={() => toggleFavorite(product.id)} 
          className={cn("absolute top-2 right-2 transition-colors z-10", isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400')}
        >
          <Heart className={cn("h-5 w-5", isFavorite && 'fill-current')} />
        </button>
        
        {!cartItem ? (
          <button 
            onClick={() => addToCart(product)} 
            className="absolute bottom-2 right-2 bg-white text-primary font-black text-[10px] px-3 py-1.5 rounded-lg shadow-md border border-slate-100 hover:bg-primary hover:text-white transition-all z-10"
          >
            ADD
          </button>
        ) : (
          <div className="absolute bottom-2 right-2 bg-primary text-white flex items-center rounded-lg shadow-md overflow-hidden z-10">
            <button className="px-2 py-1 hover:bg-primary/90 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}>
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-1.5 text-[10px] font-black">{cartItem.quantity}</span>
            <button className="px-2 py-1 hover:bg-primary/90 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}>
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col px-1">
        <h4 className="text-[10px] font-black text-slate-900 line-clamp-2 leading-tight h-7 mb-1">{product.name}</h4>
        <div className="flex items-center gap-0.5 mb-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={cn("h-2 w-2", s <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900">${product.price.toFixed(2)}</span>
          {product.offerPercentage && (
            <span className="text-[8px] font-black text-green-600 bg-green-50 px-1 rounded">{product.offerPercentage}% OFF</span>
          )}
        </div>
      </div>
    </div>
  );
}
