
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutGrid, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/app/lib/store';

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Bakery',
  'Snacks',
  'Home Essentials',
  'Kitchen Essentials',
];

export default function AdminCategories() {
  const { products } = useAppStore();

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold font-headline">Category Management</CardTitle>
          </div>
          <CardDescription>Organize your product catalog into searchable categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="p-6 border rounded-2xl flex items-center justify-between bg-white shadow-sm hover:border-primary transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold">{cat}</span>
                </div>
                <Badge variant="secondary">{products.filter(p => p.category === cat).length} Products</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
