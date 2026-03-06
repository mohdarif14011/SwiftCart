
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader2, Plus, ShoppingCart } from 'lucide-react';
import { generateShoppingList } from '@/ai/flows/smart-shopping-list-generation';
import { useAppStore } from '@/app/lib/store';
import { useToast } from '@/hooks/use-toast';

export function SmartShoppingList() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<string[]>([]);
  const products = useAppStore((state) => state.products);
  const addToCart = useAppStore((state) => state.addToCart);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const result = await generateShoppingList(input);
      setSuggestedItems(result.shoppingList);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate shopping list. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggested = (itemName: string) => {
    // Basic fuzzy matching to add existing products to cart
    const found = products.find(p => p.name.toLowerCase().includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(p.name.toLowerCase()));
    if (found) {
      addToCart(found);
      toast({
        title: 'Added to cart',
        description: `${found.name} matched your request for "${itemName}"`,
      });
    } else {
      toast({
        title: 'Item not found',
        description: `We don't currently stock "${itemName}".`,
      });
    }
  };

  return (
    <Card className="border-none bg-accent/5 overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <CardTitle className="text-xl font-bold font-headline">Smart List Tool</CardTitle>
        </div>
        <CardDescription>
          Tell us what you're planning (e.g., "I want to bake a cake" or "Low carb meal ideas")
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="I'm planning a Italian dinner tonight..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-white"
        />
        <Button 
          onClick={handleGenerate} 
          disabled={loading || !input.trim()}
          className="w-full bg-accent hover:bg-accent/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Suggest Groceries
            </>
          )}
        </Button>

        {suggestedItems.length > 0 && (
          <div className="pt-4 space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">AI Recommendations</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-accent/20 group hover:border-accent transition-colors shadow-sm"
                >
                  <span className="text-sm font-medium">{item}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-accent hover:text-accent hover:bg-accent/10"
                    onClick={() => handleAddSuggested(item)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
