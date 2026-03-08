
'use client';

import { useAppStore } from '@/app/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Package, DollarSign, ClipboardList, Truck, TrendingUp, Clock } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminOverview() {
  const { products } = useAppStore();
  const db = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(() => query(collection(db, 'orders'), limit(100)), [db]);
  const agentsQuery = useMemoFirebase(() => query(collection(db, 'deliveryAgents'), limit(100)), [db]);
  
  const { data: remoteOrders } = useCollection(ordersQuery);
  const { data: agents } = useCollection(agentsQuery);

  const activeOrdersCount = remoteOrders?.filter(o => o.status !== 'DELIVERED').length || 0;
  const totalRevenue = remoteOrders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0;
  const availableAgents = agents?.filter(a => a.status === 'Available').length || 0;

  const handleAssignAgent = (orderId: string, agentId: string) => {
    updateDocumentNonBlocking(doc(db, 'orders', orderId), {
      agentId: agentId,
      status: 'PICKED_UP',
      assignedAt: new Date().toISOString()
    });

    toast({ 
      title: "Agent Assigned", 
      description: `Order ${orderId} has been successfully dispatched.` 
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome back, Admin</h1>
        <p className="text-muted-foreground">Here is what is happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <CardDescription className="text-xs uppercase tracking-wider font-bold">Active Orders</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {activeOrdersCount}
              <ClipboardList className="h-6 w-6 text-accent opacity-20" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">Revenue Today</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              ₹{totalRevenue.toFixed(2)}
              <DollarSign className="h-6 w-6 text-green-500 opacity-20" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">Available Fleet</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {availableAgents}
              <Truck className="h-6 w-6 text-blue-500 opacity-20" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Store Performance
            </CardTitle>
            <CardDescription>Overview of recent sales and growth.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            <p className="text-sm italic">Analytics visualization coming soon.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" /> Recent Activity
            </CardTitle>
            <CardDescription>Latest events from your fleet and orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {remoteOrders?.slice(0, 5).map(order => (
              <div key={order.id} className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-full border shadow-sm flex-shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-bold truncate">ORD-{order.id}</p>
                      <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[9px] font-bold uppercase py-0 px-1.5 h-4">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      ₹{order.total?.toFixed(2)} • {order.address}
                    </p>
                  </div>
                </div>

                {!order.agentId && order.status !== 'DELIVERED' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="w-full h-8 text-[11px] font-bold border-primary text-primary hover:bg-primary/5 rounded-lg">
                        Assign Agent
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Delivery Agent</DialogTitle>
                        <CardDescription>Order: ORD-{order.id}</CardDescription>
                      </DialogHeader>
                      <div className="grid gap-3 py-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                        {agents?.filter(a => a.status === 'Available').map(agent => (
                          <div key={agent.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                <Truck className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{agent.firstName} {agent.lastName}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{agent.vehicleType || 'E-Bike'}</p>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => handleAssignAgent(order.id, agent.id)} className="h-8 font-bold text-xs">Assign</Button>
                          </div>
                        ))}
                        {agents?.filter(a => a.status === 'Available').length === 0 && (
                          <div className="py-8 text-center text-sm text-muted-foreground italic flex flex-col items-center gap-2">
                            <Truck className="h-8 w-8 opacity-20" />
                            No agents currently available.
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ))}
            {(!remoteOrders || remoteOrders.length === 0) && (
              <div className="py-8 text-center text-sm text-muted-foreground italic">
                No recent activity recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
