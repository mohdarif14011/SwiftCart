
'use client';

import { useState } from 'react';
import { useAppStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Package, 
  DollarSign, 
  Layers, 
  LogOut,
  BarChart3,
  Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Product } from '@/app/types';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { products, setProducts, setUser } = useAppStore();
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleLogout = () => {
    setUser(null);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="h-16 bg-white border-b px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-headline text-primary">SwiftCart Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-bold">Total Inventory</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                {products.reduce((acc, p) => acc + p.inventory, 0)}
                <Package className="h-6 w-6 text-primary opacity-20" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-bold">Product Lines</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                {products.length}
                <Layers className="h-6 w-6 text-accent opacity-20" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-bold">Total Value</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                ${products.reduce((acc, p) => acc + (p.price * p.inventory), 0).toFixed(2)}
                <DollarSign className="h-6 w-6 text-green-500 opacity-20" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-bold">Active Agents</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                12
                <Truck className="h-6 w-6 text-blue-500 opacity-20" />
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-2xl font-bold font-headline">Product Management</CardTitle>
              <CardDescription>Add, update, and manage your grocery listings</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" placeholder="Organic Strawberries" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" placeholder="Fruits" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input id="price" type="number" step="0.01" placeholder="4.99" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inventory">Starting Inventory</Label>
                    <Input id="inventory" type="number" placeholder="100" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full bg-primary">Create Listing</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                          </div>
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted rounded-full text-[10px] font-bold uppercase">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${product.inventory < 10 ? 'text-destructive font-bold' : ''}`}>
                          {product.inventory}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
