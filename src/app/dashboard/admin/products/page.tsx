'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Edit, Search, Package, Image as ImageIcon, Tag, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/app/types';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Bakery',
  'Snacks',
  'Home Essentials',
  'Kitchen Essentials',
];

export default function AdminProducts() {
  const db = useFirestore();
  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products, isLoading } = useCollection<Product>(productsQuery);
  
  const [productSearch, setProductSearch] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const [prodForm, setProdForm] = useState({ 
    name: '', 
    category: '', 
    price: '', 
    imageUrl: '',
    weight: '',
    unit: 'g' as 'g' | 'kg',
    isInStock: true,
    offerPercentage: ''
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const handleDeleteProduct = (id: string) => {
    deleteDocumentNonBlocking(doc(db, 'products', id));
    toast({ title: "Product Removed", description: "The item has been removed from the catalog." });
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    setProdForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      imageUrl: product.imageUrl || '',
      weight: product.weight?.toString() || '',
      unit: product.unit || 'g',
      isInStock: (product.inventory || 0) > 0,
      offerPercentage: product.offerPercentage?.toString() || ''
    });
    setIsProductDialogOpen(true);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdForm({ 
      name: '', 
      category: '', 
      price: '', 
      imageUrl: '', 
      weight: '', 
      unit: 'g', 
      isInStock: true, 
      offerPercentage: '' 
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!prodForm.name || !prodForm.category || !prodForm.price) {
      toast({ variant: "destructive", title: "Error", description: "Name, Category, and Price are required." });
      return;
    }
    
    setIsSavingProduct(true);
    
    const productId = editingProduct?.id || Math.random().toString(36).substr(2, 9);
    
    // Construct base product data
    const productData: any = {
      id: productId,
      name: prodForm.name,
      category: prodForm.category,
      price: parseFloat(prodForm.price),
      inventory: prodForm.isInStock ? 99 : 0,
      imageUrl: prodForm.imageUrl || '',
      description: `Freshly stocked ${prodForm.name}`,
      unit: prodForm.unit,
    };

    // Only add optional numeric fields if they have a value to avoid 'undefined' errors in Firestore
    if (prodForm.weight !== '' && !isNaN(parseFloat(prodForm.weight))) {
      productData.weight = parseFloat(prodForm.weight);
    }
    
    if (prodForm.offerPercentage !== '' && !isNaN(parseFloat(prodForm.offerPercentage))) {
      productData.offerPercentage = parseFloat(prodForm.offerPercentage);
    }

    setDocumentNonBlocking(doc(db, 'products', productId), productData, { merge: true });
    
    toast({ 
      title: editingProduct ? "Product Updated" : "Product Added", 
      description: `${prodForm.name} changes have been saved.` 
    });

    setIsSavingProduct(false);
    setIsProductDialogOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl font-bold font-headline">Inventory</CardTitle>
            <CardDescription>Manage your store catalog</CardDescription>
          </div>
          <Button onClick={handleOpenAddProduct} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-10"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-md border overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted rounded-full text-[10px] font-bold uppercase">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {product.weight ? `${product.weight}${product.unit}` : 'N/A'}
                      </TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {product.offerPercentage ? (
                          <span className="text-green-600 font-bold">{product.offerPercentage}% OFF</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (product.inventory || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {(product.inventory || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => handleEditProductClick(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                        No products found in catalog.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" placeholder="Organic Strawberries" value={prodForm.name} onChange={(e) => setProdForm({...prodForm, name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(val) => setProdForm({...prodForm, category: val})} value={prodForm.category}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" type="number" step="0.01" placeholder="99.00" value={prodForm.price} onChange={(e) => setProdForm({...prodForm, price: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="offer">Offer Percentage (%)</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="offer" type="number" className="pl-10" placeholder="20" value={prodForm.offerPercentage} onChange={(e) => setProdForm({...prodForm, offerPercentage: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weight">Weight</Label>
              <div className="flex gap-2">
                <Input id="weight" type="number" placeholder="500" className="flex-1" value={prodForm.weight} onChange={(e) => setProdForm({...prodForm, weight: e.target.value})} />
                <Select onValueChange={(val) => setProdForm({...prodForm, unit: val as 'g' | 'kg'})} value={prodForm.unit}>
                  <SelectTrigger className="w-20"><SelectValue placeholder="Unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Product Image URL (Cloudinary)</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="imageUrl" className="pl-10" placeholder="https://res.cloudinary.com/..." value={prodForm.imageUrl} onChange={(e) => setProdForm({...prodForm, imageUrl: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
              <Label>Stock Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{prodForm.isInStock ? 'In Stock' : 'Out of Stock'}</span>
                <Switch checked={prodForm.isInStock} onCheckedChange={(checked) => setProdForm({...prodForm, isInStock: checked})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full bg-primary h-12 font-bold">
              {isSavingProduct ? <Loader2 className="animate-spin" /> : editingProduct ? "Update Product Listing" : "Create Product Listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
