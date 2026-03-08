
'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import { 
  Leaf, Apple, Milk, Croissant, Cookie, Sparkles, CookingPot, LayoutGrid, Heart, Plus, Minus, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
            <div className="grid grid-cols-2 gap-x-4 gap-y-12">
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
      {/* Image Container */}
      <div className="relative aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden flex items-center justify-center p-4 mb-3 border border-slate-100/50">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
        />
        <button 
          onClick={() => toggleFavorite(product.id)} 
          className={cn("absolute top-4 right-4 transition-colors z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm", isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-red-400')}
        >
          <Heart className={cn("h-4 w-4", isFavorite && 'fill-current')} />
        </button>
      </div>
      
      {/* Product Details */}
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
        
        <div className="flex items-center gap-2 mt-0.5 mb-2">
          <span className="text-sm font-bold text-slate-900">₹{product.price.toFixed(0)}</span>
          <span className="text-[10px] text-slate-300 line-through">₹{(product.price * 1.5).toFixed(0)}</span>
          {product.offerPercentage && (
            <span className="text-[10px] font-bold text-green-600 ml-auto bg-green-50 px-1.5 py-0.5 rounded">
              {product.offerPercentage}% off
            </span>
          )}
        </div>
      </div>

      {/* Action Area Below the Card */}
      <div className="mt-auto">
        {!cartItem ? (
          <Button 
            onClick={() => addToCart(product)} 
            className="w-full h-10 rounded-2xl bg-white text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all font-bold text-xs"
          >
            ADD
          </Button>
        ) : (
          <div className="flex items-center justify-between bg-primary text-white rounded-2xl overflow-hidden h-10 shadow-sm">
            <button 
              className="flex-1 flex items-center justify-center h-full hover:bg-black/10 transition-colors" 
              onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="px-2 flex flex-col items-center justify-center min-w-[40px]">
              <span className="text-xs font-bold">{cartItem.quantity}</span>
              <span className="text-[8px] font-medium opacity-80 leading-none">
                {product.unit === 'kg' ? `${cartItem.quantity * (product.weight || 1)}kg` : `${cartItem.quantity * (product.weight || 1)}g`}
              </span>
            </div>
            <button 
              className="flex-1 flex items-center justify-center h-full hover:bg-black/10 transition-colors" 
              onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
