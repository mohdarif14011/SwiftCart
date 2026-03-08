
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
  LogOut,
  Users,
  Truck,
  UserPlus,
  Loader2,
  Mail,
  Lock,
  Phone
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { products, setProducts, setUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  // Form states for adding product
  const [prodForm, setProdForm] = useState({ name: '', category: '', price: '', inventory: '10' });
  
  // Form states for adding agent
  const [agentForm, setAgentForm] = useState({ 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: '', 
    phone: '' 
  });

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
    toast({ title: "Product Removed", description: "The item has been removed from the catalog." });
  };

  const handleDeleteUser = (col: string, id: string) => {
    deleteDocumentNonBlocking(doc(db, col, id));
    if (col === 'deliveryAgents') {
      deleteDocumentNonBlocking(doc(db, 'roles_delivery_agent', id));
    }
    toast({ title: "User Deleted", description: "The account and role have been revoked." });
  };

  const handleAddProduct = () => {
    if (!prodForm.name || !prodForm.category || !prodForm.price) return;
    
    setIsAddingProduct(true);
    const newProduct = {
      id: Math.random().toString(36).substr(2, 9),
      name: prodForm.name,
      category: prodForm.category,
      price: parseFloat(prodForm.price),
      inventory: parseInt(prodForm.inventory),
      imageUrl: `https://picsum.photos/seed/${prodForm.name}/300/300`,
      description: `Freshly stocked ${prodForm.name}`
    };

    setProducts([...products, newProduct]);
    toast({ title: "Product Added", description: `${prodForm.name} is now live.` });
    setProdForm({ name: '', category: '', price: '', inventory: '10' });
    setIsAddingProduct(false);
  };

  const handleAddAgent = async () => {
    if (!agentForm.email || !agentForm.password || !agentForm.firstName || !agentForm.lastName) {
      toast({ variant: "destructive", title: "Error", description: "Email, Password, and Name are required." });
      return;
    }

    setIsAddingAgent(true);
    
    let secondaryApp;
    try {
      // 1. Create a temporary secondary Firebase app instance to register the user
      // This avoids signing out the current Admin user
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryOnboarding');
      const secondaryAuth = getAuth(secondaryApp);
      
      // 2. Create the Auth Account
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, agentForm.email, agentForm.password);
      const uid = userCredential.user.uid;
      
      // 3. Clean up secondary app immediately
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      // 4. Use main Firestore instance to grant the Security Role
      setDocumentNonBlocking(doc(db, 'roles_delivery_agent', uid), {
        assignedAt: new Date().toISOString(),
        active: true
      }, { merge: true });

      // 5. Create the Delivery Agent Profile
      setDocumentNonBlocking(doc(db, 'deliveryAgents', uid), {
        id: uid,
        firstName: agentForm.firstName,
        lastName: agentForm.lastName,
        email: agentForm.email,
        phone: agentForm.phone,
        status: 'Available',
        vehicleType: 'E-Bike',
        joinedAt: new Date().toISOString()
      }, { merge: true });

      toast({ title: "Agent Onboarded", description: `${agentForm.firstName} has been created and granted fleet access.` });
      setAgentForm({ email: '', password: '', firstName: '', lastName: '', phone: '' });
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "Onboarding Failed", 
        description: error.message || "Could not create agent account."
      });
      // Ensure cleanup if creation fails
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch(e) {}
      }
    } finally {
      setIsAddingAgent(false);
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
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-white px-6">Fleet Management</TabsTrigger>
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
                        <Input 
                          id="name" 
                          placeholder="Organic Strawberries" 
                          value={prodForm.name}
                          onChange={(e) => setProdForm({...prodForm, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Input 
                            id="category" 
                            placeholder="Fruits" 
                            value={prodForm.category}
                            onChange={(e) => setProdForm({...prodForm, category: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price ($)</Label>
                          <Input 
                            id="price" 
                            type="number" 
                            step="0.01" 
                            placeholder="4.99" 
                            value={prodForm.price}
                            onChange={(e) => setProdForm({...prodForm, price: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="stock">Initial Stock</Label>
                        <Input 
                          id="stock" 
                          type="number" 
                          value={prodForm.inventory}
                          onChange={(e) => setProdForm({...prodForm, inventory: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddProduct} disabled={isAddingProduct} className="w-full bg-primary">
                        {isAddingProduct ? <Loader2 className="animate-spin" /> : "Create Listing"}
                      </Button>
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
              {/* Delivery Agents Management */}
              <Card className="border-none shadow-sm md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Active Fleet</CardTitle>
                    <CardDescription>Manage your delivery agents. Only you (the Admin) can create new agent accounts.</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default" className="gap-2 bg-accent hover:bg-accent/90">
                        <UserPlus className="h-4 w-4" /> Create Agent Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add New Delivery Agent</DialogTitle>
                        <CardDescription>Enter the agent's details. An authentication account and profile will be created.</CardDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="agent-first">First Name</Label>
                            <Input 
                              id="agent-first" 
                              placeholder="John" 
                              value={agentForm.firstName}
                              onChange={(e) => setAgentForm({...agentForm, firstName: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="agent-last">Last Name</Label>
                            <Input 
                              id="agent-last" 
                              placeholder="Smith" 
                              value={agentForm.lastName}
                              onChange={(e) => setAgentForm({...agentForm, lastName: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agent-email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="agent-email" 
                              type="email"
                              className="pl-10"
                              placeholder="john.smith@swiftcart.com" 
                              value={agentForm.email}
                              onChange={(e) => setAgentForm({...agentForm, email: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="agent-phone">Phone Number</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                id="agent-phone" 
                                className="pl-10"
                                placeholder="+91 98765 43210" 
                                value={agentForm.phone}
                                onChange={(e) => setAgentForm({...agentForm, phone: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="agent-pass">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                id="agent-pass" 
                                type="password"
                                className="pl-10"
                                placeholder="••••••••" 
                                value={agentForm.password}
                                onChange={(e) => setAgentForm({...agentForm, password: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          className="w-full h-12 text-base font-bold" 
                          onClick={handleAddAgent}
                          disabled={isAddingAgent}
                        >
                          {isAddingAgent ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            "Create & Grant Access"
                          )}
                        </Button>
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
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agents?.map((agent) => (
                          <TableRow key={agent.id}>
                            <TableCell>
                              <div className="font-medium">{agent.firstName} {agent.lastName}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">{agent.vehicleType || 'E-Bike'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-medium">{agent.email}</div>
                              <div className="text-[10px] text-muted-foreground">{agent.phone || 'No Phone'}</div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                agent.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                              }`}>
                                {agent.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {agent.joinedAt ? new Date(agent.joinedAt).toLocaleDateString() : 'Initial'}
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
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No delivery agents in the fleet yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Customers View (Read Only for Admin) */}
              <Card className="border-none shadow-sm md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Registered Customers</CardTitle>
                    <CardDescription>View all shoppers on the platform</CardDescription>
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
                          <TableHead>Phone</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                            <TableCell className="text-xs">{user.phone || 'N/A'}</TableCell>
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
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No customers found</TableCell>
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
