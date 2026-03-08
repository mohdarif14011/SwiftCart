
'use client';

import { useAppStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import { Star, Heart, Plus, Minus } from 'lucide-react';

export default function CustomerFavorites() {
  const { products, favorites } = useAppStore();
  const favoriteItems = products.filter(p => favorites.includes(p.id));

  return (
    <div className="p-4 bg-slate-50 space-y-4">
      <h2 className="text-2xl font-black text-slate-900">My Favorites</h2>
      {favoriteItems.length === 0 ? (
        <div className="py-20 text-center text-slate-400 font-bold">No favorite items yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {favoriteItems.map(product => <ProductCard key={product.id} product={product} />)}
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
      <div className="relative aspect-square bg-white rounded-2xl overflow-hidden flex items-center justify-center p-3 mb-3 border border-slate-100 shadow-sm">
        <img src={product.imageUrl} alt={product.name} className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300" />
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
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-sm font-black text-slate-900">${product.price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
