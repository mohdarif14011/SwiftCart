
'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart, Package } from 'lucide-react';
import { Product } from '@/app/types';
import { useAppStore } from '@/app/lib/store';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAppStore((state) => state.addToCart);
  const { toast } = useToast();

  const handleAdd = () => {
    addToCart(product);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your shopping cart.`,
    });
  };

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-none bg-white">
      <div className="relative aspect-square overflow-hidden flex items-center justify-center bg-slate-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Package className="h-12 w-12 text-slate-200" />
        )}
        <div className="absolute top-2 right-2">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            {product.category}
          </span>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1 mb-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">₹{product.price.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{product.inventory} in stock</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={handleAdd}
          className="w-full bg-primary hover:bg-primary/90 gap-2 font-medium"
        >
          <Plus className="h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
