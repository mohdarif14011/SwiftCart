
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
  Users,
  Truck,
  ShieldAlert,
  UserPlus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase';

export default function AdminDashboard() {
  const { products, setProducts, setUser } = useAppStore();
  const [search, setSearch] = useState('');
  const router = useRouter();
  const db = useFirestore();

  // Real-time collections for user management
  const customersQuery = useMemoFirebase(() => collection(db, 'customers'), [db]);
  const agentsQuery = useMemoFirebase(() => collection(db, 'deliveryAgents'), [db]);
  const { data: customers } = useCollection(customersQuery);
  const { data: agents } = useCollection(agentsQuery);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleDeleteUser = async (col: string, id: string) => {
    try {
      await deleteDoc(doc(db, col, id));
      // Also remove from roles if applicable
      if (col === 'deliveryAgents') {
        await deleteDoc(doc(db, 'roles_delivery_agent', id));
      }
    } catch (error) {
      console.error("Failed to delete user", error);
    }
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
              <CardDescription className="text-xs uppercase tracking-wider font-bold">Total Products</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                {products.length}
                <Package className="h-6 w-6 text-primary opacity-20" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-bold">Total Customers</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                {customers?.length || 0}
                <Users className="h-6 w-6 text-accent opacity-20" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-bold">Inventory Value</CardDescription>
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
                {agents?.length || 0}
                <Truck className="h-6 w-6 text-blue-500 opacity-20" />
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white border p-1 h-12 shadow-sm rounded-xl">
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-white px-6">Products</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white px-6">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-2xl font-bold font-headline">Inventory</CardTitle>
                  <CardDescription>Manage your store catalog</CardDescription>
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
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
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
                          <TableCell>{product.inventory}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/10">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteProduct(product.id)}
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
          </TabsContent>

          <TabsContent value="users">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customers Management */}
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Customers</CardTitle>
                    <CardDescription>View and manage shoppers</CardDescription>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteUser('customers', user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!customers || customers.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No customers found</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Agents Management */}
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Delivery Agents</CardTitle>
                    <CardDescription>Manage active fleet</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <UserPlus className="h-4 w-4" /> Add Agent
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Onboard New Delivery Agent</DialogTitle>
                        <CardDescription>Assign agent roles by their authentication UID</CardDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="agent-uid">User UID</Label>
                          <Input id="agent-uid" placeholder="Firebase User UID" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agent-name">Display Name</Label>
                          <Input id="agent-name" placeholder="John Agent" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full">Grant Delivery Privileges</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agents?.map((agent) => (
                          <TableRow key={agent.id}>
                            <TableCell>
                              <div className="font-medium">{agent.firstName} {agent.lastName}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">{agent.vehicleType}</div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                agent.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                              }`}>
                                {agent.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteUser('deliveryAgents', agent.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!agents || agents.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No agents found</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
