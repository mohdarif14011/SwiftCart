
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import { Star, Heart, Plus, Minus, ArrowLeft, Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomerFavorites() {
  const { products, favorites } = useAppStore();
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState('');

  const filteredFavorites = useMemo(() => {
    return products.filter(p => 
      favorites.includes(p.id) && 
      p.name.toLowerCase().includes(localSearch.toLowerCase())
    );
  }, [products, favorites, localSearch]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-2xl bg-white shadow-sm hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-900" />
        </Button>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Favorites</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          placeholder="Search your favorites..." 
          className="w-full pl-10 h-12 bg-white border-none rounded-2xl text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
           <Heart className="h-12 w-12 mb-4 text-slate-300" />
           <p className="font-semibold text-slate-900 text-lg">
             {localSearch ? "No matching favorites" : "No favorites yet"}
           </p>
           <p className="text-sm font-medium text-slate-400 max-w-[200px] mt-2">
             {localSearch ? "Try searching for something else." : "Tap the heart icon on any product to save it here."}
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 pb-20">
          {filteredFavorites.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
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
          className={cn("absolute top-3 right-3 transition-colors z-10", isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400')}
        >
          <Heart className={cn("h-5 w-5", isFavorite && 'fill-current')} />
        </button>
        
        {!cartItem ? (
          <button 
            onClick={() => addToCart(product)} 
            className="absolute bottom-3 right-3 bg-white text-primary font-bold text-xs px-4 py-2 rounded-xl shadow-sm border border-slate-100 hover:bg-primary hover:text-white transition-all z-10"
          >
            ADD
          </button>
        ) : (
          <div className="absolute bottom-3 right-3 bg-primary text-white flex items-center rounded-xl shadow-sm overflow-hidden z-10">
            <button className="px-2 py-2 hover:bg-primary/90 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}>
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-2 text-xs font-bold">{cartItem.quantity}</span>
            <button className="px-2 py-2 hover:bg-primary/90 transition-colors" onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}>
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
