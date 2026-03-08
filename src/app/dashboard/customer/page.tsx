
'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import { 
  Leaf, Apple, Milk, Croissant, Cookie, Sparkles, CookingPot, LayoutGrid, Star, Heart, Plus, Minus, Clock
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
          <button key={cat.name} onClick={() => setActiveCategory(cat.name)} className="flex flex-col items-center gap-2 min-w-[70px]">
            <div className={cn("p-3 rounded-2xl transition-all", activeCategory === cat.name ? "bg-primary text-white" : "bg-slate-50 text-slate-500")}>
              <cat.icon className="h-6 w-6" />
            </div>
            <span className={cn("text-[11px] font-semibold", activeCategory === cat.name ? "text-primary" : "text-slate-400")}>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-8">
        {activeCategory === 'All' && !searchQuery ? (
          Object.entries(groupedProducts).map(([category, items]) => (
            <section key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{category}</h2>
                <button onClick={() => setActiveCategory(category)} className="text-primary text-sm font-semibold">View all</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {items.map(product => <ProductCard key={product.id} product={product} layout="horizontal" />)}
              </div>
            </section>
          ))
        ) : (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{activeCategory === 'All' ? 'Search Results' : activeCategory}</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
              {filteredProducts.map(product => <ProductCard key={product.id} product={product} layout="grid" />)}
            </div>
            {filteredProducts.length === 0 && (
              <div className="py-20 text-center text-slate-400 font-medium">No products found.</div>
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
    <div className={cn("flex flex-col transition-all group", layout === 'horizontal' ? 'min-w-[150px] max-w-[150px]' : 'w-full')}>
      <div className="relative aspect-square bg-slate-50 rounded-[2rem] overflow-hidden flex items-center justify-center p-4 mb-3 border border-slate-100/50">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
        />
        <button 
          onClick={() => toggleFavorite(product.id)} 
          className={cn("absolute top-3 right-3 transition-colors z-10", isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400')}
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
