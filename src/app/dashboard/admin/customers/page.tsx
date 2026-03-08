'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Users, Trash2, MapPin, Package, Calendar, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function AdminCustomers() {
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const db = useFirestore();
  const { toast } = useToast();

  const customersQuery = useMemoFirebase(() => collection(db, 'customers'), [db]);
  const { data: customers } = useCollection(customersQuery);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => 
      `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const handleDeleteCustomer = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteDocumentNonBlocking(doc(db, 'customers', id));
    toast({ title: "Customer Removed", description: "Profile has been deleted." });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Customer Directory</h1>
        <p className="text-sm text-muted-foreground">Manage your shopper base and view their history.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search shoppers..." 
          className="pl-10 h-11 bg-white border-none shadow-sm rounded-2xl"
          value={customerSearch} 
          onChange={(e) => setCustomerSearch(e.target.value)} 
        />
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</TableHead>
              <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((user) => (
              <TableRow 
                key={user.id} 
                className="cursor-pointer hover:bg-slate-50 transition-colors border-slate-50"
                onClick={() => setSelectedCustomer(user)}
              >
                <TableCell className="font-bold text-slate-900">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-500">{user.email}</TableCell>
                <TableCell className="text-xs font-medium text-slate-500">{user.phone || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-300 hover:text-destructive h-8 w-8 rounded-full" 
                    onClick={(e) => handleDeleteCustomer(e, user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-300 italic text-sm">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <CustomerDetailsDialog 
        customer={selectedCustomer} 
        isOpen={!!selectedCustomer} 
        onClose={() => setSelectedCustomer(null)} 
      />
    </div>
  );
}

function CustomerDetailsDialog({ customer, isOpen, onClose }: { customer: any | null, isOpen: boolean, onClose: () => void }) {
  const db = useFirestore();
  
  // Query for this customer's orders
  const ordersQuery = useMemoFirebase(() => {
    if (!customer?.id) return null;
    return query(collection(db, 'orders'), where('userId', '==', customer.id));
  }, [db, customer?.id]);

  const { data: customerOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-0 border-none bg-white shadow-2xl overflow-hidden gap-0">
        <div className="p-8 pb-4">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border-none">
                Customer Profile
              </Badge>
              <div className="flex gap-2">
                {customer.location && (
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold tracking-tight text-slate-900">
                {customer.firstName} {customer.lastName}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-2">
                <Mail className="h-3 w-3" /> {customer.email}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Contact</p>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-primary" /> {customer.phone || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" /> Active Shopper
                </p>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Primary Address</p>
              <p className="text-xs font-bold text-slate-700 leading-relaxed">{customer.address || 'No address provided'}</p>
              {customer.nearby && (
                <p className="text-[10px] text-slate-400 italic">Landmark: {customer.nearby}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-8 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Order History
            </h3>
            <Badge variant="outline" className="text-[9px] font-bold border-slate-200">
              {customerOrders?.length || 0} Orders
            </Badge>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
            {ordersLoading ? (
              <div className="py-10 text-center"><Clock className="h-4 w-4 animate-spin text-primary mx-auto" /></div>
            ) : customerOrders && customerOrders.length > 0 ? (
              customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">ORD-{order.id}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(order.createdAt).toLocaleDateString()} • ₹{order.total?.toFixed(2)}
                    </p>
                  </div>
                  <Badge 
                    variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} 
                    className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-lg"
                  >
                    {order.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-300 italic text-[11px] font-medium border-2 border-dashed border-slate-200 rounded-3xl">
                No orders yet.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
