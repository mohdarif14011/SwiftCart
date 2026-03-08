
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { 
  Leaf, Apple, Milk, Croissant, Cookie, Sparkles, CookingPot, LayoutGrid, Heart, Plus, Minus, ArrowLeft, Clock, Loader2, Package, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Product } from '@/app/types';

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
  const router = useRouter();
  const db = useFirestore();
  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products, isLoading } = useCollection<Product>(productsQuery);
  
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].name);
  const [localSearch, setLocalSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => 
      p.category === activeCategory && 
      (p.name.toLowerCase().includes(localSearch.toLowerCase()) || 
       p.description?.toLowerCase().includes(localSearch.toLowerCase()))
    );
  }, [products, activeCategory, localSearch]);

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem-calc(4rem+env(safe-area-inset-bottom)))] bg-white overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-50 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-slate-100 shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-slate-900" />
        </Button>
        <h1 className="text-lg font-bold text-slate-900">Categories</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 flex-shrink-0 border-r border-slate-50 bg-slate-50/30 overflow-y-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.name} 
              onClick={() => {
                setActiveCategory(cat.name);
                setLocalSearch(''); 
              }} 
              className={cn(
                "w-full flex flex-col items-center gap-1.5 py-4 px-1 transition-all relative",
                activeCategory === cat.name 
                  ? "bg-white text-primary" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {activeCategory === cat.name && (
                <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-l-full" />
              )}
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                activeCategory === cat.name ? "bg-primary/10" : "bg-transparent"
              )}>
                <cat.icon className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-bold text-center uppercase tracking-tight leading-tight px-1">
                {cat.name}
              </span>
            </button>
          ))}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-50 bg-white shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 leading-tight">{activeCategory}</h2>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{filteredProducts.length} items</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                placeholder={`Search ${activeCategory}...`}
                className="w-full pl-9 bg-slate-50 border-none rounded-xl h-9 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/20 touch-pan-y">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 pb-20">
                {filteredProducts.map(product => (
                  <ProductItem key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <CookingPot className="h-8 w-8 mb-3 text-slate-300" />
                <p className="font-bold text-sm text-slate-900">No items found</p>
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

  const offer = product.offerPercentage || 0;
  const sellingPrice = product.price * (1 - offer / 100);

  return (
    <div className="flex flex-col w-full group">
      <div className="relative aspect-square bg-white rounded-[2.5rem] overflow-hidden flex items-center justify-center p-3 mb-2 border border-slate-100/50 shadow-sm">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <Package className="h-10 w-10 text-slate-100" />
        )}
        <button 
          onClick={() => toggleFavorite(product.id)} 
          className={cn("absolute top-3 right-3 transition-colors z-10 p-1.5 rounded-full bg-slate-50/80 backdrop-blur-sm", isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400')}
        >
          <Heart className={cn("h-4 w-4", isFavorite && 'fill-current')} />
        </button>
      </div>

      <div className="flex flex-col px-1 gap-0.5">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="h-2.5 w-2.5" />
            <span className="text-[9px] font-bold">9 mins</span>
          </div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            {product.weight}{product.unit}
          </span>
        </div>
        
        <h4 className="text-sm font-bold text-slate-900 truncate leading-tight">{product.name}</h4>
        
        <div className="flex items-center gap-1.5 mt-0.5 mb-1.5">
          <span className="text-sm font-bold text-slate-900">₹{sellingPrice.toFixed(0)}</span>
          {offer > 0 && (
            <>
              <span className="text-[9px] text-slate-300 line-through">₹{product.price.toFixed(0)}</span>
              <span className="text-[9px] font-bold text-green-600 ml-auto bg-green-50 px-1 py-0.5 rounded">
                {offer}%
              </span>
            </>
          )}
        </div>
      </div>

      <div className="mt-auto">
        {!cartItem ? (
          <Button 
            onClick={() => addToCart(product)} 
            className="w-full h-9 rounded-2xl bg-white text-primary border border-primary/10 hover:bg-primary hover:text-white transition-all font-bold text-xs"
          >
            ADD
          </Button>
        ) : (
          <div className="flex items-center justify-between bg-primary text-white rounded-2xl overflow-hidden h-9 shadow-sm">
            <button 
              className="flex-1 flex items-center justify-center h-full hover:bg-black/10 transition-colors" 
              onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </button>
            <div className="px-1 flex flex-col items-center justify-center min-w-[35px]">
              <span className="text-xs font-bold">{cartItem.quantity}</span>
              <span className="text-[7px] font-medium opacity-80 leading-none">
                {product.unit === 'kg' ? `${cartItem.quantity * (product.weight || 1)}kg` : `${cartItem.quantity * (product.weight || 1)}g`}
              </span>
            </div>
            <button 
              className="flex-1 flex items-center justify-center h-full hover:bg-black/10 transition-colors" 
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
