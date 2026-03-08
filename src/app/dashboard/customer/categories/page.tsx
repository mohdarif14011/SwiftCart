
'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { 
  Leaf, Apple, Milk, Croissant, Cookie, Sparkles, CookingPot, LayoutGrid
} from 'lucide-react';

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

  return (
    <div className="p-4 bg-slate-50 space-y-4">
      <h2 className="text-2xl font-black text-slate-900 px-2">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <button 
            key={cat.name} 
            onClick={() => { router.push('/dashboard/customer'); }} 
            className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary transition-colors group"
          >
            <div className="p-4 bg-slate-50 rounded-2xl text-slate-700 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <cat.icon className="h-8 w-8" />
            </div>
            <span className="text-[10px] font-black text-center uppercase tracking-tight leading-tight">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
