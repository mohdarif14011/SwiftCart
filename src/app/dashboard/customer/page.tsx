
'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import { 
  Leaf, Apple, Milk, Croissant, Cookie, Sparkles, CookingPot, LayoutGrid, Star, Heart, Plus, Minus
} from 'lucide-react';

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

export default function CustomerShop() {
  const { products, searchQuery } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (searchQuery) {
      list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeCategory !== 'All') {
      list = list.filter(p => p.category === activeCategory);
    }
    return list;
  }, [products, searchQuery, activeCategory]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof products> = {};
    products.forEach(p => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [products]);

  return (
    <div className="flex flex-col">
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
        {activeCategory === 'All' && !searchQuery ? (
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
            <h2 className="text-xl font-black text-slate-900">{activeCategory === 'All' ? 'Search Results' : activeCategory}</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
              {filteredProducts.map(product => <ProductCard key={product.id} product={product} layout="grid" />)}
            </div>
            {filteredProducts.length === 0 && (
              <div className="py-20 text-center text-slate-400 font-bold">No products found.</div>
            )}
          </section>
        )}
      </div>
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
          <button onClick={() => addToCart(product)} className="absolute bottom-2 right-2 bg-white text-primary font-black text-xs px-4 py-1.5 rounded-lg shadow-md border border-slate-100 hover:bg-primary hover:text-white transition-all">ADD</button>
        ) : (
          <div className="absolute bottom-2 right-2 bg-primary text-white flex items-center rounded-lg shadow-md overflow-hidden">
            <button className="px-2 py-1 hover:bg-primary/90 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}><Minus className="h-3 w-3" /></button>
            <span className="px-2 text-xs font-black">{cartItem.quantity}</span>
            <button className="px-2 py-1 hover:bg-primary/90 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}><Plus className="h-3 w-3" /></button>
          </div>
        )}
      </div>
      <div className="flex flex-col px-1 gap-1">
        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight h-8">{product.name}</h4>
        <div className="flex items-center gap-1">
          <div className="flex items-center">{[1, 2, 3, 4, 5].map((s) => (<Star key={s} className={cn("h-2.5 w-2.5", s <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />))}</div>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-sm font-black text-slate-900">${product.price.toFixed(2)}</span>
          {product.offerPercentage && (
            <span className="text-[10px] font-black text-green-600 ml-auto">{product.offerPercentage}% OFF</span>
          )}
        </div>
      </div>
    </div>
  );
}
