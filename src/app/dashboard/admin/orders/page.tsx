
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, Clock, Truck, CheckCircle, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, limit } from 'firebase/firestore';
import { Order } from '@/app/types';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrders() {
  const [orderSearch, setOrderSearch] = useState('');
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const db = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(() => query(collection(db, 'orders'), limit(100)), [db]);
  const agentsQuery = useMemoFirebase(() => query(collection(db, 'deliveryAgents'), limit(100)), [db]);
  
  const { data: orders } = useCollection(ordersQuery);
  const { data: agents } = useCollection(agentsQuery);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => 
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.address.toLowerCase().includes(orderSearch.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, orderSearch]);

  const handleAssignAgent = (agentId: string) => {
    if (!assigningOrder) return;
    
    updateDocumentNonBlocking(doc(db, 'orders', assigningOrder.id), {
      agentId: agentId,
      status: 'PICKED_UP',
      assignedAt: new Date().toISOString()
    });

    toast({ title: "Agent Assigned", description: `Order ${assigningOrder.id} has been dispatched.` });
    setAssigningOrder(null);
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl font-bold font-headline">Order Stream</CardTitle>
        </div>
        <CardDescription>Track and dispatch customer orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search orders by ID or address..." 
              className="pl-10"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold">ORD-{order.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="font-bold text-primary">₹{order.total.toFixed(2)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">{order.address}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {!order.agentId && order.status !== 'DELIVERED' ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setAssigningOrder(order)} className="bg-accent hover:bg-accent/90">
                            Assign Agent
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Select Delivery Agent</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            {agents?.filter(a => a.status === 'Available').map(agent => (
                              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                                <div>
                                  <p className="font-bold">{agent.firstName} {agent.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{agent.vehicleType || 'E-Bike'}</p>
                                </div>
                                <Button size="sm" onClick={() => handleAssignAgent(agent.id)}>Assign</Button>
                              </div>
                            ))}
                            {agents?.filter(a => a.status === 'Available').length === 0 && (
                              <p className="text-center text-sm text-muted-foreground">No agents currently available.</p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <Truck className="h-3 w-3" /> {order.agentId ? 'Dispatched' : 'Completed'}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    No orders matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
